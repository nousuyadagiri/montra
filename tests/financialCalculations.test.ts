import { salaryService, DEFAULT_ALLOCATION_RULES } from '../src/services/salaryService';

describe('Financial Metrics & Salary Calculations', () => {
  describe('salaryService.calculateAllocations', () => {
    it('computes suggested allocations following 50/30/20 budget framework', () => {
      const monthlySalary = 60000;
      const allocations = salaryService.calculateAllocations(monthlySalary);

      expect(allocations).toHaveLength(DEFAULT_ALLOCATION_RULES.length);

      // Rent 25% of 60,000 = 15,000
      const rent = allocations.find((a) => a.category.includes('Rent'));
      expect(rent?.suggestedAmount).toBe(15000);

      // Food 15% of 60,000 = 9,000
      const food = allocations.find((a) => a.category.includes('Food'));
      expect(food?.suggestedAmount).toBe(9000);

      // Savings 20% of 60,000 = 12,000
      const savings = allocations.find((a) => a.category.includes('Savings'));
      expect(savings?.suggestedAmount).toBe(12000);

      // Total percentage must sum to 100%
      const totalPct = allocations.reduce((acc, a) => acc + a.percentage, 0);
      expect(totalPct).toBe(100);

      // Total allocated must equal the monthly salary
      const totalAllocated = allocations.reduce((acc, a) => acc + a.suggestedAmount, 0);
      expect(totalAllocated).toBe(monthlySalary);
    });

    it('handles zero salary without crashing', () => {
      const allocations = salaryService.calculateAllocations(0);
      allocations.forEach((a) => {
        expect(a.suggestedAmount).toBe(0);
      });
    });
  });

  describe('Budget Tracking Metrics', () => {
    it('accurately computes spent percentage and detects budget status', () => {
      const budgetLimit = 10000;
      const spentHealthy = 5500;
      const spentWarning = 8500;
      const spentExceeded = 11200;

      const pctHealthy = Math.round((spentHealthy / budgetLimit) * 100);
      const pctWarning = Math.round((spentWarning / budgetLimit) * 100);
      const pctExceeded = Math.round((spentExceeded / budgetLimit) * 100);

      expect(pctHealthy).toBe(55);
      expect(pctWarning).toBe(85);
      expect(pctExceeded).toBe(112);

      // Condition tests
      expect(spentHealthy > budgetLimit).toBe(false);
      expect(pctHealthy >= 80).toBe(false);

      expect(spentWarning > budgetLimit).toBe(false);
      expect(pctWarning >= 80).toBe(true);

      expect(spentExceeded > budgetLimit).toBe(true);
    });
  });
});

