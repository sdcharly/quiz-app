import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  options: [{
    type: String,
    required: true,
  }],
  correctAnswer: {
    type: Number,
    required: true,
  },
  explanation: String,
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
  },
  questionsCount: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
  },
  settings: {
    allowRetakes: {
      type: Boolean,
      default: false,
    },
    allowPause: {
      type: Boolean,
      default: false,
    },
    maxAttempts: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  questions: [questionSchema],
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

export const Quiz = mongoose.model('Quiz', quizSchema);
