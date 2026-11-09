import { supabase } from '../lib/supabase';
import { Transaction, Account } from '../types/database';
import { authService } from './authService';

export interface DashboardMetrics {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netSavings: number;
  savingsRate: number; // percentage
  todayExpenses: number;
  thisWeekExpenses: number;
  thisMonthExpenses: number;
  monthlySalary: number;
  salaryDate: number;
  additionalIncome: number;
  recentTransactions: Transaction[];
  categoryBreakdown: {
    categoryName: string;
    amount: number;
    percentage: number;
    color: string;
    icon: string;
  }[];
  monthlyTrends: {
    month: string;
    income: number;
    expense: number;
  }[];
}

export const dashboardService = {
  async getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
    const profile = await authService.getProfile(userId);
    const monthlySalary = profile?.monthly_salary ? Number(profile.monthly_salary) : 0;
    const salaryDate = profile?.salary_date ?? 1;

    // 1. Fetch all accounts to sum current balance
    const { data: accounts } = await supabase
      .from('accounts')
      .select('balance')
      .eq('user_id', userId);

    const totalBalance = (accounts || []).reduce((acc, curr) => acc + Number(curr.balance || 0), 0);

    // 2. Determine date boundaries for current month, week, today
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const todayStr = now.toISOString().split('T')[0];

    const dayOfWeek = now.getDay(); // 0 is Sun
    const firstDayOfWeek = new Date(now);
    firstDayOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const startOfWeekStr = firstDayOfWeek.toISOString().split('T')[0];

    // 3. Fetch current month transactions
    const { data: monthTxns } = await supabase
      .from('transactions')
      .select('*, category:transaction_categories(*), account:accounts(*)')
      .eq('user_id', userId)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .order('date', { ascending: false });

    const transactions: Transaction[] = monthTxns || [];

    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    let todayExpenses = 0;
    let thisWeekExpenses = 0;
    let salaryIncome = 0;
    let additionalIncome = 0;

    const categoryMap: Record<string, { amount: number; color: string; icon: string }> = {};

    for (const t of transactions) {
      const amt = Number(t.amount || 0);

      if (t.type === 'income') {
        monthlyIncome += amt;
        if (t.category?.name?.toLowerCase().includes('salary')) {
          salaryIncome += amt;
        } else {
          additionalIncome += amt;
        }
      } else if (t.type === 'expense') {
        monthlyExpenses += amt;

        if (t.date === todayStr) {
          todayExpenses += amt;
        }
        if (t.date >= startOfWeekStr) {
          thisWeekExpenses += amt;
        }

        const catName = t.category?.name || 'Uncategorized';
        const catColor = t.category?.color || '#94A3B8';
        const catIcon = t.category?.icon || 'Tag';

        if (!categoryMap[catName]) {
          categoryMap[catName] = { amount: 0, color: catColor, icon: catIcon };
        }
        categoryMap[catName].amount += amt;
      }
    }

    const netSavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? Math.max(0, Math.round((netSavings / monthlyIncome) * 100)) : 0;

    // Build category breakdown
    const categoryBreakdown = Object.entries(categoryMap)
      .map(([name, data]) => ({
        categoryName: name,
        amount: data.amount,
        percentage: monthlyExpenses > 0 ? Math.round((data.amount / monthlyExpenses) * 100) : 0,
        color: data.color,
        icon: data.icon,
      }))
      .sort((a, b) => b.amount - a.amount);

    // 4. Fetch recent transactions (last 6)
    const { data: recent } = await supabase
      .from('transactions')
      .select('*, category:transaction_categories(*), account:accounts(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6);

    // 5. Build 6-month historical trends
    const monthlyTrends: { month: string; income: number; expense: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: hist } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', userId)
        .gte('date', mStart)
        .lte('date', mEnd);

      let inc = 0;
      let exp = 0;
      (hist || []).forEach((item) => {
        if (item.type === 'income') inc += Number(item.amount);
        if (item.type === 'expense') exp += Number(item.amount);
      });

      monthlyTrends.push({
        month: monthNames[d.getMonth()],
        income: inc,
        expense: exp,
      });
    }

    return {
      totalBalance: Number(totalBalance.toFixed(2)),
      monthlyIncome: Number(monthlyIncome.toFixed(2)),
      monthlyExpenses: Number(monthlyExpenses.toFixed(2)),
      netSavings: Number(netSavings.toFixed(2)),
      savingsRate,
      todayExpenses: Number(todayExpenses.toFixed(2)),
      thisWeekExpenses: Number(thisWeekExpenses.toFixed(2)),
      thisMonthExpenses: Number(monthlyExpenses.toFixed(2)),
      monthlySalary,
      salaryDate,
      additionalIncome: Number(additionalIncome.toFixed(2)),
      recentTransactions: recent || [],
      categoryBreakdown,
      monthlyTrends,
    };
  },
};

