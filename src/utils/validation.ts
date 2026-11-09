import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    currency: z.enum(['INR', 'USD', 'EUR', 'GBP']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const transactionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  type: z.enum(['income', 'expense', 'transfer']),
  categoryId: z.string().min(1, 'Please select a category'),
  accountId: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  paymentMethod: z.string().default('UPI'),
  notes: z.string().optional(),
});

export const budgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  totalLimit: z.number().positive('Budget limit must be greater than zero'),
  period: z.enum(['monthly', 'weekly', 'yearly']).default('monthly'),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2020),
});

export const savingsGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  targetAmount: z.number().positive('Target amount must be greater than zero'),
  currentAmount: z.number().min(0).default(0),
  targetDate: z.string().optional(),
  category: z.string().default('General'),
});

export const groupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
  category: z.string().default('Trip'),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']).default('INR'),
});

export const groupExpenseSchema = z.object({
  title: z.string().min(1, 'Expense title is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  paidByMemberId: z.string().min(1, 'Payer is required'),
  splitType: z.enum(['equal', 'exact', 'percentage', 'shares']).default('equal'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});

export const settlementSchema = z.object({
  payerId: z.string().min(1, 'Payer is required'),
  payeeId: z.string().min(1, 'Payee is required'),
  amount: z.number().positive('Settlement amount must be greater than zero'),
  paymentMethod: z.string().default('UPI'),
  notes: z.string().optional(),
});
