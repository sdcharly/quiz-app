import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
}

interface AuthState {
  isAuthenticated: boolean;
  role: 'admin' | 'student' | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  role: null,
  user: null,

  login: async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const user = await response.json();

      set({
        isAuthenticated: true,
        role: user.role,
        user,
      });
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    set({
      isAuthenticated: false,
      role: null,
      user: null,
    });
  },
}));