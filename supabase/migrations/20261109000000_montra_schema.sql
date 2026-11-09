-- ====================================================================
-- MONTRA PERSONAL FINANCE DATABASE SCHEMA
-- Migration: 20261109000000_montra_schema.sql
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  monthly_salary NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  salary_date INT NOT NULL DEFAULT 1 CHECK (salary_date >= 1 AND salary_date <= 31),
  theme_preference TEXT NOT NULL DEFAULT 'system' CHECK (theme_preference IN ('system', 'dark', 'light')),
  notification_preferences JSONB NOT NULL DEFAULT '{"budget_alerts": true, "salary_reminder": true, "group_updates": true, "goal_progress": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank', 'cash', 'credit', 'investment', 'wallet', 'other')),
  balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  balance_minor BIGINT NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TRANSACTION CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.transaction_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  to_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  title TEXT NOT NULL,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'UPI',
  receipt_url TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'weekly', 'yearly')) DEFAULT 'monthly',
  month INT CHECK (month >= 1 AND month <= 12),
  year INT NOT NULL,
  total_limit NUMERIC(12,2) NOT NULL CHECK (total_limit > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. BUDGET CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.transaction_categories(id) ON DELETE CASCADE,
  allocated_amount NUMERIC(12,2) NOT NULL CHECK (allocated_amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(budget_id, category_id)
);

-- 8. SAVINGS GOALS TABLE
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(12,2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (current_amount >= 0),
  target_date DATE,
  category TEXT DEFAULT 'General',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. SAVINGS CONTRIBUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.savings_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')) DEFAULT 'deposit',
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. EXPENSE GROUPS (SPLITWISE-STYLE)
CREATE TABLE IF NOT EXISTS public.expense_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Trip',
  currency TEXT NOT NULL DEFAULT 'INR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. GROUP MEMBERS
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  member_email TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, member_name)
);

-- 12. GROUP EXPENSES
CREATE TABLE IF NOT EXISTS public.group_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES public.group_members(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  split_type TEXT NOT NULL CHECK (split_type IN ('equal', 'exact', 'percentage', 'shares')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. EXPENSE SPLITS
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.group_expenses(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.group_members(id) ON DELETE CASCADE,
  owed_amount NUMERIC(12,2) NOT NULL CHECK (owed_amount >= 0),
  owed_minor BIGINT NOT NULL CHECK (owed_minor >= 0),
  share_value NUMERIC(10,2),
  is_settled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(expense_id, member_id)
);

-- 14. SETTLEMENTS
CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES public.group_members(id) ON DELETE CASCADE,
  payee_id UUID NOT NULL REFERENCES public.group_members(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  notes TEXT,
  payment_method TEXT NOT NULL DEFAULT 'UPI',
  settled_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. RECURRING TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  title TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_run_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('budget', 'salary', 'goal', 'split', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions (category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions (account_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON public.budgets (user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members (user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_group_expenses_group ON public.group_expenses (group_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense ON public.expense_splits (expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_member ON public.expense_splits (member_id);
CREATE INDEX IF NOT EXISTS idx_settlements_group ON public.settlements (group_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON public.savings_goals (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, is_read);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. ACCOUNTS POLICIES
CREATE POLICY "Users can manage own accounts" ON public.accounts
  FOR ALL USING (auth.uid() = user_id);

-- 3. CATEGORIES POLICIES
CREATE POLICY "Users can view system or own categories" ON public.transaction_categories
  FOR SELECT USING (is_system = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own categories" ON public.transaction_categories
  FOR ALL USING (auth.uid() = user_id);

-- 4. TRANSACTIONS POLICIES
CREATE POLICY "Users can manage own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

-- 5. BUDGETS POLICIES
CREATE POLICY "Users can manage own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage budget categories" ON public.budget_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.budgets
      WHERE public.budgets.id = budget_categories.budget_id
      AND public.budgets.user_id = auth.uid()
    )
  );

-- 6. SAVINGS GOALS POLICIES
CREATE POLICY "Users can manage own savings goals" ON public.savings_goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own savings contributions" ON public.savings_contributions
  FOR ALL USING (auth.uid() = user_id);

-- 7. EXPENSE GROUPS POLICIES
-- Group access only if creator OR member
CREATE POLICY "Members can view expense groups" ON public.expense_groups
  FOR SELECT USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE public.group_members.group_id = expense_groups.id
      AND public.group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create expense groups" ON public.expense_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators or members can update group" ON public.expense_groups
  FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE public.group_members.group_id = expense_groups.id
      AND public.group_members.user_id = auth.uid()
      AND public.group_members.role = 'admin'
    )
  );

CREATE POLICY "Group creators can delete group" ON public.expense_groups
  FOR DELETE USING (auth.uid() = created_by);

-- 8. GROUP MEMBERS POLICIES
CREATE POLICY "Members can view other members in group" ON public.group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.expense_groups
      WHERE public.expense_groups.id = group_members.group_id
      AND (
        public.expense_groups.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.group_members gm2
          WHERE gm2.group_id = group_members.group_id
          AND gm2.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Group creators or admins can add members" ON public.group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expense_groups
      WHERE public.expense_groups.id = group_members.group_id
      AND (
        public.expense_groups.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.group_members gm2
          WHERE gm2.group_id = group_members.group_id
          AND gm2.user_id = auth.uid()
          AND gm2.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Group creators or admins can delete members" ON public.group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.expense_groups
      WHERE public.expense_groups.id = group_members.group_id
      AND (public.expense_groups.created_by = auth.uid() OR group_members.user_id = auth.uid())
    )
  );

-- 9. GROUP EXPENSES & SPLITS POLICIES
CREATE POLICY "Group members can view expenses" ON public.group_expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE public.group_members.group_id = group_expenses.group_id
      AND public.group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can insert expenses" ON public.group_expenses
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE public.group_members.group_id = group_expenses.group_id
      AND public.group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Expense creators can update or delete expenses" ON public.group_expenses
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Group members can view expense splits" ON public.expense_splits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_expenses ge
      JOIN public.group_members gm ON gm.group_id = ge.group_id
      WHERE ge.id = expense_splits.expense_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Expense creators can manage expense splits" ON public.expense_splits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.group_expenses
      WHERE public.group_expenses.id = expense_splits.expense_id
      AND public.group_expenses.created_by = auth.uid()
    )
  );

-- 10. SETTLEMENTS POLICIES
CREATE POLICY "Group members can view and create settlements" ON public.settlements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE public.group_members.group_id = settlements.group_id
      AND public.group_members.user_id = auth.uid()
    )
  );

-- 11. RECURRING TRANSACTIONS & NOTIFICATIONS POLICIES
CREATE POLICY "Users can manage own recurring transactions" ON public.recurring_transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- ====================================================================
-- SYSTEM SEED CATEGORIES FUNCTION
-- ====================================================================
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Default Income Categories
  INSERT INTO public.transaction_categories (user_id, name, type, icon, color, is_system) VALUES
    (p_user_id, 'Salary', 'income', 'Briefcase', '#4ADE80', true),
    (p_user_id, 'Freelance', 'income', 'Laptop', '#38BDF8', true),
    (p_user_id, 'Business', 'income', 'Building2', '#A3E635', true),
    (p_user_id, 'Investments', 'income', 'TrendingUp', '#818CF8', true),
    (p_user_id, 'Bonuses', 'income', 'Gift', '#F472B6', true),
    (p_user_id, 'Other Income', 'income', 'CircleDollarSign', '#94A3B8', true)
  ON CONFLICT DO NOTHING;

  -- Default Expense Categories
  INSERT INTO public.transaction_categories (user_id, name, type, icon, color, is_system) VALUES
    (p_user_id, 'Food & Dining', 'expense', 'Utensils', '#F87171', true),
    (p_user_id, 'Groceries', 'expense', 'ShoppingCart', '#FB923C', true),
    (p_user_id, 'Shopping', 'expense', 'ShoppingBag', '#F472B6', true),
    (p_user_id, 'Rent & Housing', 'expense', 'Home', '#60A5FA', true),
    (p_user_id, 'Transportation', 'expense', 'Car', '#A78BFA', true),
    (p_user_id, 'Electricity', 'expense', 'Zap', '#FBBF24', true),
    (p_user_id, 'Internet & Bills', 'expense', 'Wifi', '#38BDF8', true),
    (p_user_id, 'Healthcare', 'expense', 'HeartPulse', '#EF4444', true),
    (p_user_id, 'Education', 'expense', 'GraduationCap', '#34D399', true),
    (p_user_id, 'Entertainment', 'expense', 'Film', '#C084FC', true),
    (p_user_id, 'Travel', 'expense', 'Plane', '#2DD4BF', true),
    (p_user_id, 'Subscriptions', 'expense', 'Tv', '#818CF8', true),
    (p_user_id, 'EMIs & Loans', 'expense', 'CreditCard', '#FB7185', true),
    (p_user_id, 'Other Expenses', 'expense', 'MoreHorizontal', '#94A3B8', true)
  ON CONFLICT DO NOTHING;

  -- Default Primary Bank Account
  INSERT INTO public.accounts (user_id, name, type, balance, balance_minor, is_default) VALUES
    (p_user_id, 'Primary Bank', 'bank', 0.00, 0, true),
    (p_user_id, 'Cash', 'cash', 0.00, 0, false)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile and seed categories on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, currency)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'currency', 'INR')
  );

  PERFORM public.seed_default_categories(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

