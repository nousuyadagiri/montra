import {
  Profile,
  Transaction,
  TransactionCategory,
  Budget,
  SavingsGoal,
  ExpenseGroup,
  GroupMember,
  GroupExpense,
} from '../types/database';
import { DashboardMetrics } from './dashboardService';
import { GroupDetailsData } from './splitService';

// ==========================================
// 1. SAMPLE USER PROFILE (Alex Morgan)
// ==========================================
export const DEMO_PROFILE: Profile = {
  id: 'demo-user-alex-morgan',
  full_name: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  avatar_url: null,
  currency: 'INR',
  monthly_salary: 75000,
  salary_date: 1,
  theme_preference: 'dark',
  notification_preferences: {
    budget_alerts: true,
    salary_reminder: true,
    group_updates: true,
    goal_progress: true,
  },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// ==========================================
// 2. SAMPLE CATEGORIES
// ==========================================
export const DEMO_CATEGORIES: TransactionCategory[] = [
  { id: 'cat-salary', name: 'Salary', type: 'income', icon: 'wallet', color: '#607D68', is_system: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-freelance', name: 'Freelance', type: 'income', icon: 'briefcase', color: '#758078', is_system: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-housing', name: 'Rent', type: 'expense', icon: 'home', color: '#8A9A86', is_system: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-groceries', name: 'Groceries', type: 'expense', icon: 'shopping-bag', color: '#6B8E73', is_system: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-food', name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#B96F68', is_system: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-transport', name: 'Transportation', type: 'expense', icon: 'car', color: '#7E8C82', is_system: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-electricity', name: 'Electricity', type: 'expense', icon: 'zap', color: '#B68B4B', is_system: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-shopping', name: 'Shopping', type: 'expense', icon: 'tag', color: '#A87C77', is_system: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-internet', name: 'Internet', type: 'expense', icon: 'wifi', color: '#6F887C', is_system: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-entertainment', name: 'Entertainment', type: 'expense', icon: 'film', color: '#A68560', is_system: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-health', name: 'Healthcare & Fitness', type: 'expense', icon: 'heart-pulse', color: '#B96F68', is_system: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-savings', name: 'Savings & Investment', type: 'expense', icon: 'piggy-bank', color: '#607D68', is_system: true, created_at: '2026-01-01T00:00:00Z' },
];

const catMap = new Map(DEMO_CATEGORIES.map((c) => [c.id, c]));

// Helpers to generate dynamic current-month dates
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth(); // 0-based
const fmtDate = (day: number) => {
  const d = new Date(currentYear, currentMonth, day);
  return d.toISOString().split('T')[0];
};

// ==========================================
// 3. SAMPLE TRANSACTIONS (Mathematically Balanced)
// ==========================================
export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'demo-txn-01',
    user_id: DEMO_PROFILE.id,
    type: 'income',
    amount: 75000,
    amount_minor: 7500000,
    title: 'Monthly Salary',
    notes: 'Direct deposit from TechCorp India',
    date: fmtDate(1),
    payment_method: 'Bank Transfer',
    is_recurring: true,
    category_id: 'cat-salary',
    category: catMap.get('cat-salary'),
    created_at: fmtDate(1) + 'T09:00:00Z',
    updated_at: fmtDate(1) + 'T09:00:00Z',
  },
  {
    id: 'demo-txn-02',
    user_id: DEMO_PROFILE.id,
    type: 'expense',
    amount: 15000,
    amount_minor: 1500000,
    title: 'Apartment Rent',
    notes: 'Monthly flat rent for 2BHK Indiranagar',
    date: fmtDate(2),
    payment_method: 'UPI',
    is_recurring: true,
    category_id: 'cat-housing',
    category: catMap.get('cat-housing'),
    created_at: fmtDate(2) + 'T10:30:00Z',
    updated_at: fmtDate(2) + 'T10:30:00Z',
  },
  {
    id: 'demo-txn-03',
    user_id: DEMO_PROFILE.id,
    type: 'income',
    amount: 8000,
    amount_minor: 800000,
    title: 'Freelance Design Retainer',
    notes: 'Milestone payment for UI redesign',
    date: fmtDate(4),
    payment_method: 'Bank Transfer',
    is_recurring: false,
    category_id: 'cat-freelance',
    category: catMap.get('cat-freelance'),
    created_at: fmtDate(4) + 'T14:15:00Z',
    updated_at: fmtDate(4) + 'T14:15:00Z',
  },
  {
    id: 'demo-txn-04',
    user_id: DEMO_PROFILE.id,
    type: 'expense',
    amount: 4500,
    amount_minor: 450000,
    title: 'Groceries & Pantry',
    notes: 'Nature Basket & Blinkit monthly restocking',
    date: fmtDate(5),
    payment_method: 'Credit Card',
    is_recurring: false,
    category_id: 'cat-groceries',
    category: catMap.get('cat-groceries'),
    created_at: fmtDate(5) + 'T18:45:00Z',
    updated_at: fmtDate(5) + 'T18:45:00Z',
  },
  {
    id: 'demo-txn-05',
    user_id: DEMO_PROFILE.id,
    type: 'expense',
    amount: 3200,
    amount_minor: 320000,
    title: 'Weekend Shopping',
    notes: 'Zara apparel and sneakers',
    date: fmtDate(6),
    payment_method: 'Credit Card',
    is_recurring: false,
    category_id: 'cat-shopping',
    category: catMap.get('cat-shopping'),
    created_at: fmtDate(6) + 'T16:20:00Z',
    updated_at: fmtDate(6) + 'T16:20:00Z',
  },
  {
    id: 'demo-txn-06',
    user_id: DEMO_PROFILE.id,
    type: 'expense',
    amount: 2200,
    amount_minor: 220000,
    title: 'Food & Dining Out',
    notes: 'Dinner at Burma Burma with colleagues',
    date: fmtDate(7),
    payment_method: 'UPI',
    is_recurring: false,
    category_id: 'cat-food',
    category: catMap.get('cat-food'),
    created_at: fmtDate(7) + 'T21:00:00Z',
    updated_at: fmtDate(7) + 'T21:00:00Z',
  },
  {
    id: 'demo-txn-07',
    user_id: DEMO_PROFILE.id,
    type: 'expense',
    amount: 1800,
    amount_minor: 180000,
    title: 'Electricity Bill',
    notes: 'BESCOM electricity consumption',
    date: fmtDate(8),
    payment_method: 'Net Banking',
    is_recurring: true,
    category_id: 'cat-electricity',
    category: catMap.get('cat-electricity'),
    created_at: fmtDate(8) + 'T11:00:00Z',
    updated_at: fmtDate(8) + 'T11:00:00Z',
  },
  {
    id: 'demo-txn-08',
    user_id: DEMO_PROFILE.id,
    type: 'expense',
    amount: 1500,
    amount_minor: 150000,
    title: 'Transportation & Cabs',
    notes: 'Uber commute and Metro smart card recharge',
    date: fmtDate(9),
    payment_method: 'UPI',
    is_recurring: false,
    category_id: 'cat-transport',
    category: catMap.get('cat-transport'),
    created_at: fmtDate(9) + 'T08:30:00Z',
    updated_at: fmtDate(9) + 'T08:30:00Z',
  },
  {
    id: 'demo-txn-09',
    user_id: DEMO_PROFILE.id,
    type: 'expense',
    amount: 1200,
    amount_minor: 120000,
    title: 'Entertainment & Movies',
    notes: 'PVR IMAX tickets and snacks',
    date: fmtDate(10),
    payment_method: 'UPI',
    is_recurring: false,
    category_id: 'cat-entertainment',
    category: catMap.get('cat-entertainment'),
    created_at: fmtDate(10) + 'T19:30:00Z',
    updated_at: fmtDate(10) + 'T19:30:00Z',
  },
  {
    id: 'demo-txn-10',
    user_id: DEMO_PROFILE.id,
    type: 'expense',
    amount: 999,
    amount_minor: 99900,
    title: 'Broadband Internet',
    notes: 'Airtel Xstream fiber 200 Mbps plan',
    date: fmtDate(10),
    payment_method: 'UPI',
    is_recurring: true,
    category_id: 'cat-internet',
    category: catMap.get('cat-internet'),
    created_at: fmtDate(10) + 'T10:00:00Z',
    updated_at: fmtDate(10) + 'T10:00:00Z',
  },
  {
    id: 'demo-txn-11',
    user_id: DEMO_PROFILE.id,
    type: 'expense',
    amount: 1500,
    amount_minor: 150000,
    title: 'Gym & Fitness',
    notes: 'Monthly Cult.fit access',
    date: fmtDate(11),
    payment_method: 'Credit Card',
    is_recurring: true,
    category_id: 'cat-health',
    category: catMap.get('cat-health'),
    created_at: fmtDate(11) + 'T07:30:00Z',
    updated_at: fmtDate(11) + 'T07:30:00Z',
  },
  {
    id: 'demo-txn-12',
    user_id: DEMO_PROFILE.id,
    type: 'expense',
    amount: 340,
    amount_minor: 34000,
    title: 'Blue Tokai Coffee',
    notes: 'Cold brew and croissant',
    date: fmtDate(11),
    payment_method: 'UPI',
    is_recurring: false,
    category_id: 'cat-food',
    category: catMap.get('cat-food'),
    created_at: fmtDate(11) + 'T15:45:00Z',
    updated_at: fmtDate(11) + 'T15:45:00Z',
  },
];

// Calculations:
// Income: 75,000 + 8,000 = 83,000
// Expenses: 15000 + 4500 + 3200 + 2200 + 1800 + 1500 + 1200 + 999 + 1500 + 340 = 32,239
// Net Savings: 83,000 - 32,239 = 50,761
// Savings Rate: (50761 / 83000) * 100 = 61.16% => 61%
// Total Available Balance: 1,50,761 (Assumes opening balance of 1,00,000)

// ==========================================
// 4. SAMPLE DASHBOARD METRICS
// ==========================================
export const DEMO_DASHBOARD_METRICS: DashboardMetrics = {
  totalBalance: 150761,
  monthlyIncome: 83000,
  monthlyExpenses: 32239,
  netSavings: 50761,
  savingsRate: 61,
  todayExpenses: 1840, // Gym 1500 + Coffee 340
  thisWeekExpenses: 12239,
  thisMonthExpenses: 32239,
  monthlySalary: 75000,
  salaryDate: 1,
  additionalIncome: 8000,
  recentTransactions: DEMO_TRANSACTIONS.slice(0, 5),
  categoryBreakdown: [
    { categoryName: 'Rent', amount: 15000, percentage: 46.5, color: '#8A9A86', icon: 'home' },
    { categoryName: 'Groceries', amount: 4500, percentage: 14.0, color: '#6B8E73', icon: 'shopping-bag' },
    { categoryName: 'Shopping', amount: 3200, percentage: 9.9, color: '#A87C77', icon: 'tag' },
    { categoryName: 'Food & Dining', amount: 2540, percentage: 7.9, color: '#B96F68', icon: 'utensils' },
    { categoryName: 'Electricity', amount: 1800, percentage: 5.6, color: '#B68B4B', icon: 'zap' },
    { categoryName: 'Transportation', amount: 1500, percentage: 4.7, color: '#7E8C82', icon: 'car' },
    { categoryName: 'Fitness', amount: 1500, percentage: 4.7, color: '#B96F68', icon: 'heart-pulse' },
    { categoryName: 'Entertainment', amount: 1200, percentage: 3.7, color: '#A68560', icon: 'film' },
    { categoryName: 'Internet', amount: 999, percentage: 3.1, color: '#6F887C', icon: 'wifi' },
  ],
  monthlyTrends: [
    { month: 'Jun', income: 75000, expense: 34200 },
    { month: 'Jul', income: 75000, expense: 31800 },
    { month: 'Aug', income: 82000, expense: 35600 },
    { month: 'Sep', income: 75000, expense: 29900 },
    { month: 'Oct', income: 85000, expense: 38400 },
    { month: 'Nov', income: 83000, expense: 32239 },
  ],
};

// ==========================================
// 5. SAMPLE BUDGETS
// ==========================================
export const DEMO_BUDGET: Budget = {
  id: 'demo-budget-nov-2026',
  user_id: DEMO_PROFILE.id,
  name: 'Monthly Living Budget',
  period: 'monthly',
  month: currentMonth + 1,
  year: currentYear,
  total_limit: 49000,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  categories: [
    {
      id: 'demo-bc-1',
      budget_id: 'demo-budget-nov-2026',
      category_id: 'cat-housing',
      allocated_amount: 15000,
      spent_amount: 15000,
      category: catMap.get('cat-housing'),
    },
    {
      id: 'demo-bc-2',
      budget_id: 'demo-budget-nov-2026',
      category_id: 'cat-food',
      allocated_amount: 8000,
      spent_amount: 7040, // Groceries 4500 + Dining 2200 + Coffee 340
      category: catMap.get('cat-food'),
    },
    {
      id: 'demo-bc-3',
      budget_id: 'demo-budget-nov-2026',
      category_id: 'cat-shopping',
      allocated_amount: 5000,
      spent_amount: 3200,
      category: catMap.get('cat-shopping'),
    },
    {
      id: 'demo-bc-4',
      budget_id: 'demo-budget-nov-2026',
      category_id: 'cat-transport',
      allocated_amount: 4000,
      spent_amount: 1500,
      category: catMap.get('cat-transport'),
    },
    {
      id: 'demo-bc-5',
      budget_id: 'demo-budget-nov-2026',
      category_id: 'cat-electricity',
      allocated_amount: 4000,
      spent_amount: 2799, // Electricity 1800 + Internet 999
      category: catMap.get('cat-electricity'),
    },
    {
      id: 'demo-bc-6',
      budget_id: 'demo-budget-nov-2026',
      category_id: 'cat-entertainment',
      allocated_amount: 3000,
      spent_amount: 1200,
      category: catMap.get('cat-entertainment'),
    },
    {
      id: 'demo-bc-7',
      budget_id: 'demo-budget-nov-2026',
      category_id: 'cat-savings',
      allocated_amount: 10000,
      spent_amount: 10000,
      category: catMap.get('cat-savings'),
    },
  ],
};

// ==========================================
// 6. SAMPLE SPLIT GROUPS
// ==========================================
export const DEMO_SPLIT_GROUPS: ExpenseGroup[] = [
  {
    id: 'demo-group-apartment',
    name: 'Apartment Expenses',
    category: 'Home',
    currency: 'INR',
    description: 'Shared 2BHK flat rent, maid, groceries & utilities',
    created_by: DEMO_PROFILE.id,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    total_expenses: 10098,
    members: [
      { id: 'm-alex', group_id: 'demo-group-apartment', user_id: DEMO_PROFILE.id, member_name: 'Alex Morgan (You)', role: 'admin', joined_at: '2026-01-01T00:00:00Z' },
      { id: 'm-rohan', group_id: 'demo-group-apartment', member_name: 'Rohan Sharma', role: 'member', joined_at: '2026-01-01T00:00:00Z' },
      { id: 'm-priya', group_id: 'demo-group-apartment', member_name: 'Priya Patel', role: 'member', joined_at: '2026-01-01T00:00:00Z' },
    ],
  },
  {
    id: 'demo-group-goa',
    name: 'Goa Trip 🏖️',
    category: 'Travel',
    currency: 'INR',
    description: 'Villa stay, bike rentals, beach shacks and sunset cruises',
    created_by: 'm-sameer',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    total_expenses: 34000,
    members: [
      { id: 'm-alex-goa', group_id: 'demo-group-goa', user_id: DEMO_PROFILE.id, member_name: 'Alex Morgan (You)', role: 'member', joined_at: '2026-01-01T00:00:00Z' },
      { id: 'm-sameer', group_id: 'demo-group-goa', member_name: 'Sameer Verma', role: 'admin', joined_at: '2026-01-01T00:00:00Z' },
      { id: 'm-ananya', group_id: 'demo-group-goa', member_name: 'Ananya Iyer', role: 'member', joined_at: '2026-01-01T00:00:00Z' },
      { id: 'm-vikram', group_id: 'demo-group-goa', member_name: 'Vikram Singh', role: 'member', joined_at: '2026-01-01T00:00:00Z' },
    ],
  },
  {
    id: 'demo-group-dinner',
    name: 'Weekend Dinner 🍣',
    category: 'Food',
    currency: 'INR',
    description: 'Japanese dining & craft beers at Kuuraku',
    created_by: DEMO_PROFILE.id,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    total_expenses: 4800,
    members: [
      { id: 'm-alex-dinner', group_id: 'demo-group-dinner', user_id: DEMO_PROFILE.id, member_name: 'Alex Morgan (You)', role: 'admin', joined_at: '2026-01-01T00:00:00Z' },
      { id: 'm-neha', group_id: 'demo-group-dinner', member_name: 'Neha Gupta', role: 'member', joined_at: '2026-01-01T00:00:00Z' },
      { id: 'm-rahul', group_id: 'demo-group-dinner', member_name: 'Rahul Sen', role: 'member', joined_at: '2026-01-01T00:00:00Z' },
    ],
  },
];

export const DEMO_SPLIT_BALANCES = {
  totalOwedToYou: 5432, // +2,232 (Apartment) + 3,200 (Dinner)
  totalYouOwe: 5300,    // -5,300 (Goa Trip)
  netBalance: 132,      // +132 overall
};

// ==========================================
// 7. SAMPLE SAVINGS GOALS
// ==========================================
export const DEMO_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'demo-goal-emergency',
    user_id: DEMO_PROFILE.id,
    name: 'Emergency Fund',
    target_amount: 100000,
    current_amount: 72000,
    target_date: `${currentYear}-12-31`,
    category: 'Safety',
    is_completed: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-goal-laptop',
    user_id: DEMO_PROFILE.id,
    name: 'M4 MacBook Pro',
    target_amount: 80000,
    current_amount: 55000,
    target_date: `${currentYear}-08-15`,
    category: 'Gadgets',
    is_completed: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-goal-vacation',
    user_id: DEMO_PROFILE.id,
    name: 'Japan Autumn Trip',
    target_amount: 50000,
    current_amount: 32000,
    target_date: `${currentYear}-10-20`,
    category: 'Travel',
    is_completed: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

// ==========================================
// 8. SAMPLE ANALYTICS INSIGHTS
// ==========================================
export const DEMO_ANALYTICS_INSIGHTS = [
  {
    id: 'insight-1',
    title: 'Healthy Savings Rate',
    description: 'You saved 61% of your total income this month, exceeding your 50% target.',
    type: 'positive' as const,
  },
  {
    id: 'insight-2',
    title: 'Top Expense Category',
    description: 'Apartment rent accounts for 46.5% of your total spending.',
    type: 'neutral' as const,
  },
  {
    id: 'insight-3',
    title: 'Budget On Track',
    description: '5 of your 7 budget categories are well below their allocated limits.',
    type: 'positive' as const,
  },
];

