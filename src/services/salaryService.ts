import { supabase } from '../lib/supabase';
import { authService } from './authService';
import { useSyncStore } from '../store/syncStore';

export interface SalaryAllocation {
  category: string;
  percentage: number;
  suggestedAmount: number;
  icon: string;
  color: string;
}

export const DEFAULT_ALLOCATION_RULES = [
  { category: 'Rent & Housing', percentage: 25, icon: 'Home', color: '#60A5FA' },
  { category: 'Food & Groceries', percentage: 15, icon: 'Utensils', color: '#F87171' },
  { category: 'Transportation', percentage: 8, icon: 'Car', color: '#A78BFA' },
  { category: 'Savings', percentage: 20, icon: 'PiggyBank', color: '#4ADE80' },
  { category: 'Investments', percentage: 12, icon: 'TrendingUp', color: '#818CF8' },
  { category: 'Shopping & Leisure', percentage: 10, icon: 'ShoppingBag', color: '#F472B6' },
  { category: 'Emergency / Other', percentage: 10, icon: 'Shield', color: '#FBBF24' },
];

export const salaryService = {
  async updateSalarySettings(userId: string, salary: number, salaryDate: number) {
    return await authService.updateProfile(userId, {
      monthly_salary: salary,
      salary_date: salaryDate,
    });
  },

  calculateAllocations(monthlySalary: number, customRules = DEFAULT_ALLOCATION_RULES): SalaryAllocation[] {
    return customRules.map((rule) => {
      const suggestedAmount = Math.round((monthlySalary * rule.percentage) / 100);
      return {
        category: rule.category,
        percentage: rule.percentage,
        suggestedAmount,
        icon: rule.icon,
        color: rule.color,
      };
    });
  },

  async recordSalaryReceived(
    userId: string,
    accountId: string,
    amount: number,
    date: string = new Date().toISOString().split('T')[0]
  ) {
    // 1. Find or create 'Salary' category
    const { data: cat } = await supabase
      .from('transaction_categories')
      .select('id')
      .eq('name', 'Salary')
      .eq('type', 'income')
      .limit(1)
      .maybeSingle();

    const categoryId = cat?.id || null;

    // 2. Insert transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        account_id: accountId,
        category_id: categoryId,
        type: 'income',
        amount,
        amount_minor: Math.round(amount * 100),
        title: 'Monthly Salary Credit',
        date,
        payment_method: 'Bank Transfer',
        notes: 'Automated salary record',
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Update account balance
    const { data: acc } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    if (acc) {
      await supabase
        .from('accounts')
        .update({
          balance: Number((Number(acc.balance) + amount).toFixed(2)),
          balance_minor: Math.round((Number(acc.balance) + amount) * 100),
          updated_at: new Date().toISOString(),
        })
        .eq('id', accountId);
    }

    useSyncStore.getState().bumpSync();
    return data;
  },
};

