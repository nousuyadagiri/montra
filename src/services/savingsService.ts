import { supabase } from '../lib/supabase';
import { SavingsGoal, SavingsContribution } from '../types/database';

export interface CreateGoalInput {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: string;
  category?: string;
}

export const savingsService = {
  async getGoals(userId: string): Promise<SavingsGoal[]> {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('is_completed', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getGoalById(goalId: string): Promise<{ goal: SavingsGoal; contributions: SavingsContribution[] } | null> {
    const { data: goal, error: goalError } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (goalError) throw goalError;

    const { data: contributions, error: contribError } = await supabase
      .from('savings_contributions')
      .select('*')
      .eq('goal_id', goalId)
      .order('date', { ascending: false });

    if (contribError) throw contribError;

    return {
      goal,
      contributions: contributions || [],
    };
  },

  async createGoal(userId: string, input: CreateGoalInput): Promise<SavingsGoal> {
    const { data, error } = await supabase
      .from('savings_goals')
      .insert({
        user_id: userId,
        name: input.name,
        target_amount: input.targetAmount,
        current_amount: input.currentAmount || 0,
        target_date: input.targetDate || null,
        category: input.category || 'General',
        is_completed: (input.currentAmount || 0) >= input.targetAmount,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addContribution(
    goalId: string,
    userId: string,
    amount: number,
    type: 'deposit' | 'withdrawal' = 'deposit',
    notes?: string
  ): Promise<SavingsContribution> {
    const { data: contribution, error } = await supabase
      .from('savings_contributions')
      .insert({
        goal_id: goalId,
        user_id: userId,
        amount,
        type,
        notes: notes || null,
        date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;

    // Update goal current amount
    const { data: goal } = await supabase
      .from('savings_goals')
      .select('current_amount, target_amount')
      .eq('id', goalId)
      .single();

    if (goal) {
      const delta = type === 'deposit' ? amount : -amount;
      const updatedAmount = Math.max(0, Number((Number(goal.current_amount) + delta).toFixed(2)));
      const isCompleted = updatedAmount >= Number(goal.target_amount);

      await supabase
        .from('savings_goals')
        .update({
          current_amount: updatedAmount,
          is_completed: isCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goalId);
    }

    return contribution;
  },

  async deleteGoal(goalId: string): Promise<void> {
    const { error } = await supabase.from('savings_goals').delete().eq('id', goalId);
    if (error) throw error;
  },
};

