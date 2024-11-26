import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { User } from '../models/User';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2),
  role: z.enum(['admin', 'student']).default('student'),
});

// Hash password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Register
router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const hashedPassword = hashPassword(data.password);

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = await User.create({
      ...data,
      password: hashedPassword,
    });

    // Remove password from response
    const { password, ...userData } = user.toObject();
    res.status(201).json(userData);
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    const data = loginSchema.parse(req.body);
    console.log('Login attempt for email:', data.email);
    
    console.log('Hashing provided password...');
    const hashedPassword = hashPassword(data.password);
    console.log('Provided password hash:', hashedPassword);

    // Find user
    const user = await User.findOne({ email: data.email });
    console.log('Found user:', user);

    if (!user) {
      console.log('No user found with email:', data.email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Stored password hash:', user.password);
    console.log('Comparing provided password hash with stored password hash...');
    console.log('Passwords match:', user.password === hashedPassword);

    if (user.password !== hashedPassword) {
      console.log('Password mismatch for user:', data.email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Remove password from response
    const { password, ...userData } = user.toObject();
    console.log('Sending user data:', userData);
    res.json(userData);
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

export { router };