import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthProvider = "email" | "phone" | "google" | "facebook" | "apple";

export interface ConnectedCredential {
  provider: AuthProvider;
  value: string; // email address, phone number, or social handle
  verified: boolean;
  loginEnabled: boolean;
  primary: boolean;
  addedAt: string;
}

export interface MockUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarInitials: string;
  avatarUrl?: string | null;
  city: string;
  joinedYear: string;
  verified: boolean;
  hasPassword: boolean;
  credentials: ConnectedCredential[];
}

interface AuthState {
  user: MockUser | null;
  token: string | null;
  profileCompleted: boolean;
  setUser: (u: MockUser | null) => void;
  setToken: (t: string | null) => void;
  updateUser: (patch: Partial<MockUser>) => void;
  addCredential: (c: ConnectedCredential) => void;
  removeCredential: (provider: AuthProvider, value: string) => void;
  updateCredential: (provider: AuthProvider, value: string, patch: Partial<ConnectedCredential>) => void;
  setPrimary: (provider: AuthProvider, value: string) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      profileCompleted: false,
      setUser: (user) => set({ user, profileCompleted: !!user }),
      setToken: (token) => set({ token }),
      updateUser: (patch) =>
        set((s) => (s.user ? { user: { ...s.user, ...patch } } : {})),
      addCredential: (c) =>
        set((s) => {
          if (!s.user) return {};
          const exists = s.user.credentials.some(
            (x) => x.provider === c.provider && x.value === c.value,
          );
          if (exists) return {};
          return { user: { ...s.user, credentials: [...s.user.credentials, c] } };
        }),
      removeCredential: (provider, value) =>
        set((s) => {
          if (!s.user) return {};
          return {
            user: {
              ...s.user,
              credentials: s.user.credentials.filter(
                (c) => !(c.provider === provider && c.value === value),
              ),
            },
          };
        }),
      updateCredential: (provider, value, patch) =>
        set((s) => {
          if (!s.user) return {};
          return {
            user: {
              ...s.user,
              credentials: s.user.credentials.map((c) =>
                c.provider === provider && c.value === value ? { ...c, ...patch } : c,
              ),
            },
          };
        }),
      setPrimary: (provider, value) =>
        set((s) => {
          if (!s.user) return {};
          return {
            user: {
              ...s.user,
              credentials: s.user.credentials.map((c) => ({
                ...c,
                primary: c.provider === provider && c.value === value,
              })),
            },
          };
        }),
      signOut: () => set({ user: null, token: null, profileCompleted: false }),
    }),
    { name: "homebee-auth" },
  ),
);
