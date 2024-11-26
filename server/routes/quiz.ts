import { Router } from 'express';
import { z } from 'zod';
import { Quiz } from '../models/Quiz';
import { User } from '../models/User';
import { QuizAttempt } from '../models/QuizAttempt';
import { Question } from '../models/Question';

const router = Router();

// Validation schemas
const questionSchema = z.object({
  text: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number(),
  explanation: z.string().optional(),
});

const settingsSchema = z.object({
  allowRetakes: z.boolean(),
  allowPause: z.boolean(),
  maxAttempts: z.number().min(1),
});

const quizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  questionsCount: z.number().min(1, "Must have at least 1 question"),
  status: z.enum(['draft', 'published']).default('draft'),
  settings: settingsSchema,
  questions: z.array(questionSchema).default([]),
});

// Create quiz
router.post('/', async (req, res) => {
  console.log('=== Starting quiz creation ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    // Step 1: Get a valid user
    const user = await User.findOne({ role: 'admin' });

    if (!user) {
      throw new Error('No admin user found. Please run the seed script first.');
    }

    // Step 2: Validate the input data
    console.log('Step 2: Validating input data...');
    const validatedData = quizSchema.parse(req.body);
    console.log('Validation successful:', JSON.stringify(validatedData, null, 2));

    // Step 3: Create the quiz with questions
    console.log('Step 3: Creating quiz and questions...');
    const quiz = await Quiz.create({
      title: validatedData.title,
      description: validatedData.description,
      duration: validatedData.duration,
      questionsCount: validatedData.questions.length,
      status: validatedData.status,
      settings: validatedData.settings,
      authorId: user._id,
    });

    // Create questions
    await Promise.all(validatedData.questions.map(async (question) => {
      await Question.create({
        text: question.text,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        quizId: quiz._id,
      });
    }));

    console.log('Quiz created successfully:', JSON.stringify(quiz, null, 2));
    res.status(201).json(quiz);
  } catch (error) {
    console.error('Error in quiz creation:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    res.status(500).json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
});

// Get all quizzes
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate('authorId', '-password')
      .exec();

    res.json(quizzes);
  } catch (error) {
    console.error('Failed to fetch quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Get quiz by ID
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('authorId', '-password')
      .populate('questions')
      .exec();

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json(quiz);
  } catch (error) {
    console.error('Failed to fetch quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Update quiz
router.put('/:id', async (req, res) => {
  try {
    const validatedData = quizSchema.parse(req.body);

    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      {
        title: validatedData.title,
        description: validatedData.description,
        duration: validatedData.duration,
        questionsCount: validatedData.questions.length,
        status: validatedData.status,
        settings: validatedData.settings,
      },
      { new: true }
    ).populate('authorId', '-password');

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Update questions
    await Question.deleteMany({ quizId: req.params.id });
    await Promise.all(validatedData.questions.map(async (question) => {
      await Question.create({
        text: question.text,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        quizId: req.params.id,
      });
    }));

    const updatedQuiz = await Quiz.findById(req.params.id)
      .populate('authorId', '-password')
      .populate('questions')
      .exec();

    res.json(updatedQuiz);
  } catch (error) {
    console.error('Failed to update quiz:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

// Delete quiz
router.delete('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.status === 'published') {
      return res.status(403).json({ error: 'Cannot delete a published quiz' });
    }

    // Delete quiz attempts, questions and the quiz
    await Promise.all([
      QuizAttempt.deleteMany({ quizId: req.params.id }),
      Question.deleteMany({ quizId: req.params.id }),
      Quiz.findByIdAndDelete(req.params.id)
    ]);

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete quiz:', error);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// Submit attempt
router.post('/:id/attempt', async (req, res) => {
  try {
    const attempt = await QuizAttempt.create({
      ...req.body,
      quizId: req.params.id,
    });

    res.json(attempt);
  } catch (error) {
    console.error('Failed to submit attempt:', error);
    res.status(400).json({ error: 'Invalid input' });
  }
});

export { router };