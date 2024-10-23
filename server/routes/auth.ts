import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import crypto from 'crypto';

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

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const hashedPassword = hashPassword(data.password);

    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
      },
    });

    if (!user || user.password !== hashedPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input' });
  }
});

export { router };