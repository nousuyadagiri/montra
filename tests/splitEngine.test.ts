import {
  computeExpenseSplits,
  calculateSettlements,
  SplitMemberInput,
} from '../src/utils/splitEngine';

describe('Splitwise Mathematical Engine', () => {
  describe('computeExpenseSplits', () => {
    it('splits equally among 3 members and distributes remaining 1-paise accurately', () => {
      // ₹100.00 split 3 ways: 10000 paise / 3 = 3333 with remainder 1
      const participants: SplitMemberInput[] = [
        { memberId: 'm1', memberName: 'Alice' },
        { memberId: 'm2', memberName: 'Bob' },
        { memberId: 'm3', memberName: 'Charlie' },
      ];

      const splits = computeExpenseSplits(100.0, 'equal', participants);

      expect(splits).toHaveLength(3);
      expect(splits[0].owedMinor).toBe(3334);
      expect(splits[1].owedMinor).toBe(3333);
      expect(splits[2].owedMinor).toBe(3333);

      // Total minor units must sum up to exactly 10000 paise (₹100.00)
      const totalSumMinor = splits.reduce((acc, s) => acc + s.owedMinor, 0);
      expect(totalSumMinor).toBe(10000);
      expect(splits[0].owedAmount).toBe(33.34);
      expect(splits[1].owedAmount).toBe(33.33);
      expect(splits[2].owedAmount).toBe(33.33);
    });

    it('splits by exact percentages and guarantees exact 100% allocation', () => {
      // ₹3,000 split: Alice 50%, Bob 30%, Charlie 20%
      const participants: SplitMemberInput[] = [
        { memberId: 'm1', memberName: 'Alice', shareValue: 50 },
        { memberId: 'm2', memberName: 'Bob', shareValue: 30 },
        { memberId: 'm3', memberName: 'Charlie', shareValue: 20 },
      ];

      const splits = computeExpenseSplits(3000.0, 'percentage', participants);

      expect(splits[0].owedAmount).toBe(1500.0);
      expect(splits[1].owedAmount).toBe(900.0);
      expect(splits[2].owedAmount).toBe(600.0);

      const totalSumMinor = splits.reduce((acc, s) => acc + s.owedMinor, 0);
      expect(totalSumMinor).toBe(300000);
    });

    it('splits by custom shares accurately', () => {
      // ₹1,000 split: Alice 2 shares, Bob 1 share, Charlie 1 share (total 4 shares)
      const participants: SplitMemberInput[] = [
        { memberId: 'm1', memberName: 'Alice', shareValue: 2 },
        { memberId: 'm2', memberName: 'Bob', shareValue: 1 },
        { memberId: 'm3', memberName: 'Charlie', shareValue: 1 },
      ];

      const splits = computeExpenseSplits(1000.0, 'shares', participants);

      expect(splits[0].owedAmount).toBe(500.0);
      expect(splits[1].owedAmount).toBe(250.0);
      expect(splits[2].owedAmount).toBe(250.0);
    });

    it('handles exact amount splits', () => {
      const participants: SplitMemberInput[] = [
        { memberId: 'm1', memberName: 'Alice', shareValue: 450.5 },
        { memberId: 'm2', memberName: 'Bob', shareValue: 549.5 },
      ];

      const splits = computeExpenseSplits(1000.0, 'exact', participants);
      expect(splits[0].owedAmount).toBe(450.5);
      expect(splits[1].owedAmount).toBe(549.5);
    });
  });

  describe('calculateSettlements (Min-Cash-Flow Simplification)', () => {
    it('simplifies multi-debtor group expenses into minimal transactions', () => {
      // Scenario:
      // Alice paid ₹3,000 for dinner for Alice, Bob, and Charlie.
      // Net balances:
      // Alice: +₹2,000 (+200000 minor)
      // Bob: -₹1,000 (-100000 minor)
      // Charlie: -₹1,000 (-100000 minor)

      const members = [
        { id: 'm1', name: 'Alice' },
        { id: 'm2', name: 'Bob' },
        { id: 'm3', name: 'Charlie' },
      ];

      const netBalancesMinor = {
        m1: 200000,
        m2: -100000,
        m3: -100000,
      };

      const settlements = calculateSettlements(members, netBalancesMinor);

      expect(settlements).toHaveLength(2);
      expect(settlements[0].payeeName).toBe('Alice');
      expect(settlements[0].amount).toBe(1000.0);
      expect(settlements[1].payeeName).toBe('Alice');
      expect(settlements[1].amount).toBe(1000.0);
    });

    it('returns empty settlements array when all balances are settled', () => {
      const members = [
        { id: 'm1', name: 'Alice' },
        { id: 'm2', name: 'Bob' },
      ];

      const netBalancesMinor = {
        m1: 0,
        m2: 0,
      };

      const settlements = calculateSettlements(members, netBalancesMinor);
      expect(settlements).toHaveLength(0);
    });
  });
});

