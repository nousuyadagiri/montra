import { deduplicateCategories } from '../src/utils/categories';
import { TransactionCategory } from '../src/types/database';

describe('deduplicateCategories', () => {
  it('returns empty array when input is null, undefined, or empty', () => {
    expect(deduplicateCategories(null)).toEqual([]);
    expect(deduplicateCategories(undefined)).toEqual([]);
    expect(deduplicateCategories([])).toEqual([]);
  });

  it('deduplicates categories with identical names in the same type', () => {
    const mockCategories: TransactionCategory[] = [
      {
        id: '1',
        user_id: 'user-1',
        name: 'Bonuses',
        type: 'income',
        icon: 'Gift',
        color: '#F472B6',
        is_system: true,
        created_at: '2026-01-01',
      },
      {
        id: '2',
        user_id: 'user-1',
        name: 'Bonuses',
        type: 'income',
        icon: 'Gift',
        color: '#F472B6',
        is_system: true,
        created_at: '2026-01-02',
      },
      {
        id: '3',
        user_id: 'user-1',
        name: 'Business',
        type: 'income',
        icon: 'Building2',
        color: '#A3E635',
        is_system: true,
        created_at: '2026-01-01',
      },
      {
        id: '4',
        user_id: 'user-1',
        name: 'Business',
        type: 'income',
        icon: 'Building2',
        color: '#A3E635',
        is_system: true,
        created_at: '2026-01-02',
      },
    ];

    const result = deduplicateCategories(mockCategories, 'user-1');
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.name)).toEqual(['Bonuses', 'Business']);
  });

  it('prefers user-specific category over generic system category when names match', () => {
    const mockCategories: TransactionCategory[] = [
      {
        id: 'sys-sal',
        user_id: null,
        name: 'Salary',
        type: 'income',
        icon: 'Briefcase',
        color: '#4ADE80',
        is_system: true,
        created_at: '2026-01-01',
      },
      {
        id: 'user-sal',
        user_id: 'user-456',
        name: 'Salary',
        type: 'income',
        icon: 'Wallet',
        color: '#10B981',
        is_system: false,
        created_at: '2026-01-05',
      },
    ];

    const result = deduplicateCategories(mockCategories, 'user-456');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('user-sal');
    expect(result[0].color).toBe('#10B981');
  });

  it('keeps categories with the same name if their types differ (e.g. Other Income vs Other Expense)', () => {
    const mockCategories: TransactionCategory[] = [
      {
        id: 'inc-other',
        user_id: 'user-1',
        name: 'Other',
        type: 'income',
        icon: 'Dollar',
        color: '#94A3B8',
        is_system: true,
        created_at: '2026-01-01',
      },
      {
        id: 'exp-other',
        user_id: 'user-1',
        name: 'Other',
        type: 'expense',
        icon: 'Tag',
        color: '#94A3B8',
        is_system: true,
        created_at: '2026-01-01',
      },
    ];

    const result = deduplicateCategories(mockCategories, 'user-1');
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.type)).toEqual(['income', 'expense']);
  });

  it('handles casing and whitespace variations gracefully', () => {
    const mockCategories: TransactionCategory[] = [
      {
        id: '1',
        user_id: 'user-1',
        name: ' Groceries ',
        type: 'expense',
        icon: 'ShoppingCart',
        color: '#FB923C',
        is_system: true,
        created_at: '2026-01-01',
      },
      {
        id: '2',
        user_id: 'user-1',
        name: 'groceries',
        type: 'expense',
        icon: 'ShoppingCart',
        color: '#FB923C',
        is_system: true,
        created_at: '2026-01-02',
      },
    ];

    const result = deduplicateCategories(mockCategories, 'user-1');
    expect(result).toHaveLength(1);
    expect(result[0].name.trim().toLowerCase()).toBe('groceries');
  });
});

