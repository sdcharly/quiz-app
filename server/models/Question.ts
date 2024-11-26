import mongoose from 'mongoose';

export interface IQuestion {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

const QuestionSchema = new mongoose.Schema<IQuestion>({
  text: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: Number, required: true },
  explanation: { type: String }
});

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
