import { create } from 'zustand';
import { Session, User, Subscription } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
import { Profile } from '../types/database';
import { useSyncStore } from './syncStore';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  initializeAuth: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

let authSubscription: Subscription | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const profile = await authService.ensureProfile(user);
      set({ profile });
      useSyncStore.getState().bumpSync();
    } catch (e) {
      console.warn('Failed to refresh profile:', e);
    }
  },

  initializeAuth: async () => {
    try {
      set({ isLoading: true });
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await authService.ensureProfile(session.user);
        set({
          session,
          user: session.user,
          profile,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        set({
          session: null,
          user: null,
          profile: null,
          isLoading: false,
          isInitialized: true,
        });
      }

      if (!authSubscription) {
        const { data } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          if (newSession?.user) {
            const profile = await authService.ensureProfile(newSession.user);
            set({
              session: newSession,
              user: newSession.user,
              profile,
              isLoading: false,
            });
            useSyncStore.getState().bumpSync();
          } else {
            set({
              session: null,
              user: null,
              profile: null,
              isLoading: false,
            });
            useSyncStore.getState().bumpSync();
          }
        });
        authSubscription = data.subscription;
      }
    } catch (error) {
      console.warn('Auth initialization error:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await authService.signOut();
    } finally {
      set({ user: null, session: null, profile: null, isLoading: false });
      useSyncStore.getState().bumpSync();
    }
  },
}));
