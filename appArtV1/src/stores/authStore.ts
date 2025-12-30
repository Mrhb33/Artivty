import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types/api';

export type ActiveMode = 'USER' | 'ARTIST';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeMode: ActiveMode;
  roleSelected: boolean; // Track if user has selected their role
  hasSeenWelcome: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
  setActiveMode: (mode: ActiveMode) => void;
  setRoleSelected: (selected: boolean) => void;
  markWelcomeSeen: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      activeMode: 'USER',
      roleSelected: false,
      hasSeenWelcome: false,

      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        // If user exists and has a role, mark as selected (for existing users)
        roleSelected: !!user && !!user.role,
      }),

      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: !!accessToken,
        }),

      login: (user, accessToken, refreshToken) =>
        set((state) => ({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          // Set activeMode based on user role, but preserve if already set
          activeMode: state.activeMode ?? (user.role === 'artist' ? 'ARTIST' : 'USER'),
          // If user has a role, mark as selected (for existing users)
          roleSelected: !!user.role,
          })),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          activeMode: 'USER',
          roleSelected: false,
          hasSeenWelcome: get().hasSeenWelcome,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      updateUser: (updates) =>
        set((state) => {
          const updatedUser = state.user ? { ...state.user, ...updates } : null;
          // If role is being updated, mark as selected
          const roleSelected = updates.role ? true : state.roleSelected;
          return {
            user: updatedUser,
            roleSelected,
          };
        }),

      setActiveMode: (activeMode) => set({ activeMode }),

      setRoleSelected: (roleSelected) => set({ roleSelected }),
      markWelcomeSeen: () => set({ hasSeenWelcome: true }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        activeMode: state.activeMode,
        roleSelected: state.roleSelected,
        hasSeenWelcome: state.hasSeenWelcome,
      }),
    }
  )
);
