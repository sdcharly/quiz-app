import { Router } from 'express';
import { User } from '../models/User';
import { Quiz } from '../models/Quiz';
import { QuizAttempt } from '../models/QuizAttempt';

const router = Router();

// Get all students
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .populate({
        path: 'attempts',
        model: QuizAttempt
      })
      .exec();

    res.json(students);
  } catch (error) {
    console.error('Failed to fetch students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Assign quiz to student
router.post('/assign', async (req, res) => {
  try {
    const { quizId, userId } = req.body;

    // Verify that both quiz and user exist
    const [quiz, user] = await Promise.all([
      Quiz.findById(quizId),
      User.findById(userId)
    ]);

    if (!quiz || !user) {
      return res.status(404).json({ error: 'Quiz or user not found' });
    }

    // Add the quiz to user's assignments
    user.assignments = user.assignments || [];
    user.assignments.push(quizId);
    await user.save();

    res.json({ quizId, userId });
  } catch (error) {
    console.error('Failed to assign quiz:', error);
    res.status(400).json({ error: 'Invalid input' });
  }
});

// Get student's assigned quizzes
router.get('/:id/quizzes', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate({
        path: 'assignments',
        model: Quiz,
        populate: {
          path: 'questions'
        }
      })
      .exec();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.assignments || []);
  } catch (error) {
    console.error('Failed to fetch assigned quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch assigned quizzes' });
  }
});

export { router };