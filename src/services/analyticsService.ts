import { supabase } from '../lib/supabase';
import { Transaction } from '../types/database';

export interface AnalyticsSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  categoryBreakdown: {
    name: string;
    amount: number;
    percentage: number;
    color: string;
    icon: string;
  }[];
  dailyTrends: {
    date: string;
    day: string;
    amount: number;
  }[];
  monthlyComparison: {
    month: string;
    income: number;
    expense: number;
    savings: number;
  }[];
  topExpenses: Transaction[];
}

export const analyticsService = {
  async getAnalytics(
    userId: string,
    period: 'week' | 'month' | 'year' = 'month',
    year: number = new Date().getFullYear(),
    month: number = new Date().getMonth() + 1
  ): Promise<AnalyticsSummary> {
    const now = new Date();
    let startDate: string;
    let endDate: string;

    if (period === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(now.setDate(diff));
      startDate = start.toISOString().split('T')[0];
      endDate = new Date().toISOString().split('T')[0];
    } else if (period === 'year') {
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    } else {
      // month
      startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      endDate = new Date(year, month, 0).toISOString().split('T')[0];
    }

    const { data: txns, error } = await supabase
      .from('transactions')
      .select('*, category:transaction_categories(*), account:accounts(*)')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    const transactions: Transaction[] = txns || [];

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryMap: Record<string, { amount: number; color: string; icon: string }> = {};
    const dailyMap: Record<string, number> = {};

    transactions.forEach((t) => {
      const amt = Number(t.amount || 0);
      if (t.type === 'income') {
        totalIncome += amt;
      } else if (t.type === 'expense') {
        totalExpenses += amt;

        const catName = t.category?.name || 'Uncategorized';
        const catColor = t.category?.color || '#94A3B8';
        const catIcon = t.category?.icon || 'Tag';

        if (!categoryMap[catName]) {
          categoryMap[catName] = { amount: 0, color: catColor, icon: catIcon };
        }
        categoryMap[catName].amount += amt;

        dailyMap[t.date] = (dailyMap[t.date] || 0) + amt;
      }
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([name, val]) => ({
        name,
        amount: Number(val.amount.toFixed(2)),
        percentage: totalExpenses > 0 ? Math.round((val.amount / totalExpenses) * 100) : 0,
        color: val.color,
        icon: val.icon,
      }))
      .sort((a, b) => b.amount - a.amount);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyTrends = Object.entries(dailyMap).map(([dateStr, amount]) => {
      const d = new Date(dateStr);
      return {
        date: dateStr,
        day: days[d.getDay()],
        amount: Number(amount.toFixed(2)),
      };
    });

    // 6-month comparison
    const monthlyComparison: { month: string; income: number; expense: number; savings: number }[] = [];
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

      monthlyComparison.push({
        month: monthNames[d.getMonth()],
        income: inc,
        expense: exp,
        savings: inc - exp,
      });
    }

    const topExpenses = transactions
      .filter((t) => t.type === 'expense')
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);

    return {
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netSavings: Number(netSavings.toFixed(2)),
      savingsRate,
      categoryBreakdown,
      dailyTrends,
      monthlyComparison,
      topExpenses,
    };
  },
};

