import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';
import { useSyncStore } from '../store/syncStore';

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  currency?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export const authService = {
  async signUp({ email, password, fullName, currency = 'INR' }: SignUpParams) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          currency,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  async signIn({ email, password }: SignInParams) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPasswordForEmail(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'montra://reset-password',
    });
    if (error) throw error;
    return data;
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Error fetching profile:', error.message);
    }
    return data;
  },

  async ensureProfile(user: { id: string; email?: string; user_metadata?: Record<string, any> }): Promise<Profile> {
    const existing = await this.getProfile(user.id);
    if (existing) {
      // Ensure the user has at least one account and standard categories
      await this.ensureDefaultAccountsAndCategories(user.id);
      return existing;
    }

    const initialProfile: Omit<Profile, 'created_at' | 'updated_at'> = {
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      avatar_url: null,
      currency: user.user_metadata?.currency || 'INR',
      monthly_salary: 0,
      salary_date: 1,
      theme_preference: 'system',
      notification_preferences: {
        budget_alerts: true,
        salary_reminder: true,
        group_updates: true,
        goal_progress: true,
      },
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(initialProfile, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      // Retry simple select in case trigger inserted concurrently or SELECT/RLS differed
      const refetched = await this.getProfile(user.id);
      if (refetched) {
        await this.ensureDefaultAccountsAndCategories(user.id);
        return refetched;
      }
      console.warn('Failed to upsert profile:', error.message);
      return {
        ...initialProfile,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Ensure default account and categories
    await this.ensureDefaultAccountsAndCategories(user.id);
    return data;
  },

  async ensureDefaultAccountsAndCategories(userId: string): Promise<void> {
    try {
      // 1. Check if user has an account; if not, create "Primary Bank" and "Cash"
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (!accounts || accounts.length === 0) {
        await supabase.from('accounts').insert([
          {
            user_id: userId,
            name: 'Primary Bank',
            type: 'bank',
            balance: 0.00,
            balance_minor: 0,
            is_default: true,
          },
          {
            user_id: userId,
            name: 'Cash',
            type: 'cash',
            balance: 0.00,
            balance_minor: 0,
            is_default: false,
          },
        ]);
      }

      // 2. Check if user has categories; if not, seed system categories
      const { data: categories } = await supabase
        .from('transaction_categories')
        .select('id')
        .or(`user_id.eq.${userId},is_system.eq.true`)
        .limit(1);

      if (!categories || categories.length === 0) {
        await supabase.from('transaction_categories').insert([
          { user_id: userId, name: 'Salary', type: 'income', icon: 'wallet', color: '#607D68', is_system: true },
          { user_id: userId, name: 'Freelance', type: 'income', icon: 'briefcase', color: '#758078', is_system: true },
          { user_id: userId, name: 'Rent', type: 'expense', icon: 'home', color: '#8A9A86', is_system: true },
          { user_id: userId, name: 'Groceries', type: 'expense', icon: 'shopping-bag', color: '#6B8E73', is_system: true },
          { user_id: userId, name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#B96F68', is_system: true },
          { user_id: userId, name: 'Transportation', type: 'expense', icon: 'car', color: '#7E8C82', is_system: true },
          { user_id: userId, name: 'Electricity', type: 'expense', icon: 'zap', color: '#B68B4B', is_system: true },
          { user_id: userId, name: 'Shopping', type: 'expense', icon: 'tag', color: '#A87C77', is_system: true },
          { user_id: userId, name: 'Internet & Bills', type: 'expense', icon: 'wifi', color: '#6F887C', is_system: true },
          { user_id: userId, name: 'Healthcare', type: 'expense', icon: 'heart-pulse', color: '#B96F68', is_system: true },
          { user_id: userId, name: 'Entertainment', type: 'expense', icon: 'film', color: '#A68560', is_system: true },
          { user_id: userId, name: 'Other Expenses', type: 'expense', icon: 'tag', color: '#9BA49E', is_system: true },
        ]);
      }
    } catch (e) {
      console.warn('Error in ensureDefaultAccountsAndCategories:', e);
    }
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    useSyncStore.getState().bumpSync();
    return data;
  },
};

