import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: Date;
}

export type AuthStatus = "loading" | "authenticated" | "guest";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  isInitialized: boolean;
  // Computed helpers for backward compatibility
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      status: "loading" as AuthStatus,
      isInitialized: false,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => {
        const newStatus = user ? "authenticated" : "guest";
        set({
          user,
          status: newStatus,
          isAuthenticated: !!user,
          isLoading: false,
        });
      },
      clearUser: () => {
        set({
          user: null,
          status: "guest",
          isAuthenticated: false,
          isLoading: false,
        });
      },
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      setInitialized: (initialized) => {
        set({ isInitialized: initialized });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        // Don't persist status or isInitialized - these should be recomputed on mount
      }),
    },
  ),
);
