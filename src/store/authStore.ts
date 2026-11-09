import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
import { Profile } from '../types/database';

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
      const profile = await authService.getProfile(user.id);
      if (profile) {
        set({ profile });
      }
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
        let profile = await authService.getProfile(session.user.id);
        if (!profile) {
          // Fallback initial profile in case trigger hasn't fired yet
          profile = {
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            currency: 'INR',
            monthly_salary: 0,
            salary_date: 1,
            theme_preference: 'system',
            notification_preferences: {
              budget_alerts: true,
              salary_reminder: true,
              group_updates: true,
              goal_progress: true,
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        set({ session, user: session.user, profile, isLoading: false, isInitialized: true });
      } else {
        set({ session: null, user: null, profile: null, isLoading: false, isInitialized: true });
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (newSession?.user) {
          const profile = await authService.getProfile(newSession.user.id);
          set({ session: newSession, user: newSession.user, profile, isLoading: false });
        } else {
          set({ session: null, user: null, profile: null, isLoading: false });
        }
      });
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
    }
  },
}));

