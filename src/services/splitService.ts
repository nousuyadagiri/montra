import { supabase } from '../lib/supabase';
import { ExpenseGroup, GroupMember, GroupExpense, Settlement } from '../types/database';
import { toMinorUnits } from '../utils/currency';
import {
  computeExpenseSplits,
  calculateSettlements,
  SplitType,
  SplitMemberInput,
  DebtSettlement,
} from '../utils/splitEngine';

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
    const { data: memberGroups } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    const groupIds = (memberGroups || []).map((m) => m.group_id);

    let query = supabase.from('expense_groups').select('*, members:group_members(*)');

    if (groupIds.length > 0) {
      query = query.or(`created_by.eq.${userId},id.in.(${groupIds.join(',')})`);
    } else {
      query = query.eq('created_by', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
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
      .select('*, payer:paid_by(*), splits:expense_splits(*, member:member_id(*))')
      .eq('group_id', groupId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (expErr) throw expErr;

    const { data: settlements, error: setErr } = await supabase
      .from('settlements')
      .select('*, payer:payer_id(*), payee:payee_id(*)')
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
    const { data: group, error: groupErr } = await supabase
      .from('expense_groups')
      .insert({
        created_by: userId,
        name: input.name,
        description: input.description || null,
        category: input.category || 'Trip',
        currency: input.currency || 'INR',
      })
      .select()
      .single();

    if (groupErr) throw groupErr;

    // Automatically add current user as admin member
    const memberRows = [
      {
        group_id: group.id,
        user_id: userId,
        member_name: input.currentUserName || 'You',
        role: 'admin',
      },
    ];

    if (input.memberNames && input.memberNames.length > 0) {
      input.memberNames.forEach((name) => {
        if (name.trim()) {
          memberRows.push({
            group_id: group.id,
            user_id: null as any,
            member_name: name.trim(),
            role: 'member',
          });
        }
      });
    }

    const { error: memErr } = await supabase.from('group_members').insert(memberRows);
    if (memErr) console.warn('Failed to insert members:', memErr);

    return group;
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
        member_name: memberName,
        member_email: memberEmail || null,
        user_id: userId || null,
        role: 'member',
      })
      .select()
      .single();

    if (error) throw error;
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
    if (splitErr) throw splitErr;

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
    return data;
  },

  async deleteGroupExpense(expenseId: string): Promise<void> {
    const { error } = await supabase.from('group_expenses').delete().eq('id', expenseId);
    if (error) throw error;
  },

  async deleteGroup(groupId: string): Promise<void> {
    const { error } = await supabase.from('expense_groups').delete().eq('id', groupId);
    if (error) throw error;
  },
};

