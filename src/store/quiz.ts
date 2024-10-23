import { create } from 'zustand';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  answers: number[];
  score: number;
  completedAt: string | null;
  timeSpent: number;
  remainingTime: number | null;
  status: 'completed' | 'in-progress' | 'paused';
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  duration: number;
  questionsCount: number;
  status: 'draft' | 'published';
  questions: Question[];
  createdAt: string;
  attempts: QuizAttempt[];
  settings: {
    allowRetakes: boolean;
    allowPause: boolean;
    maxAttempts: number;
  };
}

interface QuizState {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  setCurrentQuiz: (quiz: Quiz | null) => void;
  addQuiz: (quiz: Quiz) => void;
  updateQuiz: (id: string, quiz: Partial<Quiz>) => void;
  submitQuizAttempt: (attempt: Omit<QuizAttempt, 'score'>) => void;
  pauseQuizAttempt: (quizId: string, studentId: string, remainingTime: number) => void;
  resumeQuizAttempt: (quizId: string, studentId: string) => QuizAttempt | null;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  quizzes: [],
  currentQuiz: null,
  setCurrentQuiz: (quiz) => set({ currentQuiz: quiz }),
  addQuiz: (quiz) =>
    set((state) => ({
      quizzes: [
        ...state.quizzes,
        {
          ...quiz,
          attempts: [],
          settings: {
            allowRetakes: false,
            allowPause: false,
            maxAttempts: 1,
          },
        },
      ],
    })),
  updateQuiz: (id, updatedQuiz) =>
    set((state) => ({
      quizzes: state.quizzes.map((quiz) =>
        quiz.id === id ? { ...quiz, ...updatedQuiz } : quiz
      ),
    })),
  submitQuizAttempt: (attempt) =>
    set((state) => {
      const quiz = state.quizzes.find((q) => q.id === attempt.quizId);
      if (!quiz) return state;

      const score = quiz.questions.reduce((acc, question, index) => {
        return acc + (question.correctAnswer === attempt.answers[index] ? 1 : 0);
      }, 0);

      const finalAttempt = {
        ...attempt,
        score: (score / quiz.questions.length) * 100,
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
      };

      return {
        quizzes: state.quizzes.map((q) =>
          q.id === quiz.id
            ? {
                ...q,
                attempts: [...q.attempts.filter(a => 
                  !(a.studentId === attempt.studentId && a.status === 'in-progress')
                ), finalAttempt],
              }
            : q
        ),
      };
    }),
  pauseQuizAttempt: (quizId, studentId, remainingTime) =>
    set((state) => {
      const quiz = state.quizzes.find((q) => q.id === quizId);
      if (!quiz) return state;

      const attempt = quiz.attempts.find(
        (a) => a.studentId === studentId && a.status === 'in-progress'
      );

      if (!attempt) return state;

      const pausedAttempt = {
        ...attempt,
        status: 'paused' as const,
        remainingTime,
      };

      return {
        quizzes: state.quizzes.map((q) =>
          q.id === quizId
            ? {
                ...q,
                attempts: [
                  ...q.attempts.filter((a) => a.id !== attempt.id),
                  pausedAttempt,
                ],
              }
            : q
        ),
      };
    }),
  resumeQuizAttempt: (quizId, studentId) => {
    const quiz = get().quizzes.find((q) => q.id === quizId);
    if (!quiz) return null;

    const pausedAttempt = quiz.attempts.find(
      (a) => a.studentId === studentId && a.status === 'paused'
    );

    if (!pausedAttempt) return null;

    set((state) => ({
      quizzes: state.quizzes.map((q) =>
        q.id === quizId
          ? {
              ...q,
              attempts: [
                ...q.attempts.filter((a) => a.id !== pausedAttempt.id),
                { ...pausedAttempt, status: 'in-progress' as const },
              ],
            }
          : q
      ),
    }));

    return { ...pausedAttempt, status: 'in-progress' as const };
  },
}));