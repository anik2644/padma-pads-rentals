import { create } from "zustand";
import type { User as FirebaseUser } from "firebase/auth";

interface AuthState {
  firebaseUser: FirebaseUser | null;
  token: string | null;
  profileCompleted: boolean;
  loading: boolean;
  setUser: (u: FirebaseUser | null) => void;
  setToken: (t: string | null) => void;
  setProfileCompleted: (b: boolean) => void;
  setLoading: (b: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  token: null,
  profileCompleted: false,
  loading: true,
  setUser: (firebaseUser) => set({ firebaseUser }),
  setToken: (token) => set({ token }),
  setProfileCompleted: (profileCompleted) => set({ profileCompleted }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ firebaseUser: null, token: null, profileCompleted: false, loading: false }),
}));
