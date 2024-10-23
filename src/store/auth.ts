import { create } from 'zustand';

type UserRole = 'admin' | 'student' | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface Student extends User {
  role: 'student';
  assignedQuizzes: string[]; // Quiz IDs
  completedQuizzes: {
    quizId: string;
    score: number;
    completedAt: string;
  }[];
}

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole;
  user: User | null;
  students: Student[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  addStudent: (student: Omit<Student, 'id' | 'role' | 'assignedQuizzes' | 'completedQuizzes'>) => void;
  removeStudent: (id: string) => void;
  assignQuiz: (studentId: string, quizId: string) => void;
  unassignQuiz: (studentId: string, quizId: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  role: null,
  user: null,
  students: [],
  login: async (email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!email || !password) {
      throw new Error('Invalid credentials');
    }

    const isAdmin = email.includes('admin');
    const userId = crypto.randomUUID();

    if (isAdmin) {
      set({
        isAuthenticated: true,
        role: 'admin',
        user: {
          id: userId,
          name: 'Admin User',
          email,
          role: 'admin',
        },
      });
    } else {
      // Create or get existing student
      const studentId = userId;
      set((state) => {
        // Check if student already exists
        const existingStudent = state.students.find(s => s.email === email);
        if (existingStudent) {
          return {
            isAuthenticated: true,
            role: 'student',
            user: existingStudent,
          };
        }

        // Create new student
        const newStudent: Student = {
          id: studentId,
          name: 'Student User',
          email,
          role: 'student',
          assignedQuizzes: [],
          completedQuizzes: [],
        };

        return {
          isAuthenticated: true,
          role: 'student',
          user: newStudent,
          students: [...state.students, newStudent],
        };
      });
    }
  },
  logout: () => {
    set({
      isAuthenticated: false,
      role: null,
      user: null,
    });
  },
  addStudent: (student) => {
    set((state) => ({
      students: [
        ...state.students,
        {
          ...student,
          id: crypto.randomUUID(),
          role: 'student',
          assignedQuizzes: [],
          completedQuizzes: [],
        },
      ],
    }));
  },
  removeStudent: (id) => {
    set((state) => ({
      students: state.students.filter((s) => s.id !== id),
    }));
  },
  assignQuiz: (studentId, quizId) => {
    set((state) => ({
      students: state.students.map((student) =>
        student.id === studentId
          ? {
              ...student,
              assignedQuizzes: [...new Set([...student.assignedQuizzes, quizId])],
            }
          : student
      ),
      // Update current user if it's the same student
      user: state.user?.id === studentId
        ? {
            ...state.user,
            assignedQuizzes: [...new Set([...(state.user as Student).assignedQuizzes, quizId])],
          }
        : state.user,
    }));
  },
  unassignQuiz: (studentId, quizId) => {
    set((state) => ({
      students: state.students.map((student) =>
        student.id === studentId
          ? {
              ...student,
              assignedQuizzes: student.assignedQuizzes.filter((id) => id !== quizId),
            }
          : student
      ),
      // Update current user if it's the same student
      user: state.user?.id === studentId
        ? {
            ...state.user,
            assignedQuizzes: (state.user as Student).assignedQuizzes.filter((id) => id !== quizId),
          }
        : state.user,
    }));
  },
}));