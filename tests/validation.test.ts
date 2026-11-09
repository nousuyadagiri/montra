import {
  loginSchema,
  registerSchema,
  transactionSchema,
  budgetSchema,
  savingsGoalSchema,
  groupSchema,
} from '../src/utils/validation';

describe('Validation Schemas & Financial Guards', () => {
  describe('loginSchema', () => {
    it('validates correct email and password', () => {
      const res = loginSchema.safeParse({
        email: 'user@montra.finance',
        password: 'password123',
      });
      expect(res.success).toBe(true);
    });

    it('rejects invalid email formats', () => {
      const res = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(res.success).toBe(false);
    });

    it('rejects passwords shorter than 6 characters', () => {
      const res = loginSchema.safeParse({
        email: 'user@montra.finance',
        password: '123',
      });
      expect(res.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('accepts matching passwords and valid fields', () => {
      const res = registerSchema.safeParse({
        fullName: 'Alex Johnson',
        email: 'alex@example.com',
        password: 'securePassword!',
        confirmPassword: 'securePassword!',
        currency: 'INR',
      });
      expect(res.success).toBe(true);
    });

    it('rejects mismatched password and confirmation', () => {
      const res = registerSchema.safeParse({
        fullName: 'Alex Johnson',
        email: 'alex@example.com',
        password: 'securePassword!',
        confirmPassword: 'differentPassword!',
        currency: 'INR',
      });
      expect(res.success).toBe(false);
    });
  });

  describe('transactionSchema', () => {
    it('accepts valid expense transaction', () => {
      const res = transactionSchema.safeParse({
        title: 'Weekly Groceries',
        amount: 2500.5,
        type: 'expense',
        categoryId: 'cat-123',
        date: '2026-11-09',
        paymentMethod: 'UPI',
      });
      expect(res.success).toBe(true);
    });

    it('rejects zero amounts', () => {
      const res = transactionSchema.safeParse({
        title: 'Test',
        amount: 0,
        type: 'expense',
        categoryId: 'cat-123',
        date: '2026-11-09',
      });
      expect(res.success).toBe(false);
    });

    it('rejects negative amounts', () => {
      const res = transactionSchema.safeParse({
        title: 'Test',
        amount: -500,
        type: 'expense',
        categoryId: 'cat-123',
        date: '2026-11-09',
      });
      expect(res.success).toBe(false);
    });
  });

  describe('budgetSchema', () => {
    it('accepts valid monthly budget', () => {
      const res = budgetSchema.safeParse({
        name: 'Nov 2026 Living',
        totalLimit: 50000,
        period: 'monthly',
        month: 11,
        year: 2026,
      });
      expect(res.success).toBe(true);
    });

    it('rejects zero or negative budget limits', () => {
      const res = budgetSchema.safeParse({
        name: 'Invalid Budget',
        totalLimit: 0,
        year: 2026,
      });
      expect(res.success).toBe(false);
    });
  });

  describe('savingsGoalSchema', () => {
    it('accepts valid goal target', () => {
      const res = savingsGoalSchema.safeParse({
        name: 'Vacation',
        targetAmount: 75000,
        currentAmount: 15000,
        category: 'Travel',
      });
      expect(res.success).toBe(true);
    });

    it('rejects zero target amount', () => {
      const res = savingsGoalSchema.safeParse({
        name: 'Invalid Goal',
        targetAmount: 0,
      });
      expect(res.success).toBe(false);
    });
  });
});

