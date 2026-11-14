import { TransactionCategory } from '../types/database';

/**
 * Deduplicates an array of categories by normalized name and type.
 * When duplicate names exist, prioritizes user-specific categories over system categories.
 */
export function deduplicateCategories(
  categories: TransactionCategory[] | null | undefined,
  currentUserId?: string
): TransactionCategory[] {
  if (!categories || categories.length === 0) return [];

  const map = new Map<string, TransactionCategory>();

  for (const cat of categories) {
    if (!cat || !cat.name) continue;
    // Normalize category name: trim and lowercase
    const normalizedName = cat.name.trim().toLowerCase();
    const typeKey = cat.type || 'expense';
    const key = `${normalizedName}:${typeKey}`;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, cat);
    } else {
      // If current item is owned by the current user, but existing one is not, prefer the user's category
      if (currentUserId && cat.user_id === currentUserId && existing.user_id !== currentUserId) {
        map.set(key, cat);
      }
      // If existing has no user_id (global default) and current item has user_id, prefer user's
      else if (!existing.user_id && cat.user_id) {
        map.set(key, cat);
      }
    }
  }

  // Preserve consistent alphabetical sorting by name
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

