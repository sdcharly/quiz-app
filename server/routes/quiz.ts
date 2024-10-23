import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';

const router = Router();

// Validation schemas
const questionSchema = z.object({
  text: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number(),
  explanation: z.string().optional(),
});

const quizSchema = z.object({
  title: z.string(),
  description: z.string(),
  duration: z.number(),
  questionsCount: z.number(),
  settings: z.object({
    allowRetakes: z.boolean(),
    allowPause: z.boolean(),
    maxAttempts: z.number(),
  }),
  questions: z.array(questionSchema),
});

// Create quiz
router.post('/', async (req, res) => {
  try {
    const data = quizSchema.parse(req.body);

    const quiz = await prisma.quiz.create({
      data: {
        ...data,
        settings: data.settings,
        questions: {
          create: data.questions,
        },
      },
      include: {
        questions: true,
      },
    });

    res.json(quiz);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input' });
  }
});

// Get all quizzes
router.get('/', async (req, res) => {
  const quizzes = await prisma.quiz.findMany({
    include: {
      questions: true,
      attempts: true,
      assignments: true,
    },
  });
  res.json(quizzes);
});

// Get quiz by ID
router.get('/:id', async (req, res) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: req.params.id },
    include: {
      questions: true,
      attempts: true,
      assignments: true,
    },
  });

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  res.json(quiz);
});

// Update quiz
router.put('/:id', async (req, res) => {
  try {
    const data = quizSchema.parse(req.body);

    const quiz = await prisma.quiz.update({
      where: { id: req.params.id },
      data: {
        ...data,
        settings: data.settings,
        questions: {
          deleteMany: {},
          create: data.questions,
        },
      },
      include: {
        questions: true,
      },
    });

    res.json(quiz);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input' });
  }
});

// Submit attempt
router.post('/:id/attempt', async (req, res) => {
  try {
    const attempt = await prisma.quizAttempt.create({
      data: {
        ...req.body,
        quizId: req.params.id,
      },
    });

    res.json(attempt);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input' });
  }
});

export { router };