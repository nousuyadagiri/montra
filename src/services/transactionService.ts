import { supabase } from '../lib/supabase';
import { Transaction, TransactionCategory, Account } from '../types/database';
import { toMinorUnits } from '../utils/currency';

export interface CreateTransactionInput {
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  categoryId?: string | null;
  accountId?: string | null;
  toAccountId?: string | null;
  date: string;
  notes?: string | null;
  paymentMethod?: string;
  receiptUrl?: string | null;
  isRecurring?: boolean;
}

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: 'income' | 'expense' | 'transfer';
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export const transactionService = {
  async getTransactions(userId: string, filters: TransactionFilters = {}): Promise<Transaction[]> {
    let query = supabase
      .from('transactions')
      .select('*, category:transaction_categories(*), account:accounts(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters.accountId) {
      query = query.eq('account_id', filters.accountId);
    }
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters.searchQuery) {
      query = query.ilike('title', `%${filters.searchQuery}%`);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getTransactionById(id: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:transaction_categories(*), account:accounts(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createTransaction(userId: string, input: CreateTransactionInput): Promise<Transaction> {
    const amountMinor = toMinorUnits(input.amount);

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        title: input.title,
        amount: input.amount,
        amount_minor: amountMinor,
        type: input.type,
        category_id: input.categoryId || null,
        account_id: input.accountId || null,
        to_account_id: input.toAccountId || null,
        date: input.date,
        notes: input.notes || null,
        payment_method: input.paymentMethod || 'UPI',
        receipt_url: input.receiptUrl || null,
        is_recurring: input.isRecurring || false,
      })
      .select('*, category:transaction_categories(*), account:accounts(*)')
      .single();

    if (error) throw error;

    // Update account balances
    if (input.accountId) {
      await this.adjustAccountBalance(input.accountId, input.amount, input.type);
    }
    if (input.type === 'transfer' && input.toAccountId) {
      await this.adjustAccountBalance(input.toAccountId, input.amount, 'income');
    }

    return data;
  },

  async updateTransaction(
    id: string,
    updates: Partial<CreateTransactionInput>
  ): Promise<Transaction> {
    const payload: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    if (updates.amount !== undefined) {
      payload.amount_minor = toMinorUnits(updates.amount);
    }
    if (updates.categoryId !== undefined) {
      payload.category_id = updates.categoryId;
      delete payload.categoryId;
    }
    if (updates.accountId !== undefined) {
      payload.account_id = updates.accountId;
      delete payload.accountId;
    }
    if (updates.toAccountId !== undefined) {
      payload.to_account_id = updates.toAccountId;
      delete payload.toAccountId;
    }
    if (updates.paymentMethod !== undefined) {
      payload.payment_method = updates.paymentMethod;
      delete payload.paymentMethod;
    }
    if (updates.receiptUrl !== undefined) {
      payload.receipt_url = updates.receiptUrl;
      delete payload.receiptUrl;
    }
    if (updates.isRecurring !== undefined) {
      payload.is_recurring = updates.isRecurring;
      delete payload.isRecurring;
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(payload)
      .eq('id', id)
      .select('*, category:transaction_categories(*), account:accounts(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },

  async adjustAccountBalance(
    accountId: string,
    amount: number,
    type: 'income' | 'expense' | 'transfer'
  ): Promise<void> {
    try {
      const { data: account } = await supabase
        .from('accounts')
        .select('balance, balance_minor')
        .eq('id', accountId)
        .single();

      if (!account) return;

      const delta = type === 'income' ? amount : -amount;
      const newBalance = Number((Number(account.balance) + delta).toFixed(2));
      const newBalanceMinor = toMinorUnits(newBalance);

      await supabase
        .from('accounts')
        .update({
          balance: newBalance,
          balance_minor: newBalanceMinor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', accountId);
    } catch (err) {
      console.warn('Failed to adjust account balance:', err);
    }
  },

  async getCategories(userId: string, type?: 'income' | 'expense'): Promise<TransactionCategory[]> {
    let query = supabase
      .from('transaction_categories')
      .select('*')
      .or(`user_id.eq.${userId},is_system.eq.true`)
      .order('name');

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getAccounts(userId: string): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async createAccount(userId: string, account: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        ...account,
        user_id: userId,
        balance_minor: toMinorUnits(account.balance),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

