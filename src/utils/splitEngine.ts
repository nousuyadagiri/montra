import { toMinorUnits, fromMinorUnits } from './currency';

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares';

export interface SplitMemberInput {
  memberId: string;
  memberName: string;
  shareValue?: number; // percentage, exact amount, or shares
}

export interface ComputedSplit {
  memberId: string;
  owedMinor: number;
  owedAmount: number;
}

export interface DebtSettlement {
  payerId: string;
  payerName: string;
  payeeId: string;
  payeeName: string;
  amount: number;
  amountMinor: number;
}

/**
 * Calculates member expense shares without floating-point rounding errors.
 */
export function computeExpenseSplits(
  totalAmount: number,
  splitType: SplitType,
  participants: SplitMemberInput[]
): ComputedSplit[] {
  if (participants.length === 0) return [];
  const totalMinor = toMinorUnits(totalAmount);

  if (splitType === 'equal') {
    const n = participants.length;
    const baseMinor = Math.floor(totalMinor / n);
    const remainder = totalMinor % n;

    return participants.map((p, idx) => {
      // Distribute remainder 1 paise at a time to first 'remainder' members
      const memberMinor = baseMinor + (idx < remainder ? 1 : 0);
      return {
        memberId: p.memberId,
        owedMinor: memberMinor,
        owedAmount: fromMinorUnits(memberMinor),
      };
    });
  }

  if (splitType === 'percentage') {
    let allocatedMinor = 0;
    const splits = participants.map((p, idx) => {
      const pct = p.shareValue || 0;
      let memberMinor = Math.round((totalMinor * pct) / 100);
      if (idx === participants.length - 1) {
        // Adjust final member to guarantee exact sum
        memberMinor = totalMinor - allocatedMinor;
      } else {
        allocatedMinor += memberMinor;
      }
      return {
        memberId: p.memberId,
        owedMinor: Math.max(0, memberMinor),
        owedAmount: fromMinorUnits(Math.max(0, memberMinor)),
      };
    });
    return splits;
  }

  if (splitType === 'shares') {
    const totalShares = participants.reduce((acc, p) => acc + (p.shareValue || 1), 0);
    let allocatedMinor = 0;
    return participants.map((p, idx) => {
      const shares = p.shareValue || 1;
      let memberMinor = Math.floor((totalMinor * shares) / totalShares);
      if (idx === participants.length - 1) {
        memberMinor = totalMinor - allocatedMinor;
      } else {
        allocatedMinor += memberMinor;
      }
      return {
        memberId: p.memberId,
        owedMinor: Math.max(0, memberMinor),
        owedAmount: fromMinorUnits(Math.max(0, memberMinor)),
      };
    });
  }

  // Exact amounts
  return participants.map((p) => {
    const m = toMinorUnits(p.shareValue || 0);
    return {
      memberId: p.memberId,
      owedMinor: m,
      owedAmount: fromMinorUnits(m),
    };
  });
}

/**
 * Calculates simplified debt settlements using a greedy min-cash-flow algorithm.
 * Balances: map of memberId -> net balance in minor units (+ = owed money, - = owes money).
 */
export function calculateSettlements(
  members: { id: string; name: string }[],
  netBalancesMinor: Record<string, number>
): DebtSettlement[] {
  const memberNameMap: Record<string, string> = {};
  members.forEach((m) => {
    memberNameMap[m.id] = m.name;
  });

  // Separate creditors (+) and debtors (-)
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  Object.entries(netBalancesMinor).forEach(([id, balance]) => {
    if (balance > 1) {
      creditors.push({ id, amount: balance });
    } else if (balance < -1) {
      debtors.push({ id, amount: -balance });
    }
  });

  const settlements: DebtSettlement[] = [];
  let i = 0; // debtor index
  let j = 0; // creditor index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settledAmount = Math.min(debtor.amount, creditor.amount);

    if (settledAmount > 0) {
      settlements.push({
        payerId: debtor.id,
        payerName: memberNameMap[debtor.id] || 'Unknown',
        payeeId: creditor.id,
        payeeName: memberNameMap[creditor.id] || 'Unknown',
        amount: fromMinorUnits(settledAmount),
        amountMinor: settledAmount,
      });
    }

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount <= 1) i++;
    if (creditor.amount <= 1) j++;
  }

  return settlements;
}

