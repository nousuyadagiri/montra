import { create } from 'zustand';
import {
  Profile,
  Account,
  Transaction,
  TransactionCategory,
  Budget,
  SavingsGoal,
  SavingsContribution,
  ExpenseGroup,
  GroupExpense,
  Settlement,
} from '../types/database';
import {
  DEMO_PROFILE,
  DEMO_CATEGORIES,
  DEMO_TRANSACTIONS,
  DEMO_DASHBOARD_METRICS,
  DEMO_BUDGET,
  DEMO_SAVINGS_GOALS,
  DEMO_SPLIT_GROUPS,
} from '../services/demoData';
import { DashboardMetrics } from '../services/dashboardService';
import { BudgetWithSpending, CreateBudgetInput } from '../services/budgetService';
import { CreateTransactionInput } from '../services/transactionService';
import { GroupDetailsData } from '../services/splitService';
import { AnalyticsSummary } from '../services/analyticsService';
import {
  computeExpenseSplits,
  calculateSettlements,
  SplitMemberInput,
  SplitType,
} from '../utils/splitEngine';
import { toMinorUnits } from '../utils/currency';

const makeDemoId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const createInitialDemoAccounts = (): Account[] => [
  {
    id: 'demo-acc-bank',
    user_id: DEMO_PROFILE.id,
    name: 'HDFC Salary Bank',
    type: 'bank',
    balance: 142000,
    balance_minor: 14200000,
    is_default: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-acc-cash',
    user_id: DEMO_PROFILE.id,
    name: 'Cash Wallet',
    type: 'cash',
    balance: 8761,
    balance_minor: 876100,
    is_default: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const createInitialDemoTransactions = (): Transaction[] => {
  const bankAcc = createInitialDemoAccounts()[0];
  return [...DEMO_TRANSACTIONS]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((t) => ({
      ...t,
      account_id: t.account_id || bankAcc.id,
      account: t.account || bankAcc,
    }));
};

const createInitialGoalContributions = (): Record<string, SavingsContribution[]> => {
  const today = new Date().toISOString().split('T')[0];
  return {
    'demo-goal-emergency': [
      {
        id: 'demo-contrib-1',
        goal_id: 'demo-goal-emergency',
        user_id: DEMO_PROFILE.id,
        amount: 12000,
        type: 'deposit',
        notes: 'Monthly auto-transfer',
        date: today,
        created_at: new Date().toISOString(),
      },
      {
        id: 'demo-contrib-2',
        goal_id: 'demo-goal-emergency',
        user_id: DEMO_PROFILE.id,
        amount: 60000,
        type: 'deposit',
        notes: 'Initial reserve setup',
        date: '2026-01-15',
        created_at: '2026-01-15T10:00:00Z',
      },
    ],
    'demo-goal-laptop': [
      {
        id: 'demo-contrib-3',
        goal_id: 'demo-goal-laptop',
        user_id: DEMO_PROFILE.id,
        amount: 55000,
        type: 'deposit',
        notes: 'Freelance milestone savings',
        date: today,
        created_at: new Date().toISOString(),
      },
    ],
    'demo-goal-vacation': [
      {
        id: 'demo-contrib-4',
        goal_id: 'demo-goal-vacation',
        user_id: DEMO_PROFILE.id,
        amount: 32000,
        type: 'deposit',
        notes: 'Trip fund allocation',
        date: today,
        created_at: new Date().toISOString(),
      },
    ],
  };
};

const createInitialDemoGroupExpenses = (): Record<string, GroupExpense[]> => {
  const today = new Date().toISOString().split('T')[0];
  return {
    'demo-group-apartment': [
      {
        id: 'demo-gexp-1',
        group_id: 'demo-group-apartment',
        paid_by: 'm-alex',
        created_by: DEMO_PROFILE.id,
        title: 'Flat Groceries & Broadband',
        amount: 6696,
        amount_minor: 669600,
        split_type: 'equal',
        date: today,
        notes: 'Monthly shared utilities',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payer: DEMO_SPLIT_GROUPS[0].members![0],
        splits: [
          { id: 'ds-1', expense_id: 'demo-gexp-1', member_id: 'm-alex', owed_amount: 2232, owed_minor: 223200, is_settled: false, created_at: '' },
          { id: 'ds-2', expense_id: 'demo-gexp-1', member_id: 'm-rohan', owed_amount: 2232, owed_minor: 223200, is_settled: false, created_at: '' },
          { id: 'ds-3', expense_id: 'demo-gexp-1', member_id: 'm-priya', owed_amount: 2232, owed_minor: 223200, is_settled: false, created_at: '' },
        ],
      },
      {
        id: 'demo-gexp-2',
        group_id: 'demo-group-apartment',
        paid_by: 'm-rohan',
        created_by: 'm-rohan',
        title: 'Electricity & Maid',
        amount: 3402,
        amount_minor: 340200,
        split_type: 'equal',
        date: today,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payer: DEMO_SPLIT_GROUPS[0].members![1],
        splits: [
          { id: 'ds-4', expense_id: 'demo-gexp-2', member_id: 'm-alex', owed_amount: 1134, owed_minor: 113400, is_settled: false, created_at: '' },
          { id: 'ds-5', expense_id: 'demo-gexp-2', member_id: 'm-rohan', owed_amount: 1134, owed_minor: 113400, is_settled: false, created_at: '' },
          { id: 'ds-6', expense_id: 'demo-gexp-2', member_id: 'm-priya', owed_amount: 1134, owed_minor: 113400, is_settled: false, created_at: '' },
        ],
      },
    ],
    'demo-group-goa': [
      {
        id: 'demo-gexp-3',
        group_id: 'demo-group-goa',
        paid_by: 'm-sameer',
        created_by: 'm-sameer',
        title: 'Candolim Villa Booking',
        amount: 21200,
        amount_minor: 2120000,
        split_type: 'equal',
        date: today,
        notes: '3 nights stay',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payer: DEMO_SPLIT_GROUPS[1].members![1],
        splits: [
          { id: 'ds-7', expense_id: 'demo-gexp-3', member_id: 'm-alex-goa', owed_amount: 5300, owed_minor: 530000, is_settled: false, created_at: '' },
          { id: 'ds-8', expense_id: 'demo-gexp-3', member_id: 'm-sameer', owed_amount: 5300, owed_minor: 530000, is_settled: false, created_at: '' },
          { id: 'ds-9', expense_id: 'demo-gexp-3', member_id: 'm-ananya', owed_amount: 5300, owed_minor: 530000, is_settled: false, created_at: '' },
          { id: 'ds-10', expense_id: 'demo-gexp-3', member_id: 'm-vikram', owed_amount: 5300, owed_minor: 530000, is_settled: false, created_at: '' },
        ],
      },
    ],
    'demo-group-dinner': [
      {
        id: 'demo-gexp-4',
        group_id: 'demo-group-dinner',
        paid_by: 'm-alex-dinner',
        created_by: DEMO_PROFILE.id,
        title: 'Kuuraku Dinner & Drinks',
        amount: 4800,
        amount_minor: 480000,
        split_type: 'equal',
        date: today,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payer: DEMO_SPLIT_GROUPS[2].members![0],
        splits: [
          { id: 'ds-11', expense_id: 'demo-gexp-4', member_id: 'm-alex-dinner', owed_amount: 1600, owed_minor: 160000, is_settled: false, created_at: '' },
          { id: 'ds-12', expense_id: 'demo-gexp-4', member_id: 'm-neha', owed_amount: 1600, owed_minor: 160000, is_settled: false, created_at: '' },
          { id: 'ds-13', expense_id: 'demo-gexp-4', member_id: 'm-rahul', owed_amount: 1600, owed_minor: 160000, is_settled: false, created_at: '' },
        ],
      },
    ],
  };
};

interface DemoState {
  demoProfile: Profile;
  demoAccounts: Account[];
  demoCategories: TransactionCategory[];
  demoTransactions: Transaction[];
  demoBudgets: Budget[];
  demoGoals: SavingsGoal[];
  demoGoalContributions: Record<string, SavingsContribution[]>;
  demoGroups: ExpenseGroup[];
  demoGroupExpenses: Record<string, GroupExpense[]>;
  demoGroupSettlements: Record<string, Settlement[]>;

  // Profile & Accounts
  updateDemoProfile: (updates: Partial<Profile>) => void;
  createDemoAccount: (acc: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Account;
  updateDemoAccount: (id: string, updates: Partial<Pick<Account, 'name' | 'type' | 'balance' | 'is_default'>>) => void;
  deleteDemoAccount: (id: string) => void;

  // Transactions
  addDemoTransaction: (input: CreateTransactionInput) => Transaction;
  updateDemoTransaction: (id: string, updates: Partial<CreateTransactionInput>) => Transaction | null;
  deleteDemoTransaction: (id: string) => void;

  // Budgets
  getDemoBudgets: (year?: number, month?: number) => BudgetWithSpending[];
  createDemoBudget: (input: CreateBudgetInput) => Budget;
  updateDemoBudget: (id: string, input: Partial<CreateBudgetInput>) => void;
  deleteDemoBudget: (id: string) => void;

  // Goals
  createDemoGoal: (input: { name: string; targetAmount: number; currentAmount?: number; targetDate?: string; category?: string }) => SavingsGoal;
  updateDemoGoal: (id: string, updates: { name?: string; targetAmount?: number; currentAmount?: number; targetDate?: string | null; category?: string }) => void;
  deleteDemoGoal: (id: string) => void;
  addDemoContribution: (goalId: string, amount: number, type: 'deposit' | 'withdrawal', notes?: string) => void;

  // Split
  getDemoGroupDetails: (groupId: string) => GroupDetailsData | null;
  createDemoGroup: (input: { name: string; description?: string; category?: string; currency?: string; memberNames?: string[] }) => ExpenseGroup;
  updateDemoGroup: (groupId: string, updates: { name?: string; description?: string; category?: string }) => void;
  deleteDemoGroup: (groupId: string) => void;
  addDemoGroupMember: (groupId: string, memberName: string, memberEmail?: string) => void;
  addDemoGroupExpense: (groupId: string, input: { title: string; amount: number; paidByMemberId: string; splitType: SplitType; participants: SplitMemberInput[]; date?: string; notes?: string }) => void;
  updateDemoGroupExpense: (groupId: string, expenseId: string, input: { title: string; amount: number; paidByMemberId: string; splitType: SplitType; participants: SplitMemberInput[]; date?: string; notes?: string }) => void;
  deleteDemoGroupExpense: (groupId: string, expenseId: string) => void;
  recordDemoSettlement: (groupId: string, input: { payerId: string; payeeId: string; amount: number; notes?: string; paymentMethod?: string }) => void;
  deleteDemoSettlement: (groupId: string, settlementId: string) => void;

  // Computed Metrics
  getDemoDashboardMetrics: (year?: number, month?: number) => DashboardMetrics;
  getDemoAnalytics: (period?: 'week' | 'month' | 'year', year?: number, month?: number) => AnalyticsSummary;
  resetDemoData: () => void;
}

const adjustDemoAccountList = (
  accounts: Account[],
  accountId: string | null | undefined,
  amount: number,
  direction: 'income' | 'expense'
): Account[] => {
  if (!accountId) return accounts;
  const delta = direction === 'income' ? amount : -amount;
  return accounts.map((acc) => {
    if (acc.id !== accountId) return acc;
    const balance = Number((Number(acc.balance) + delta).toFixed(2));
    return { ...acc, balance, balance_minor: toMinorUnits(balance), updated_at: new Date().toISOString() };
  });
};

export const useDemoStore = create<DemoState>((set, get) => ({
  demoProfile: { ...DEMO_PROFILE },
  demoAccounts: createInitialDemoAccounts(),
  demoCategories: [...DEMO_CATEGORIES],
  demoTransactions: createInitialDemoTransactions(),
  demoBudgets: [{ ...DEMO_BUDGET }],
  demoGoals: DEMO_SAVINGS_GOALS.map((g) => ({ ...g })),
  demoGoalContributions: createInitialGoalContributions(),
  demoGroups: DEMO_SPLIT_GROUPS.map((g) => ({ ...g, members: g.members ? [...g.members] : [] })),
  demoGroupExpenses: createInitialDemoGroupExpenses(),
  demoGroupSettlements: {},

  updateDemoProfile: (updates) =>
    set((state) => ({
      demoProfile: {
        ...state.demoProfile,
        ...updates,
        updated_at: new Date().toISOString(),
      },
    })),

  createDemoAccount: (acc) => {
    const newAcc: Account = {
      id: makeDemoId('demo-acc'),
      user_id: DEMO_PROFILE.id,
      name: acc.name,
      type: acc.type,
      balance: acc.balance,
      balance_minor: toMinorUnits(acc.balance),
      is_default: acc.is_default,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((state) => ({
      demoAccounts: [
        ...(acc.is_default
          ? state.demoAccounts.map((a) => ({ ...a, is_default: false }))
          : state.demoAccounts),
        newAcc,
      ],
    }));
    return newAcc;
  },

  updateDemoAccount: (id, updates) =>
    set((state) => ({
      demoAccounts: state.demoAccounts.map((acc) => {
        if (updates.is_default && acc.id !== id) {
          return { ...acc, is_default: false };
        }
        if (acc.id !== id) return acc;
        const nextBalance = updates.balance !== undefined ? updates.balance : acc.balance;
        return {
          ...acc,
          ...updates,
          balance: nextBalance,
          balance_minor: toMinorUnits(nextBalance),
          updated_at: new Date().toISOString(),
        };
      }),
    })),

  deleteDemoAccount: (id) =>
    set((state) => {
      const remaining = state.demoAccounts.filter((a) => a.id !== id);
      if (remaining.length > 0 && !remaining.some((a) => a.is_default)) {
        remaining[0] = { ...remaining[0], is_default: true };
      }
      return { demoAccounts: remaining };
    }),

  addDemoTransaction: (input) => {
    const state = get();
    const account =
      state.demoAccounts.find((a) => a.id === input.accountId) ||
      state.demoAccounts.find((a) => a.is_default) ||
      state.demoAccounts[0];
    const category = input.categoryId
      ? state.demoCategories.find((c) => c.id === input.categoryId)
      : undefined;

    const newTxn: Transaction = {
      id: makeDemoId('demo-txn'),
      user_id: DEMO_PROFILE.id,
      account_id: account?.id || null,
      to_account_id: input.toAccountId || null,
      category_id: input.categoryId || null,
      type: input.type,
      amount: input.amount,
      amount_minor: toMinorUnits(input.amount),
      title: input.title,
      notes: input.notes || null,
      date: input.date,
      payment_method: input.paymentMethod || 'UPI',
      receipt_url: input.receiptUrl || null,
      is_recurring: input.isRecurring || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category,
      account,
    };

    let nextAccounts = state.demoAccounts;
    if (account?.id) {
      nextAccounts = adjustDemoAccountList(
        nextAccounts,
        account.id,
        input.amount,
        input.type === 'income' ? 'income' : 'expense'
      );
    }
    if (input.type === 'transfer' && input.toAccountId) {
      nextAccounts = adjustDemoAccountList(nextAccounts, input.toAccountId, input.amount, 'income');
    }

    set({
      demoTransactions: [newTxn, ...state.demoTransactions].sort((a, b) =>
        b.date.localeCompare(a.date)
      ),
      demoAccounts: nextAccounts,
    });

    return newTxn;
  },

  updateDemoTransaction: (id, updates) => {
    const state = get();
    const existing = state.demoTransactions.find((t) => t.id === id);
    if (!existing) return null;

    // Reverse old balance effect
    let nextAccounts = state.demoAccounts;
    if (existing.account_id) {
      nextAccounts = adjustDemoAccountList(
        nextAccounts,
        existing.account_id,
        existing.amount,
        existing.type === 'income' ? 'expense' : 'income'
      );
    }
    if (existing.type === 'transfer' && existing.to_account_id) {
      nextAccounts = adjustDemoAccountList(nextAccounts, existing.to_account_id, existing.amount, 'expense');
    }

    const nextType = updates.type ?? existing.type;
    const nextAmount = updates.amount ?? existing.amount;
    const nextAccountId = updates.accountId !== undefined ? updates.accountId : existing.account_id;
    const nextToAccountId = updates.toAccountId !== undefined ? updates.toAccountId : existing.to_account_id;
    const nextCategoryId = updates.categoryId !== undefined ? updates.categoryId : existing.category_id;

    // Apply new balance effect
    if (nextAccountId) {
      nextAccounts = adjustDemoAccountList(
        nextAccounts,
        nextAccountId,
        nextAmount,
        nextType === 'income' ? 'income' : 'expense'
      );
    }
    if (nextType === 'transfer' && nextToAccountId) {
      nextAccounts = adjustDemoAccountList(nextAccounts, nextToAccountId, nextAmount, 'income');
    }

    const updatedAccount = nextAccounts.find((a) => a.id === nextAccountId);
    const updatedCategory = nextCategoryId
      ? state.demoCategories.find((c) => c.id === nextCategoryId)
      : undefined;

    const updatedTxn: Transaction = {
      ...existing,
      title: updates.title ?? existing.title,
      amount: nextAmount,
      amount_minor: toMinorUnits(nextAmount),
      type: nextType,
      category_id: nextType === 'transfer' ? null : (nextCategoryId ?? null),
      account_id: nextAccountId ?? null,
      to_account_id: nextType === 'transfer' ? (nextToAccountId ?? null) : null,
      date: updates.date ?? existing.date,
      payment_method: updates.paymentMethod ?? existing.payment_method,
      notes: updates.notes !== undefined ? updates.notes : existing.notes,
      category: nextType === 'transfer' ? undefined : updatedCategory,
      account: updatedAccount,
      updated_at: new Date().toISOString(),
    };

    set({
      demoTransactions: state.demoTransactions
        .map((t) => (t.id === id ? updatedTxn : t))
        .sort((a, b) => b.date.localeCompare(a.date)),
      demoAccounts: nextAccounts,
    });

    return updatedTxn;
  },

  deleteDemoTransaction: (id) => {
    const state = get();
    const existing = state.demoTransactions.find((t) => t.id === id);
    if (!existing) return;

    let nextAccounts = state.demoAccounts;
    if (existing.account_id) {
      nextAccounts = adjustDemoAccountList(
        nextAccounts,
        existing.account_id,
        existing.amount,
        existing.type === 'income' ? 'expense' : 'income'
      );
    }
    if (existing.type === 'transfer' && existing.to_account_id) {
      nextAccounts = adjustDemoAccountList(nextAccounts, existing.to_account_id, existing.amount, 'expense');
    }

    set({
      demoTransactions: state.demoTransactions.filter((t) => t.id !== id),
      demoAccounts: nextAccounts,
    });
  },

  getDemoBudgets: (year, month) => {
    const state = get();
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const monthPrefix = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    const monthExpenses = state.demoTransactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(monthPrefix)
    );

    const spentByCat: Record<string, number> = {};
    let totalSpentOverall = 0;
    monthExpenses.forEach((t) => {
      const amt = Number(t.amount);
      totalSpentOverall += amt;
      if (t.category_id) {
        spentByCat[t.category_id] = (spentByCat[t.category_id] || 0) + amt;
      }
    });

    return state.demoBudgets.map((b) => {
      let budgetSpent = 0;
      const categoriesWithSpending = (b.categories || []).map((c) => {
        const spent = spentByCat[c.category_id] ?? c.spent_amount ?? 0;
        budgetSpent += spent;
        const allocated = Number(c.allocated_amount);
        return {
          ...c,
          spentAmount: spent,
          remainingAmount: Math.max(0, allocated - spent),
          spentPercentage: allocated > 0 ? Math.round((spent / allocated) * 100) : 0,
        };
      });

      const totalLimit = Number(b.total_limit);
      const totalSpent = categoriesWithSpending.length > 0 ? budgetSpent : totalSpentOverall;
      return {
        ...b,
        totalSpent,
        remainingAmount: Math.max(0, totalLimit - totalSpent),
        spentPercentage: totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0,
        categoriesWithSpending,
      };
    });
  },

  createDemoBudget: (input) => {
    const state = get();
    const budgetId = makeDemoId('demo-budget');
    const cats = (input.categories || []).map((c) => ({
      id: makeDemoId('demo-bc'),
      budget_id: budgetId,
      category_id: c.categoryId,
      allocated_amount: c.allocatedAmount,
      category: state.demoCategories.find((dc) => dc.id === c.categoryId),
    }));
    const newBudget: Budget = {
      id: budgetId,
      user_id: DEMO_PROFILE.id,
      name: input.name,
      period: input.period,
      month: input.month ?? new Date().getMonth() + 1,
      year: input.year,
      total_limit: input.totalLimit,
      categories: cats,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set({ demoBudgets: [...state.demoBudgets, newBudget] });
    return newBudget;
  },

  updateDemoBudget: (id, input) =>
    set((state) => ({
      demoBudgets: state.demoBudgets.map((b) => {
        if (b.id !== id) return b;
        const cats = input.categories
          ? input.categories.map((c) => ({
              id: makeDemoId('demo-bc'),
              budget_id: b.id,
              category_id: c.categoryId,
              allocated_amount: c.allocatedAmount,
              category: state.demoCategories.find((dc) => dc.id === c.categoryId),
            }))
          : b.categories;
        return {
          ...b,
          name: input.name ?? b.name,
          period: input.period ?? b.period,
          total_limit: input.totalLimit ?? b.total_limit,
          categories: cats,
          updated_at: new Date().toISOString(),
        };
      }),
    })),

  deleteDemoBudget: (id) =>
    set((state) => ({
      demoBudgets: state.demoBudgets.filter((b) => b.id !== id),
    })),

  createDemoGoal: (input) => {
    const current = input.currentAmount || 0;
    const goal: SavingsGoal = {
      id: makeDemoId('demo-goal'),
      user_id: DEMO_PROFILE.id,
      name: input.name,
      target_amount: input.targetAmount,
      current_amount: current,
      target_date: input.targetDate || null,
      category: input.category || 'General',
      is_completed: current >= input.targetAmount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((state) => ({
      demoGoals: [goal, ...state.demoGoals],
    }));
    return goal;
  },

  updateDemoGoal: (id, updates) =>
    set((state) => ({
      demoGoals: state.demoGoals.map((g) => {
        if (g.id !== id) return g;
        const target = updates.targetAmount ?? g.target_amount;
        const current = updates.currentAmount ?? g.current_amount;
        return {
          ...g,
          name: updates.name ?? g.name,
          target_amount: target,
          current_amount: current,
          target_date: updates.targetDate !== undefined ? updates.targetDate : g.target_date,
          category: updates.category ?? g.category,
          is_completed: current >= target,
          updated_at: new Date().toISOString(),
        };
      }),
    })),

  deleteDemoGoal: (id) =>
    set((state) => ({
      demoGoals: state.demoGoals.filter((g) => g.id !== id),
    })),

  addDemoContribution: (goalId, amount, type, notes) =>
    set((state) => {
      const contrib: SavingsContribution = {
        id: makeDemoId('demo-contrib'),
        goal_id: goalId,
        user_id: DEMO_PROFILE.id,
        amount,
        type,
        notes: notes || null,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      };
      const prevList = state.demoGoalContributions[goalId] || [];
      return {
        demoGoalContributions: {
          ...state.demoGoalContributions,
          [goalId]: [contrib, ...prevList],
        },
        demoGoals: state.demoGoals.map((g) => {
          if (g.id !== goalId) return g;
          const delta = type === 'deposit' ? amount : -amount;
          const updatedAmount = Math.max(0, Number((Number(g.current_amount) + delta).toFixed(2)));
          return {
            ...g,
            current_amount: updatedAmount,
            is_completed: updatedAmount >= Number(g.target_amount),
            updated_at: new Date().toISOString(),
          };
        }),
      };
    }),

  getDemoGroupDetails: (groupId) => {
    const state = get();
    const group = state.demoGroups.find((g) => g.id === groupId);
    if (!group) return null;

    const memberList = group.members || [];
    const expenseList = state.demoGroupExpenses[groupId] || [];
    const settlementList = state.demoGroupSettlements[groupId] || [];

    const netBalancesMinor: Record<string, number> = {};
    memberList.forEach((m) => {
      netBalancesMinor[m.id] = 0;
    });

    let totalExpensesMinor = 0;
    expenseList.forEach((exp) => {
      const expMinor = toMinorUnits(Number(exp.amount));
      totalExpensesMinor += expMinor;
      if (netBalancesMinor[exp.paid_by] !== undefined) {
        netBalancesMinor[exp.paid_by] += expMinor;
      }
      (exp.splits || []).forEach((s) => {
        const owedMinor = toMinorUnits(Number(s.owed_amount));
        if (netBalancesMinor[s.member_id] !== undefined) {
          netBalancesMinor[s.member_id] -= owedMinor;
        }
      });
    });

    settlementList.forEach((s) => {
      const sMinor = toMinorUnits(Number(s.amount));
      if (netBalancesMinor[s.payer_id] !== undefined) {
        netBalancesMinor[s.payer_id] += sMinor;
      }
      if (netBalancesMinor[s.payee_id] !== undefined) {
        netBalancesMinor[s.payee_id] -= sMinor;
      }
    });

    const currentMember = memberList.find((m) => m.user_id === DEMO_PROFILE.id);
    const yourBalanceMinor = currentMember ? netBalancesMinor[currentMember.id] || 0 : 0;
    const yourNetBalance = Number((yourBalanceMinor / 100).toFixed(2));

    const memberBalances = memberList.map((m) => ({
      memberId: m.id,
      memberName: m.member_name,
      isCurrentUser: m.user_id === DEMO_PROFILE.id,
      netBalance: Number(((netBalancesMinor[m.id] || 0) / 100).toFixed(2)),
    }));

    const simplifiedDebts = calculateSettlements(
      memberList.map((m) => ({ id: m.id, name: m.member_name })),
      netBalancesMinor
    );

    return {
      group,
      members: memberList,
      expenses: expenseList,
      settlements: settlementList,
      totalExpenses: Number((totalExpensesMinor / 100).toFixed(2)),
      yourNetBalance,
      youOweTotal: yourNetBalance < 0 ? Math.abs(yourNetBalance) : 0,
      youAreOwedTotal: yourNetBalance > 0 ? yourNetBalance : 0,
      memberBalances,
      simplifiedDebts,
    };
  },

  createDemoGroup: (input) => {
    const groupId = makeDemoId('demo-group');
    const state = get();
    const members = [
      {
        id: makeDemoId('demo-mem'),
        group_id: groupId,
        user_id: DEMO_PROFILE.id,
        member_name: `${state.demoProfile.full_name} (You)`,
        role: 'admin' as const,
        joined_at: new Date().toISOString(),
      },
      ...(input.memberNames || [])
        .map((n) => n.trim())
        .filter(Boolean)
        .map((n) => ({
          id: makeDemoId('demo-mem'),
          group_id: groupId,
          user_id: null,
          member_name: n,
          role: 'member' as const,
          joined_at: new Date().toISOString(),
        })),
    ];

    const newGroup: ExpenseGroup = {
      id: groupId,
      created_by: DEMO_PROFILE.id,
      name: input.name,
      description: input.description || null,
      category: input.category || 'Trip',
      currency: (input.currency as any) || state.demoProfile.currency,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      members,
      total_expenses: 0,
    };

    set({
      demoGroups: [newGroup, ...state.demoGroups],
      demoGroupExpenses: { ...state.demoGroupExpenses, [groupId]: [] },
    });
    return newGroup;
  },

  updateDemoGroup: (groupId, updates) =>
    set((state) => ({
      demoGroups: state.demoGroups.map((g) =>
        g.id === groupId ? { ...g, ...updates, updated_at: new Date().toISOString() } : g
      ),
    })),

  deleteDemoGroup: (groupId) =>
    set((state) => ({
      demoGroups: state.demoGroups.filter((g) => g.id !== groupId),
    })),

  addDemoGroupMember: (groupId, memberName, memberEmail) =>
    set((state) => ({
      demoGroups: state.demoGroups.map((g) => {
        if (g.id !== groupId) return g;
        const newMember = {
          id: makeDemoId('demo-mem'),
          group_id: groupId,
          user_id: null,
          member_name: memberName.trim(),
          member_email: memberEmail?.trim() || null,
          role: 'member' as const,
          joined_at: new Date().toISOString(),
        };
        return { ...g, members: [...(g.members || []), newMember] };
      }),
    })),

  addDemoGroupExpense: (groupId, input) =>
    set((state) => {
      const group = state.demoGroups.find((g) => g.id === groupId);
      const payer = group?.members?.find((m) => m.id === input.paidByMemberId);
      const expId = makeDemoId('demo-gexp');
      const splits = computeExpenseSplits(input.amount, input.splitType, input.participants);

      const newExp: GroupExpense = {
        id: expId,
        group_id: groupId,
        paid_by: input.paidByMemberId,
        created_by: DEMO_PROFILE.id,
        title: input.title,
        amount: input.amount,
        amount_minor: toMinorUnits(input.amount),
        split_type: input.splitType,
        date: input.date || new Date().toISOString().split('T')[0],
        notes: input.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payer,
        splits: splits.map((s) => ({
          id: makeDemoId('demo-split'),
          expense_id: expId,
          member_id: s.memberId,
          owed_amount: s.owedAmount,
          owed_minor: s.owedMinor,
          is_settled: false,
          created_at: new Date().toISOString(),
        })),
      };

      const prevExps = state.demoGroupExpenses[groupId] || [];
      const nextExps = [newExp, ...prevExps];
      return {
        demoGroupExpenses: { ...state.demoGroupExpenses, [groupId]: nextExps },
        demoGroups: state.demoGroups.map((g) =>
          g.id === groupId
            ? { ...g, total_expenses: nextExps.reduce((sum, e) => sum + Number(e.amount), 0) }
            : g
        ),
      };
    }),

  updateDemoGroupExpense: (groupId, expenseId, input) =>
    set((state) => {
      const group = state.demoGroups.find((g) => g.id === groupId);
      const payer = group?.members?.find((m) => m.id === input.paidByMemberId);
      const splits = computeExpenseSplits(input.amount, input.splitType, input.participants);

      const prevExps = state.demoGroupExpenses[groupId] || [];
      const nextExps = prevExps.map((exp) =>
        exp.id === expenseId
          ? {
              ...exp,
              paid_by: input.paidByMemberId,
              title: input.title,
              amount: input.amount,
              amount_minor: toMinorUnits(input.amount),
              split_type: input.splitType,
              date: input.date || exp.date,
              notes: input.notes ?? exp.notes,
              payer,
              updated_at: new Date().toISOString(),
              splits: splits.map((s) => ({
                id: makeDemoId('demo-split'),
                expense_id: expenseId,
                member_id: s.memberId,
                owed_amount: s.owedAmount,
                owed_minor: s.owedMinor,
                is_settled: false,
                created_at: new Date().toISOString(),
              })),
            }
          : exp
      );

      return {
        demoGroupExpenses: { ...state.demoGroupExpenses, [groupId]: nextExps },
        demoGroups: state.demoGroups.map((g) =>
          g.id === groupId
            ? { ...g, total_expenses: nextExps.reduce((sum, e) => sum + Number(e.amount), 0) }
            : g
        ),
      };
    }),

  deleteDemoGroupExpense: (groupId, expenseId) =>
    set((state) => {
      const nextExps = (state.demoGroupExpenses[groupId] || []).filter((e) => e.id !== expenseId);
      return {
        demoGroupExpenses: { ...state.demoGroupExpenses, [groupId]: nextExps },
        demoGroups: state.demoGroups.map((g) =>
          g.id === groupId
            ? { ...g, total_expenses: nextExps.reduce((sum, e) => sum + Number(e.amount), 0) }
            : g
        ),
      };
    }),

  recordDemoSettlement: (groupId, input) =>
    set((state) => {
      const group = state.demoGroups.find((g) => g.id === groupId);
      const payer = group?.members?.find((m) => m.id === input.payerId);
      const payee = group?.members?.find((m) => m.id === input.payeeId);
      const newSettlement: Settlement = {
        id: makeDemoId('demo-settle'),
        group_id: groupId,
        payer_id: input.payerId,
        payee_id: input.payeeId,
        amount: input.amount,
        amount_minor: toMinorUnits(input.amount),
        notes: input.notes || null,
        payment_method: input.paymentMethod || 'UPI',
        settled_at: new Date().toISOString(),
        payer,
        payee,
      };
      const prev = state.demoGroupSettlements[groupId] || [];
      return {
        demoGroupSettlements: { ...state.demoGroupSettlements, [groupId]: [newSettlement, ...prev] },
      };
    }),

  deleteDemoSettlement: (groupId, settlementId) =>
    set((state) => ({
      demoGroupSettlements: {
        ...state.demoGroupSettlements,
        [groupId]: (state.demoGroupSettlements[groupId] || []).filter((s) => s.id !== settlementId),
      },
    })),

  getDemoDashboardMetrics: (year, month) => {
    const state = get();
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;
    const monthPrefix = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    const todayStr = now.toISOString().split('T')[0];

    const totalBalance = state.demoAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
    const monthTxns = state.demoTransactions.filter((t) => t.date.startsWith(monthPrefix));

    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    let todayExpenses = 0;
    let additionalIncome = 0;
    const categoryMap: Record<string, { amount: number; color: string; icon: string }> = {};

    monthTxns.forEach((t) => {
      const amt = Number(t.amount || 0);
      if (t.type === 'income') {
        monthlyIncome += amt;
        if (!t.category?.name?.toLowerCase().includes('salary')) {
          additionalIncome += amt;
        }
      } else if (t.type === 'expense') {
        monthlyExpenses += amt;
        if (t.date === todayStr) todayExpenses += amt;
        const catName = t.category?.name || 'Uncategorized';
        if (!categoryMap[catName]) {
          categoryMap[catName] = {
            amount: 0,
            color: t.category?.color || '#94A3B8',
            icon: t.category?.icon || 'tag',
          };
        }
        categoryMap[catName].amount += amt;
      }
    });

    const netSavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? Math.max(0, Math.round((netSavings / monthlyIncome) * 100)) : 0;

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([categoryName, val]) => ({
        categoryName,
        amount: val.amount,
        percentage: monthlyExpenses > 0 ? Math.round((val.amount / monthlyExpenses) * 100) : 0,
        color: val.color,
        icon: val.icon,
      }))
      .sort((a, b) => b.amount - a.amount);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const baseTrends = DEMO_DASHBOARD_METRICS.monthlyTrends.slice(0, 5);
    const currentMonthTrend = {
      month: monthNames[targetMonth - 1],
      income: monthlyIncome,
      expense: monthlyExpenses,
    };
    const monthlyTrends =
      monthPrefix === currentKey
        ? [...baseTrends, currentMonthTrend]
        : [currentMonthTrend];

    return {
      totalBalance: Number(totalBalance.toFixed(2)),
      monthlyIncome: Number(monthlyIncome.toFixed(2)),
      monthlyExpenses: Number(monthlyExpenses.toFixed(2)),
      netSavings: Number(netSavings.toFixed(2)),
      savingsRate,
      todayExpenses,
      thisWeekExpenses: monthlyExpenses,
      thisMonthExpenses: monthlyExpenses,
      monthlySalary: state.demoProfile.monthly_salary,
      salaryDate: state.demoProfile.salary_date,
      additionalIncome,
      recentTransactions: state.demoTransactions.slice(0, 6),
      categoryBreakdown,
      monthlyTrends,
    };
  },

  getDemoAnalytics: (period = 'month', year, month) => {
    const state = get();
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;
    const monthPrefix = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

    const txns = state.demoTransactions.filter((t) => {
      if (period === 'year') return t.date.startsWith(`${targetYear}`);
      return t.date.startsWith(monthPrefix);
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    const catMap: Record<string, { amount: number; color: string; icon: string }> = {};
    const dailyMap: Record<string, number> = {};

    txns.forEach((t) => {
      const amt = Number(t.amount || 0);
      if (t.type === 'income') totalIncome += amt;
      if (t.type === 'expense') {
        totalExpenses += amt;
        const name = t.category?.name || 'Uncategorized';
        if (!catMap[name]) {
          catMap[name] = { amount: 0, color: t.category?.color || '#94A3B8', icon: t.category?.icon || 'tag' };
        }
        catMap[name].amount += amt;
        dailyMap[t.date] = (dailyMap[t.date] || 0) + amt;
      }
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      categoryBreakdown: Object.entries(catMap)
        .map(([name, val]) => ({
          name,
          amount: val.amount,
          percentage: totalExpenses > 0 ? Math.round((val.amount / totalExpenses) * 100) : 0,
          color: val.color,
          icon: val.icon,
        }))
        .sort((a, b) => b.amount - a.amount),
      dailyTrends: Object.entries(dailyMap).map(([date, amount]) => ({
        date,
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(date).getDay()],
        amount,
      })),
      monthlyComparison: DEMO_DASHBOARD_METRICS.monthlyTrends.map((m) => ({
        ...m,
        savings: m.income - m.expense,
      })),
      topExpenses: txns
        .filter((t) => t.type === 'expense')
        .sort((a, b) => Number(b.amount) - Number(a.amount))
        .slice(0, 5),
    };
  },

  resetDemoData: () =>
    set({
      demoProfile: { ...DEMO_PROFILE },
      demoAccounts: createInitialDemoAccounts(),
      demoCategories: [...DEMO_CATEGORIES],
      demoTransactions: createInitialDemoTransactions(),
      demoBudgets: [{ ...DEMO_BUDGET }],
      demoGoals: DEMO_SAVINGS_GOALS.map((g) => ({ ...g })),
      demoGoalContributions: createInitialGoalContributions(),
      demoGroups: DEMO_SPLIT_GROUPS.map((g) => ({ ...g, members: g.members ? [...g.members] : [] })),
      demoGroupExpenses: createInitialDemoGroupExpenses(),
      demoGroupSettlements: {},
    }),
}));
