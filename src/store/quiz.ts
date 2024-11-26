import { create } from 'zustand';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  answers: number[];
  score: number;
  timeSpent: number;
  remainingTime: number | null;
  status: 'in-progress' | 'paused' | 'completed';
  startedAt: string;
  completedAt?: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  duration: number;
  questionsCount: number;
  status: 'draft' | 'published';
  settings: {
    allowRetakes: boolean;
    allowPause: boolean;
    maxAttempts: number;
  };
  questions: Question[];
  attempts: QuizAttempt[];
}

interface QuizState {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  fetchQuizzes: () => Promise<void>;
  addQuiz: (quiz: Omit<Quiz, 'id' | 'attempts'>) => Promise<Quiz>;
  updateQuiz: (id: string, quiz: Partial<Quiz>) => Promise<void>;
  deleteQuiz: (id: string) => Promise<void>;
  submitQuizAttempt: (attempt: Omit<QuizAttempt, 'score' | 'startedAt'>) => Promise<void>;
  pauseQuizAttempt: (quizId: string, studentId: string, remainingTime: number) => Promise<void>;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  quizzes: [],
  currentQuiz: null,

  fetchQuizzes: async () => {
    try {
      const response = await fetch('/api/quiz');
      const quizzes = await response.json();
      set({ quizzes });
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    }
  },

  addQuiz: async (quiz) => {
    try {
      console.log('Sending quiz data:', JSON.stringify(quiz, null, 2));
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quiz),
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        let errorMessage = 'Failed to create quiz';
        
        if (data.error === 'Validation error' && Array.isArray(data.details)) {
          errorMessage = data.details.map((err: any) => `${err.path}: ${err.message}`).join(', ');
        } else if (data.message) {
          errorMessage = data.message;
        } else if (typeof data.error === 'string') {
          errorMessage = data.error;
        }
        
        throw new Error(errorMessage);
      }

      const newQuiz = data;
      set((state) => ({
        quizzes: [...state.quizzes, newQuiz],
      }));
      return newQuiz;
    } catch (error) {
      console.error('Failed to add quiz:', error);
      throw error;
    }
  },

  updateQuiz: async (id, updatedQuiz) => {
    try {
      const response = await fetch(`/api/quiz/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedQuiz),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update quiz');
      }

      const updated = await response.json();
      set((state) => ({
        quizzes: state.quizzes.map((quiz) =>
          quiz.id === id ? { ...quiz, ...updated } : quiz
        ),
      }));
    } catch (error) {
      console.error('Failed to update quiz:', error);
      throw error;
    }
  },

  deleteQuiz: async (id) => {
    try {
      const quiz = get().quizzes.find((q) => q.id === id);
      if (!quiz) {
        throw new Error('Quiz not found');
      }

      if (quiz.status === 'published') {
        throw new Error('Cannot delete a published quiz');
      }

      const response = await fetch(`/api/quiz/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete quiz');
      }

      set((state) => ({
        quizzes: state.quizzes.filter((quiz) => quiz.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      throw error;
    }
  },

  submitQuizAttempt: async (attempt) => {
    try {
      const response = await fetch(`/api/quiz/${attempt.quizId}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...attempt,
          startedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit quiz attempt');
      }

      const submittedAttempt = await response.json();
      set((state) => ({
        quizzes: state.quizzes.map((quiz) =>
          quiz.id === attempt.quizId
            ? {
                ...quiz,
                attempts: [...quiz.attempts, submittedAttempt],
              }
            : quiz
        ),
      }));
    } catch (error) {
      console.error('Failed to submit quiz attempt:', error);
      throw error;
    }
  },

  pauseQuizAttempt: async (quizId, studentId, remainingTime) => {
    try {
      const response = await fetch(`/api/quiz/${quizId}/attempt/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          remainingTime,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to pause quiz attempt');
      }

      const pausedAttempt = await response.json();
      set((state) => ({
        quizzes: state.quizzes.map((quiz) =>
          quiz.id === quizId
            ? {
                ...quiz,
                attempts: quiz.attempts.map((attempt) =>
                  attempt.id === pausedAttempt.id ? pausedAttempt : attempt
                ),
              }
            : quiz
        ),
      }));
    } catch (error) {
      console.error('Failed to pause quiz attempt:', error);
      throw error;
    }
  },
}));