import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// Get all students
router.get('/students', async (req, res) => {
  const students = await prisma.user.findMany({
    where: {
      role: 'student',
    },
    include: {
      assignments: true,
      attempts: true,
    },
  });
  res.json(students);
});

// Assign quiz to student
router.post('/assign', async (req, res) => {
  try {
    const { quizId, userId } = req.body;

    const assignment = await prisma.quizAssignment.create({
      data: {
        quizId,
        userId,
      },
    });

    res.json(assignment);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input' });
  }
});

// Get student's assigned quizzes
router.get('/:id/quizzes', async (req, res) => {
  const assignments = await prisma.quizAssignment.findMany({
    where: {
      userId: req.params.id,
    },
    include: {
      quiz: {
        include: {
          questions: true,
        },
      },
    },
  });
  res.json(assignments);
});

export { router };