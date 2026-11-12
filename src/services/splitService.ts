import { supabase } from '../lib/supabase';
import { ExpenseGroup, GroupMember, GroupExpense, Settlement, SupportedCurrency } from '../types/database';
import { toMinorUnits } from '../utils/currency';
import { getErrorMessage } from '../utils/errors';
import { useSyncStore } from '../store/syncStore';
import { authService } from './authService';
import {
  computeExpenseSplits,
  calculateSettlements,
  SplitType,
  SplitMemberInput,
  DebtSettlement,
} from '../utils/splitEngine';

const generateUuidV4 = (): string => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export interface GroupDetailsData {
  group: ExpenseGroup;
  members: GroupMember[];
  expenses: GroupExpense[];
  settlements: Settlement[];
  totalExpenses: number;
  yourNetBalance: number;
  youOweTotal: number;
  youAreOwedTotal: number;
  memberBalances: {
    memberId: string;
    memberName: string;
    isCurrentUser: boolean;
    netBalance: number;
  }[];
  simplifiedDebts: DebtSettlement[];
}

export const splitService = {
  async getGroups(userId: string): Promise<ExpenseGroup[]> {
    // Groups created by user or where user is a member
    const { data: memberGroups, error: memQueryErr } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (memQueryErr) {
      console.warn('Error fetching group memberships:', memQueryErr.message);
    }

    const groupIds = (memberGroups || []).map((m) => m.group_id);

    let query = supabase.from('expense_groups').select('*, members:group_members(*)');

    if (groupIds.length > 0) {
      query = query.or(`created_by.eq.${userId},id.in.(${groupIds.join(',')})`);
    } else {
      query = query.eq('created_by', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(getErrorMessage(error, 'Unable to load shared groups.'));
    return data || [];
  },

  async getGroupDetails(groupId: string, currentUserId: string): Promise<GroupDetailsData> {
    const { data: group, error: groupErr } = await supabase
      .from('expense_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupErr) throw groupErr;

    const { data: members, error: memErr } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId);

    if (memErr) throw memErr;

    const { data: expenses, error: expErr } = await supabase
      .from('group_expenses')
      .select('*, payer:group_members!paid_by(*), splits:expense_splits(*, member:group_members!member_id(*))')
      .eq('group_id', groupId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (expErr) throw expErr;

    const { data: settlements, error: setErr } = await supabase
      .from('settlements')
      .select('*, payer:group_members!payer_id(*), payee:group_members!payee_id(*)')
      .eq('group_id', groupId)
      .order('settled_at', { ascending: false });

    if (setErr) throw setErr;

    // Calculate balances
    const memberList: GroupMember[] = members || [];
    const expenseList: GroupExpense[] = expenses || [];
    const settlementList: Settlement[] = settlements || [];

    const netBalancesMinor: Record<string, number> = {};
    memberList.forEach((m) => {
      netBalancesMinor[m.id] = 0;
    });

    let totalExpensesMinor = 0;

    // 1. Process expenses
    expenseList.forEach((exp) => {
      const expMinor = toMinorUnits(Number(exp.amount));
      totalExpensesMinor += expMinor;

      // Payer gets credit (+)
      if (netBalancesMinor[exp.paid_by] !== undefined) {
        netBalancesMinor[exp.paid_by] += expMinor;
      }

      // Debtors get debit (-)
      (exp.splits || []).forEach((split) => {
        const owedMinor = toMinorUnits(Number(split.owed_amount));
        if (netBalancesMinor[split.member_id] !== undefined) {
          netBalancesMinor[split.member_id] -= owedMinor;
        }
      });
    });

    // 2. Process settlements
    settlementList.forEach((s) => {
      const sMinor = toMinorUnits(Number(s.amount));
      // Payer paid money, so payer gets credit toward debt reduction (+)
      if (netBalancesMinor[s.payer_id] !== undefined) {
        netBalancesMinor[s.payer_id] += sMinor;
      }
      // Payee received money, so payee's credit is reduced (-)
      if (netBalancesMinor[s.payee_id] !== undefined) {
        netBalancesMinor[s.payee_id] -= sMinor;
      }
    });

    const currentMember = memberList.find((m) => m.user_id === currentUserId);
    const yourBalanceMinor = currentMember ? netBalancesMinor[currentMember.id] || 0 : 0;
    const yourNetBalance = Number((yourBalanceMinor / 100).toFixed(2));

    let youOweTotal = 0;
    let youAreOwedTotal = 0;
    if (yourNetBalance < 0) {
      youOweTotal = Math.abs(yourNetBalance);
    } else {
      youAreOwedTotal = yourNetBalance;
    }

    const memberBalances = memberList.map((m) => {
      const balMinor = netBalancesMinor[m.id] || 0;
      return {
        memberId: m.id,
        memberName: m.member_name,
        isCurrentUser: m.user_id === currentUserId,
        netBalance: Number((balMinor / 100).toFixed(2)),
      };
    });

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
      youOweTotal,
      youAreOwedTotal,
      memberBalances,
      simplifiedDebts,
    };
  },

  async createGroup(
    userId: string,
    input: {
      name: string;
      description?: string;
      category?: string;
      currency?: string;
      memberNames?: string[];
      currentUserName?: string;
    }
  ): Promise<ExpenseGroup> {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error('Please enter a name for the group.');
    }

    const { data: authData } = await supabase.auth.getUser();
    const effectiveUser = authData?.user;
    const effectiveUserId = effectiveUser?.id || userId;
    if (!effectiveUserId) {
      throw new Error('Please sign in to create a shared group.');
    }

    // Guarantee profiles row exists before inserting FK expense_groups.created_by
    try {
      await authService.ensureProfile({
        id: effectiveUserId,
        email: effectiveUser?.email,
        user_metadata: effectiveUser?.user_metadata,
      });
    } catch {
      // Fallback insert path / RPC handles profile creation cleanly too
    }

    const creatorName = (input.currentUserName || effectiveUser?.user_metadata?.full_name || 'You').trim();
    const seenNames = new Set<string>([creatorName.toLowerCase()]);
    const uniqueFriendNames: string[] = [];

    (input.memberNames || []).forEach((name) => {
      const trimmed = name.trim();
      if (trimmed && !seenNames.has(trimmed.toLowerCase())) {
        seenNames.add(trimmed.toLowerCase());
        uniqueFriendNames.push(trimmed);
      }
    });

    const trimmedDesc = input.description?.trim() || null;
    const groupCategory = input.category || 'Trip';
    const groupCurrency = (input.currency || 'INR') as SupportedCurrency;

    // 1. Prefer atomic SECURITY DEFINER RPC when deployed
    const { data: rpcGroup, error: rpcErr } = await supabase.rpc('create_expense_group', {
      p_name: trimmedName,
      p_description: trimmedDesc,
      p_category: groupCategory,
      p_currency: groupCurrency,
      p_creator_name: creatorName,
      p_member_names: uniqueFriendNames,
    });

    if (!rpcErr && rpcGroup) {
      useSyncStore.getState().bumpSync();
      return rpcGroup as ExpenseGroup;
    }

    const isRpcUnavailable =
      rpcErr?.code === 'PGRST202' ||
      rpcErr?.code === '42883' ||
      /could not find the function|create_expense_group/i.test(rpcErr?.message || '');

    if (rpcErr && !isRpcUnavailable) {
      throw new Error(getErrorMessage(rpcErr, 'Failed to create group.'));
    }

    // 2. Direct table fallback (supports databases without RPC)
    const nowIso = new Date().toISOString();
    const groupId = generateUuidV4();
    const groupPayload = {
      id: groupId,
      created_by: effectiveUserId,
      name: trimmedName,
      description: trimmedDesc,
      category: groupCategory,
      currency: groupCurrency,
    };

    let group: ExpenseGroup | null = null;
    const { data: selectedGroup, error: groupErr } = await supabase
      .from('expense_groups')
      .insert(groupPayload)
      .select()
      .single();

    if (groupErr) {
      // Retry without RETURNING * if SELECT policy causes RLS recursion on un-migrated schemas
      if (groupErr.code === '42P17' || /infinite recursion/i.test(groupErr.message || '')) {
        const { error: bareInsertErr } = await supabase.from('expense_groups').insert(groupPayload);
        if (bareInsertErr) {
          throw new Error(getErrorMessage(bareInsertErr, 'Failed to create group.'));
        }
        group = {
          ...groupPayload,
          created_at: nowIso,
          updated_at: nowIso,
        };
      } else {
        throw new Error(getErrorMessage(groupErr, 'Failed to create group.'));
      }
    } else {
      group = selectedGroup;
    }

    if (!group) {
      throw new Error('Could not create group. Please try again.');
    }

    try {
      const memberRows: {
        group_id: string;
        user_id: string | null;
        member_name: string;
        role: 'admin' | 'member';
      }[] = [
        {
          group_id: group.id,
          user_id: effectiveUserId,
          member_name: creatorName,
          role: 'admin',
        },
        ...uniqueFriendNames.map((memberName) => ({
          group_id: group!.id,
          user_id: null,
          member_name: memberName,
          role: 'member' as const,
        })),
      ];

      const { error: memErr } = await supabase.from('group_members').insert(memberRows);
      if (memErr) {
        await supabase.from('expense_groups').delete().eq('id', group.id);
        throw new Error(getErrorMessage(memErr, 'Failed to add group members.'));
      }

      useSyncStore.getState().bumpSync();
      return group;
    } catch (err) {
      await supabase.from('expense_groups').delete().eq('id', group.id);
      throw err instanceof Error ? err : new Error(getErrorMessage(err, 'Failed to save group.'));
    }
  },

  async updateGroup(
    groupId: string,
    updates: { name?: string; description?: string | null; category?: string }
  ): Promise<ExpenseGroup> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.category !== undefined) payload.category = updates.category;

    const { data, error } = await supabase
      .from('expense_groups')
      .update(payload)
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;
    useSyncStore.getState().bumpSync();
    return data;
  },

  async addMember(
    groupId: string,
    memberName: string,
    memberEmail?: string,
    userId?: string
  ): Promise<GroupMember> {
    const { data, error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        member_name: memberName.trim(),
        member_email: memberEmail?.trim() || null,
        user_id: userId || null,
        role: 'member',
      })
      .select()
      .single();

    if (error) throw error;
    useSyncStore.getState().bumpSync();
    return data;
  },

  async createGroupExpense(
    groupId: string,
    userId: string,
    input: {
      title: string;
      amount: number;
      paidByMemberId: string;
      splitType: SplitType;
      participants: SplitMemberInput[];
      date?: string;
      notes?: string;
    }
  ): Promise<GroupExpense> {
    const amountMinor = toMinorUnits(input.amount);

    const { data: expense, error: expErr } = await supabase
      .from('group_expenses')
      .insert({
        group_id: groupId,
        created_by: userId,
        paid_by: input.paidByMemberId,
        title: input.title,
        amount: input.amount,
        amount_minor: amountMinor,
        split_type: input.splitType,
        date: input.date || new Date().toISOString().split('T')[0],
        notes: input.notes || null,
      })
      .select()
      .single();

    if (expErr) throw expErr;

    try {
      // Calculate splits
      const splits = computeExpenseSplits(input.amount, input.splitType, input.participants);

      const splitRows = splits.map((s) => ({
        expense_id: expense.id,
        member_id: s.memberId,
        owed_amount: s.owedAmount,
        owed_minor: s.owedMinor,
        is_settled: false,
      }));

      const { error: splitErr } = await supabase.from('expense_splits').insert(splitRows);
      if (splitErr) {
        await supabase.from('group_expenses').delete().eq('id', expense.id);
        throw splitErr;
      }

      useSyncStore.getState().bumpSync();
      return expense;
    } catch (err) {
      await supabase.from('group_expenses').delete().eq('id', expense.id);
      throw err;
    }
  },

  async updateGroupExpense(
    expenseId: string,
    input: {
      title: string;
      amount: number;
      paidByMemberId: string;
      splitType: SplitType;
      participants: SplitMemberInput[];
      date?: string;
      notes?: string;
    }
  ): Promise<GroupExpense> {
    const amountMinor = toMinorUnits(input.amount);

    const { data: expense, error: expErr } = await supabase
      .from('group_expenses')
      .update({
        paid_by: input.paidByMemberId,
        title: input.title,
        amount: input.amount,
        amount_minor: amountMinor,
        split_type: input.splitType,
        date: input.date || new Date().toISOString().split('T')[0],
        notes: input.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', expenseId)
      .select()
      .single();

    if (expErr) throw expErr;

    const splits = computeExpenseSplits(input.amount, input.splitType, input.participants);
    await supabase.from('expense_splits').delete().eq('expense_id', expenseId);

    const splitRows = splits.map((s) => ({
      expense_id: expenseId,
      member_id: s.memberId,
      owed_amount: s.owedAmount,
      owed_minor: s.owedMinor,
      is_settled: false,
    }));

    const { error: splitErr } = await supabase.from('expense_splits').insert(splitRows);
    if (splitErr) throw splitErr;

    useSyncStore.getState().bumpSync();
    return expense;
  },

  async recordSettlement(
    groupId: string,
    input: {
      payerId: string;
      payeeId: string;
      amount: number;
      notes?: string;
      paymentMethod?: string;
    }
  ): Promise<Settlement> {
    const amountMinor = toMinorUnits(input.amount);

    const { data, error } = await supabase
      .from('settlements')
      .insert({
        group_id: groupId,
        payer_id: input.payerId,
        payee_id: input.payeeId,
        amount: input.amount,
        amount_minor: amountMinor,
        notes: input.notes || null,
        payment_method: input.paymentMethod || 'UPI',
      })
      .select()
      .single();

    if (error) throw error;
    useSyncStore.getState().bumpSync();
    return data;
  },

  async deleteSettlement(settlementId: string): Promise<void> {
    const { error } = await supabase.from('settlements').delete().eq('id', settlementId);
    if (error) throw error;
    useSyncStore.getState().bumpSync();
  },

  async deleteGroupExpense(expenseId: string): Promise<void> {
    const { error } = await supabase.from('group_expenses').delete().eq('id', expenseId);
    if (error) throw error;
    useSyncStore.getState().bumpSync();
  },

  async deleteGroup(groupId: string): Promise<void> {
    const { error } = await supabase.from('expense_groups').delete().eq('id', groupId);
    if (error) throw error;
    useSyncStore.getState().bumpSync();
  },
};

