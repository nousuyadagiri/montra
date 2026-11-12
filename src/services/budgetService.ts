import { supabase } from '../lib/supabase';
import { Budget, BudgetCategory } from '../types/database';
import { useSyncStore } from '../store/syncStore';

export interface CreateBudgetInput {
  name: string;
  period: 'monthly' | 'weekly' | 'yearly';
  month?: number;
  year: number;
  totalLimit: number;
  categories: {
    categoryId: string;
    allocatedAmount: number;
  }[];
}

export interface BudgetWithSpending extends Budget {
  totalSpent: number;
  remainingAmount: number;
  spentPercentage: number;
  categoriesWithSpending: (BudgetCategory & {
    spentAmount: number;
    remainingAmount: number;
    spentPercentage: number;
  })[];
}

export const budgetService = {
  async getBudgets(userId: string, year?: number, month?: number): Promise<BudgetWithSpending[]> {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    let query = supabase
      .from('budgets')
      .select('*, categories:budget_categories(*, category:transaction_categories(*))')
      .eq('user_id', userId)
      .eq('year', targetYear);

    if (month) {
      query = query.eq('month', targetMonth);
    }

    const { data: budgets, error } = await query;
    if (error) throw error;
    if (!budgets || budgets.length === 0) return [];

    // Calculate actual spending for each category during the period
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1).toISOString().split('T')[0];
    const endOfMonth = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

    const { data: expenses } = await supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);

    const spendingByCategory: Record<string, number> = {};
    let totalSpentOverall = 0;

    (expenses || []).forEach((txn) => {
      if (txn.category_id) {
        spendingByCategory[txn.category_id] = (spendingByCategory[txn.category_id] || 0) + Number(txn.amount);
      }
      totalSpentOverall += Number(txn.amount);
    });

    return (budgets as Budget[]).map((budget) => {
      let budgetSpent = 0;

      const categoriesWithSpending = (budget.categories || []).map((cat) => {
        const spent = spendingByCategory[cat.category_id] || 0;
        budgetSpent += spent;
        const allocated = Number(cat.allocated_amount);
        const remaining = Math.max(0, allocated - spent);
        const pct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;

        return {
          ...cat,
          spentAmount: spent,
          remainingAmount: remaining,
          spentPercentage: pct,
        };
      });

      const totalLimit = Number(budget.total_limit);
      const totalSpent = categoriesWithSpending.length > 0 ? budgetSpent : totalSpentOverall;
      const remainingAmount = Math.max(0, totalLimit - totalSpent);
      const spentPercentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

      return {
        ...budget,
        totalSpent,
        remainingAmount,
        spentPercentage,
        categoriesWithSpending,
      };
    });
  },

  async getBudgetById(budgetId: string): Promise<Budget | null> {
    const { data, error } = await supabase
      .from('budgets')
      .select('*, categories:budget_categories(*, category:transaction_categories(*))')
      .eq('id', budgetId)
      .single();

    if (error) throw error;
    return data;
  },

  async createBudget(userId: string, input: CreateBudgetInput): Promise<Budget> {
    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .insert({
        user_id: userId,
        name: input.name,
        period: input.period,
        month: input.month,
        year: input.year,
        total_limit: input.totalLimit,
      })
      .select()
      .single();

    if (budgetError) throw budgetError;

    if (input.categories && input.categories.length > 0) {
      const catRows = input.categories.map((c) => ({
        budget_id: budget.id,
        category_id: c.categoryId,
        allocated_amount: c.allocatedAmount,
      }));

      const { error: catError } = await supabase.from('budget_categories').insert(catRows);
      if (catError) {
        await supabase.from('budgets').delete().eq('id', budget.id);
        throw catError;
      }
    }

    useSyncStore.getState().bumpSync();
    return budget;
  },

  async updateBudget(
    budgetId: string,
    input: Partial<CreateBudgetInput>
  ): Promise<Budget> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.name !== undefined) payload.name = input.name;
    if (input.period !== undefined) payload.period = input.period;
    if (input.month !== undefined) payload.month = input.month;
    if (input.year !== undefined) payload.year = input.year;
    if (input.totalLimit !== undefined) payload.total_limit = input.totalLimit;

    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .update(payload)
      .eq('id', budgetId)
      .select()
      .single();

    if (budgetError) throw budgetError;

    if (input.categories !== undefined) {
      await supabase.from('budget_categories').delete().eq('budget_id', budgetId);
      if (input.categories.length > 0) {
        const catRows = input.categories.map((c) => ({
          budget_id: budgetId,
          category_id: c.categoryId,
          allocated_amount: c.allocatedAmount,
        }));
        const { error: catErr } = await supabase.from('budget_categories').insert(catRows);
        if (catErr) throw catErr;
      }
    }

    useSyncStore.getState().bumpSync();
    return budget;
  },

  async deleteBudget(budgetId: string): Promise<void> {
    const { error } = await supabase.from('budgets').delete().eq('id', budgetId);
    if (error) throw error;
    useSyncStore.getState().bumpSync();
  },
};

