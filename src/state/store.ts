
import { create } from 'zustand';

// This is a placeholder for future state management with Zustand
// We can expand this as needed for the application

interface AppState {
  // Example state properties
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
