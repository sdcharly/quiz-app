import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  answers: [{
    type: Number,
    required: true,
  }],
  score: {
    type: Number,
  },
  timeSpent: {
    type: Number,
    required: true,
  },
  remainingTime: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['in-progress', 'paused', 'completed'],
    default: 'in-progress',
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

export const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
