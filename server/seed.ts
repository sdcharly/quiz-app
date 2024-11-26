import mongoose from 'mongoose';
import { User } from './models/User';
import { Quiz } from './models/Quiz';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/quiz_app');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Quiz.deleteMany({}),
    ]);

    // Create admin user
    const adminUser = await User.create({
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashPassword('admin123'),
      role: 'admin',
    });

    // Create student user
    const studentUser = await User.create({
      email: 'student@example.com',
      name: 'Student User',
      password: hashPassword('student123'),
      role: 'student',
    });

    // Create sample quiz
    const quiz = await Quiz.create({
      title: 'Sample Quiz',
      description: 'This is a sample quiz to test the application',
      duration: 30,
      questionsCount: 2,
      status: 'draft',
      settings: {
        allowRetakes: true,
        allowPause: true,
        maxAttempts: 3,
      },
      questions: [
        {
          text: 'What is 2 + 2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: 1,
          explanation: 'Basic arithmetic: 2 + 2 = 4',
        },
        {
          text: 'What is the capital of France?',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correctAnswer: 2,
          explanation: 'Paris is the capital of France',
        },
      ],
      authorId: adminUser._id,
    });

    console.log('Database seeded successfully!');
    console.log('Admin user:', adminUser.toObject());
    console.log('Student user:', studentUser.toObject());
    console.log('Sample quiz:', quiz.toObject());

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
