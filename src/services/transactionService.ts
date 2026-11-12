import { supabase } from '../lib/supabase';
import { Transaction, TransactionCategory, Account } from '../types/database';
import { toMinorUnits } from '../utils/currency';
import { authService } from './authService';
import { useSyncStore } from '../store/syncStore';

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
      .select('*, category:transaction_categories(*), account:accounts!account_id(*)')
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
      .select('*, category:transaction_categories(*), account:accounts!account_id(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createTransaction(userId: string, input: CreateTransactionInput): Promise<Transaction> {
    // Ensure user has at least one account selected
    let effectiveAccountId = input.accountId;
    if (!effectiveAccountId) {
      const accounts = await this.getAccounts(userId);
      const defaultAcc = accounts.find((a) => a.is_default) || accounts[0];
      effectiveAccountId = defaultAcc?.id || null;
    }

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
        account_id: effectiveAccountId,
        to_account_id: input.toAccountId || null,
        date: input.date,
        notes: input.notes || null,
        payment_method: input.paymentMethod || 'UPI',
        receipt_url: input.receiptUrl || null,
        is_recurring: input.isRecurring || false,
      })
      .select('*, category:transaction_categories(*), account:accounts!account_id(*)')
      .single();

    if (error) throw error;

    // Update account balances
    if (effectiveAccountId) {
      await this.adjustAccountBalance(effectiveAccountId, input.amount, input.type);
    }
    if (input.type === 'transfer' && input.toAccountId) {
      await this.adjustAccountBalance(input.toAccountId, input.amount, 'income');
    }

    useSyncStore.getState().bumpSync();
    return data;
  },

  async updateTransaction(
    id: string,
    updates: Partial<CreateTransactionInput>
  ): Promise<Transaction> {
    const existing = await this.getTransactionById(id);

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.date !== undefined) payload.date = updates.date;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.amount !== undefined) {
      payload.amount = updates.amount;
      payload.amount_minor = toMinorUnits(updates.amount);
    }
    if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
    if (updates.accountId !== undefined) payload.account_id = updates.accountId;
    if (updates.toAccountId !== undefined) payload.to_account_id = updates.toAccountId;
    if (updates.paymentMethod !== undefined) payload.payment_method = updates.paymentMethod;
    if (updates.receiptUrl !== undefined) payload.receipt_url = updates.receiptUrl;
    if (updates.isRecurring !== undefined) payload.is_recurring = updates.isRecurring;

    const { data, error } = await supabase
      .from('transactions')
      .update(payload)
      .eq('id', id)
      .select('*, category:transaction_categories(*), account:accounts!account_id(*)')
      .single();

    if (error) throw error;

    // Reverse old account balance impact & apply new account balance impact
    if (existing) {
      const oldAmt = Number(existing.amount || 0);
      if (existing.type === 'transfer') {
        if (existing.account_id) {
          await this.adjustAccountBalance(existing.account_id, oldAmt, 'income');
        }
        if (existing.to_account_id) {
          await this.adjustAccountBalance(existing.to_account_id, oldAmt, 'expense');
        }
      } else if (existing.account_id) {
        await this.adjustAccountBalance(
          existing.account_id,
          oldAmt,
          existing.type === 'income' ? 'expense' : 'income'
        );
      }
    }

    const nextAmt = Number(data.amount || 0);
    if (data.type === 'transfer') {
      if (data.account_id) {
        await this.adjustAccountBalance(data.account_id, nextAmt, 'expense');
      }
      if (data.to_account_id) {
        await this.adjustAccountBalance(data.to_account_id, nextAmt, 'income');
      }
    } else if (data.account_id) {
      await this.adjustAccountBalance(data.account_id, nextAmt, data.type);
    }

    useSyncStore.getState().bumpSync();
    return data;
  },

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
    useSyncStore.getState().bumpSync();
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

    if (!data || data.length === 0) {
      await authService.ensureDefaultAccountsAndCategories(userId);
      let retryQuery = supabase
        .from('transaction_categories')
        .select('*')
        .or(`user_id.eq.${userId},is_system.eq.true`)
        .order('name');
      if (type) {
        retryQuery = retryQuery.eq('type', type);
      }
      const { data: refetched } = await retryQuery;
      return refetched || [];
    }

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

    if (!data || data.length === 0) {
      await authService.ensureDefaultAccountsAndCategories(userId);
      const { data: refetched } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('name');
      return refetched || [];
    }

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
    useSyncStore.getState().bumpSync();
    return data;
  },

  async updateAccount(
    accountId: string,
    updates: Partial<Pick<Account, 'name' | 'type' | 'balance' | 'is_default'>>
  ): Promise<Account> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.is_default !== undefined) payload.is_default = updates.is_default;
    if (updates.balance !== undefined) {
      payload.balance = updates.balance;
      payload.balance_minor = toMinorUnits(updates.balance);
    }

    const { data, error } = await supabase
      .from('accounts')
      .update(payload)
      .eq('id', accountId)
      .select()
      .single();

    if (error) throw error;
    useSyncStore.getState().bumpSync();
    return data;
  },

  async setDefaultAccount(userId: string, accountId: string): Promise<void> {
    await supabase
      .from('accounts')
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    const { error } = await supabase
      .from('accounts')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', accountId)
      .eq('user_id', userId);
    if (error) throw error;
    useSyncStore.getState().bumpSync();
  },

  async deleteAccount(accountId: string): Promise<void> {
    const { error } = await supabase.from('accounts').delete().eq('id', accountId);
    if (error) throw error;
    useSyncStore.getState().bumpSync();
  },
};

