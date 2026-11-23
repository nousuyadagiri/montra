export type SupportedCurrency = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  currency: SupportedCurrency;
  monthly_salary: number;
  salary_date: number;
  theme_preference: 'system' | 'dark' | 'light';
  notification_preferences: {
    budget_alerts: boolean;
    salary_reminder: boolean;
    group_updates: boolean;
    goal_progress: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'bank' | 'cash' | 'credit' | 'investment' | 'wallet' | 'other';
  balance: number;
  balance_minor: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionCategory {
  id: string;
  user_id?: string | null;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  is_system: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id?: string | null;
  to_account_id?: string | null;
  category_id?: string | null;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  amount_minor: number;
  title: string;
  notes?: string | null;
  date: string;
  payment_method: string;
  receipt_url?: string | null;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
  category?: TransactionCategory;
  account?: Account;
}

export interface Budget {
  id: string;
  user_id: string;
  name: string;
  period: 'monthly' | 'weekly' | 'yearly';
  month?: number | null;
  year: number;
  total_limit: number;
  created_at: string;
  updated_at: string;
  categories?: BudgetCategory[];
}

export interface BudgetCategory {
  id: string;
  budget_id: string;
  category_id: string;
  allocated_amount: number;
  category?: TransactionCategory;
  spent_amount?: number;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string | null;
  category: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavingsContribution {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  notes?: string | null;
  date: string;
  created_at: string;
}

export interface ExpenseGroup {
  id: string;
  created_by: string;
  name: string;
  description?: string | null;
  category: string;
  currency: SupportedCurrency;
  created_at: string;
  updated_at: string;
  members?: GroupMember[];
  total_expenses?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id?: string | null;
  member_name: string;
  member_email?: string | null;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface GroupExpense {
  id: string;
  group_id: string;
  paid_by: string;
  created_by: string;
  title: string;
  amount: number;
  amount_minor: number;
  split_type: 'equal' | 'exact' | 'percentage' | 'shares';
  date: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  payer?: GroupMember;
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  member_id: string;
  owed_amount: number;
  owed_minor: number;
  share_value?: number | null;
  is_settled: boolean;
  created_at: string;
  member?: GroupMember;
}

export interface Settlement {
  id: string;
  group_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  amount_minor: number;
  notes?: string | null;
  payment_method: string;
  settled_at: string;
  payer?: GroupMember;
  payee?: GroupMember;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id?: string | null;
  category_id?: string | null;
  type: 'income' | 'expense';
  amount: number;
  title: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_run_date: string;
  is_active: boolean;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'budget' | 'salary' | 'goal' | 'split' | 'system' | 'chat';
  is_read: boolean;
  data?: any;
  created_at: string;
}

// ====================================================================
// CHAT & MONEY CONVERSATION SYSTEM TYPES
// ====================================================================

export type ConversationType = 'direct' | 'group';

export type MessageType =
  | 'text'
  | 'money_request'
  | 'payment_update'
  | 'expense_notification'
  | 'system';

export type MoneyRequestStatus = 'pending' | 'accepted' | 'declined' | 'paid';

export interface MoneyRequestMetadata {
  request_id?: string;
  amount: number;
  currency: SupportedCurrency | string;
  status: MoneyRequestStatus;
  requester_id: string;
  recipient_id: string;
  requester_name?: string;
  recipient_name?: string;
  related_expense_id?: string | null;
  related_settlement_id?: string | null;
  notes?: string | null;
}

export interface PaymentUpdateMetadata {
  amount: number;
  currency: SupportedCurrency | string;
  sender_id: string;
  recipient_id?: string;
  sender_name?: string;
  recipient_name?: string;
  payment_method?: string;
  settlement_id?: string | null;
  notes?: string | null;
  is_verified?: boolean;
}

export interface ExpenseNotificationMetadata {
  expense_id: string;
  group_id: string;
  title: string;
  amount: number;
  currency: SupportedCurrency | string;
  split_type: string;
  paid_by_name: string;
  category?: string;
  created_by_name?: string;
}

export interface SystemMessageMetadata {
  action: string;
  details?: any;
}

export type MessageMetadata =
  | MoneyRequestMetadata
  | PaymentUpdateMetadata
  | ExpenseNotificationMetadata
  | SystemMessageMetadata
  | Record<string, any>;

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: MessageType;
  content: string;
  metadata: MessageMetadata;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  sender?: Profile;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
  is_muted: boolean;
  role: 'admin' | 'member';
  profile?: Profile;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  group_id?: string | null;
  title?: string | null;
  created_by?: string | null;
  last_message_at: string;
  last_message_preview?: string | null;
  created_at: string;
  updated_at: string;
  participants?: ConversationParticipant[];
  other_participant?: Profile;
  group?: ExpenseGroup;
  unread_count?: number;
}

export interface MoneyRequest {
  id: string;
  conversation_id: string;
  message_id?: string | null;
  requester_id: string;
  recipient_id: string;
  amount: number;
  currency: SupportedCurrency | string;
  status: MoneyRequestStatus;
  related_expense_id?: string | null;
  related_settlement_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  requester?: Profile;
  recipient?: Profile;
}

export interface UserPresence {
  user_id: string;
  last_seen_at: string;
  is_online: boolean;
}


