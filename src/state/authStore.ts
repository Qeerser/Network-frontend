
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthState {
  // Auth status
  isAuthenticated: boolean;
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Mock user database for development
const MOCK_USERS: User[] = [
  { id: '1', email: 'test@example.com', username: 'testuser' }
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      currentUser: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Simple validation - in production, this would be a real API call
          const foundUser = MOCK_USERS.find(user => user.email === email);
          
          if (foundUser && password === 'password') { // Very simple password check for demo
            set({ 
              isAuthenticated: true, 
              currentUser: foundUser,
              isLoading: false 
            });
          } else {
            set({ 
              error: 'Invalid email or password', 
              isLoading: false 
            });
          }
        } catch (err) {
          set({ 
            error: 'An error occurred during login', 
            isLoading: false 
          });
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true, error: null });

        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Check if user already exists
          const userExists = MOCK_USERS.some(user => user.email === email);
          
          if (userExists) {
            set({ 
              error: 'User with this email already exists', 
              isLoading: false 
            });
            return;
          }

          // Create new user (in production, this would be a real API call)
          const newUser: User = {
            id: String(MOCK_USERS.length + 1),
            email,
            username
          };
          
          // Add to mock DB (in memory only)
          MOCK_USERS.push(newUser);

          // Auto-login after successful registration
          set({ 
            isAuthenticated: true, 
            currentUser: newUser,
            isLoading: false 
          });
        } catch (err) {
          set({ 
            error: 'An error occurred during registration', 
            isLoading: false 
          });
        }
      },

      logout: () => {
        set({ 
          isAuthenticated: false, 
          currentUser: null 
        });
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser
      })
    }
  )
);
