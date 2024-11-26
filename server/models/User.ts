import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'student'],
    default: 'student',
  },
  assignments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  }]
}, {
  timestamps: true,
});

export const User = mongoose.model('User', userSchema);
