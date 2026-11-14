import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';
import { budgetService } from '../../services/budgetService';
import { transactionService } from '../../services/transactionService';
import { TransactionCategory, SupportedCurrency } from '../../types/database';
import { Text, Input, Header, Card, LoadingState } from '../../components/ui';
import { Spacing, BorderRadius, Shadows } from '../../theme/tokens';
import { CURRENCY_SYMBOLS, parseCurrencyInput, formatCurrency } from '../../utils/currency';
import { deduplicateCategories } from '../../utils/categories';
import {
  Check,
  PieChart,
  Home,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  Wifi,
  Tag,
  Sparkles,
} from 'lucide-react-native';

const AMOUNT_PRESETS = [5000, 10000, 25000];

const getCategoryIconConfig = (name: string, isDark: boolean) => {
  const n = (name || '').toLowerCase();
  if (n.includes('rent') || n.includes('housing') || n.includes('flat')) {
    return { Icon: Home, color: '#3B82F6', bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' };
  }
  if (n.includes('food') || n.includes('dining') || n.includes('restaurant')) {
    return { Icon: Utensils, color: '#10B981', bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' };
  }
  if (n.includes('grocer')) {
    return { Icon: ShoppingBag, color: '#F59E0B', bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB' };
  }
  if (n.includes('transport') || n.includes('car') || n.includes('fuel')) {
    return { Icon: Car, color: '#6366F1', bg: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF' };
  }
  if (n.includes('electric') || n.includes('power') || n.includes('bill') || n.includes('gas')) {
    return { Icon: Zap, color: '#F59E0B', bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB' };
  }
  if (n.includes('shop') || n.includes('cloth')) {
    return { Icon: ShoppingBag, color: '#EC4899', bg: isDark ? 'rgba(236, 72, 153, 0.15)' : '#FDF2F8' };
  }
  if (n.includes('internet') || n.includes('wifi')) {
    return { Icon: Wifi, color: '#06B6D4', bg: isDark ? 'rgba(6, 182, 212, 0.15)' : '#ECFEFF' };
  }
  if (n.includes('entertainment') || n.includes('movie')) {
    return { Icon: Film, color: '#8B5CF6', bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF' };
  }
  return { Icon: Tag, color: '#6B7280', bg: isDark ? 'rgba(107, 114, 128, 0.15)' : '#F3F4F6' };
};

export default function AddBudgetScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditing = Boolean(editId);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const demoCategories = useDemoStore((s) => s.demoCategories);
  const demoBudgets = useDemoStore((s) => s.demoBudgets);
  const demoProfile = useDemoStore((s) => s.demoProfile);
  const createDemoBudget = useDemoStore((s) => s.createDemoBudget);
  const updateDemoBudget = useDemoStore((s) => s.updateDemoBudget);

  const isDemo = !user;

  const [name, setName] = useState(isEditing ? '' : 'Monthly Living Budget');
  const [totalLimitStr, setTotalLimitStr] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [categoryAllocations, setCategoryAllocations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!isDemo);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    if (isDemo) {
      setCategories(deduplicateCategories(demoCategories.filter((c) => c.type === 'expense'), demoProfile.id));
      if (editId) {
        const existing = demoBudgets.find((b) => b.id === editId);
        if (existing) {
          setName(existing.name);
          setTotalLimitStr(String(existing.total_limit));
          setPeriod(existing.period);
          const allocs: Record<string, string> = {};
          (existing.categories || []).forEach((c) => {
            allocs[c.category_id] = String(c.allocated_amount);
          });
          setCategoryAllocations(allocs);
        }
      }
      setInitialLoading(false);
      return;
    }

    if (!user) {
      setInitialLoading(false);
      return;
    }
    setInitialLoading(true);
    Promise.all([
      transactionService.getCategories(user.id, 'expense'),
      editId ? budgetService.getBudgetById(editId) : Promise.resolve(null),
    ])
      .then(([cats, existing]) => {
        setCategories(deduplicateCategories(cats, user.id));
        if (existing) {
          setName(existing.name);
          setTotalLimitStr(String(existing.total_limit));
          setPeriod(existing.period);
          const allocs: Record<string, string> = {};
          (existing.categories || []).forEach((c) => {
            allocs[c.category_id] = String(c.allocated_amount);
          });
          setCategoryAllocations(allocs);
        }
      })
      .catch((err) => toast.error(getErrorMessage(err, 'Failed to load budget options.')))
      .finally(() => setInitialLoading(false));
  }, [user, isDemo, editId, demoCategories, demoBudgets, demoProfile.id]);

  const handleAllocationChange = (catId: string, val: string) => {
    setCategoryAllocations((prev) => ({
      ...prev,
      [catId]: val,
    }));
  };

  const handleAddPreset = (increment: number) => {
    const current = parseCurrencyInput(totalLimitStr) || 0;
    setTotalLimitStr(String(current + increment));
  };

  const activeCurrency: SupportedCurrency = ((isDemo ? demoProfile?.currency : profile?.currency) as SupportedCurrency) || 'INR';
  const currencySymbol = CURRENCY_SYMBOLS[activeCurrency] || '₹';

  // Budget calculations
  const totalLimitNum = parseCurrencyInput(totalLimitStr) || 0;
  const totalAllocatedNum = useMemo(() => {
    return Object.values(categoryAllocations).reduce((sum, val) => sum + (parseCurrencyInput(val) || 0), 0);
  }, [categoryAllocations]);

  const unallocatedAmount = Math.max(0, totalLimitNum - totalAllocatedNum);
  const allocatedPct = totalLimitNum > 0 ? Math.min(100, Math.round((totalAllocatedNum / totalLimitNum) * 100)) : 0;

  const handleSave = async () => {
    const totalLimit = parseCurrencyInput(totalLimitStr);

    if (!name.trim()) {
      toast.warning('Please provide a name for this budget.', 'Budget Name Required');
      return;
    }
    if (totalLimit <= 0) {
      toast.warning('Please specify a total budget limit greater than zero.', 'Invalid Limit');
      return;
    }

    const catInputs = Object.entries(categoryAllocations)
      .map(([catId, val]) => ({
        categoryId: catId,
        allocatedAmount: parseCurrencyInput(val),
      }))
      .filter((c) => c.allocatedAmount > 0);

    try {
      setLoading(true);
      if (isDemo) {
        if (editId) {
          updateDemoBudget(editId, {
            name: name.trim(),
            period,
            month: currentMonth,
            year: currentYear,
            totalLimit,
            categories: catInputs,
          });
        } else {
          createDemoBudget({
            name: name.trim(),
            period,
            month: currentMonth,
            year: currentYear,
            totalLimit,
            categories: catInputs,
          });
        }
      } else if (user) {
        if (editId) {
          await budgetService.updateBudget(editId, {
            name: name.trim(),
            period,
            month: currentMonth,
            year: currentYear,
            totalLimit,
            categories: catInputs,
          });
        } else {
          await budgetService.createBudget(user.id, {
            name: name.trim(),
            period,
            month: currentMonth,
            year: currentYear,
            totalLimit,
            categories: catInputs,
          });
        }
      }

      toast.success(editId ? 'Budget updated successfully.' : `Budget "${name.trim()}" created!`);
      router.back();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to save budget.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header title={isEditing ? 'Edit Budget' : 'Create Budget'} showBack />
      {initialLoading ? (
        <LoadingState message="Loading categories..." />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing['3xl'] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Budget Name */}
          <Input
            label="Budget Name"
            placeholder="e.g. Monthly Living Budget"
            value={name}
            onChangeText={setName}
          />

          {/* 2. Hero Total Monthly Limit Card */}
          <View
            style={[
              styles.heroAmountCard,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : colors.borderLight,
              },
              !isDark ? Shadows.md : undefined,
            ]}
          >
            <View style={styles.heroOverlineRow}>
              <PieChart size={14} color={colors.primary} />
              <Text variant="xs" weight="bold" color="secondary" style={styles.heroOverline}>
                TOTAL MONTHLY LIMIT
              </Text>
            </View>

            <View style={styles.amountInputRow}>
              <Input
                placeholder="50000"
                prefix={currencySymbol}
                keyboardType="decimal-pad"
                value={totalLimitStr}
                onChangeText={setTotalLimitStr}
                inputStyle={{ fontSize: 28, fontWeight: '800', color: colors.mainText }}
                containerStyle={styles.amountContainer}
              />
            </View>

            {/* Quick Presets */}
            <View style={styles.presetsRow}>
              {AMOUNT_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => handleAddPreset(p)}
                  activeOpacity={0.7}
                  style={[
                    styles.presetPill,
                    {
                      backgroundColor: isDark ? colors.elevatedSurface : colors.background,
                      borderColor: isDark ? colors.border : colors.borderLight,
                    },
                  ]}
                >
                  <Text variant="xs" weight="bold" style={{ color: colors.primary, fontSize: 11 }}>
                    +{currencySymbol}{p >= 1000 ? `${p / 1000}k` : p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Allocation Visualizer Strip */}
            {totalLimitNum > 0 ? (
              <View style={styles.allocationVisualizer}>
                <View
                  style={[
                    styles.allocTrack,
                    { backgroundColor: isDark ? colors.elevatedSurface : colors.borderLight },
                  ]}
                >
                  <View
                    style={[
                      styles.allocFill,
                      {
                        width: `${allocatedPct}%`,
                        backgroundColor: allocatedPct > 100 ? colors.error : colors.primary,
                      },
                    ]}
                  />
                </View>

                <View style={styles.allocStatsRow}>
                  <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
                    Allocated: <Text variant="xs" weight="bold" style={{ color: colors.mainText }}>{formatCurrency(totalAllocatedNum, activeCurrency)}</Text> ({allocatedPct}%)
                  </Text>
                  <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
                    Unallocated: <Text variant="xs" weight="bold" style={{ color: colors.positive }}>{formatCurrency(unallocatedAmount, activeCurrency)}</Text>
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* 3. Category-Specific Limits */}
          {categories.length > 0 ? (
            <View style={styles.sectionWrapper}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} color={colors.primary} />
                  <Text variant="xs" weight="bold" color="secondary" style={styles.sectionLabel}>
                    CATEGORY BUDGET CAPS (OPTIONAL)
                  </Text>
                </View>
                <Text variant="xs" color="tertiary" style={{ fontSize: 11 }}>
                  {categories.length} categories
                </Text>
              </View>

              <View
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isDark ? colors.border : colors.borderLight,
                  },
                  !isDark ? Shadows.sm : undefined,
                ]}
              >
                {categories.map((c, idx) => {
                  const cfg = getCategoryIconConfig(c.name, isDark);
                  const IconComp = cfg.Icon;
                  const catAllocNum = parseCurrencyInput(categoryAllocations[c.id] || '') || 0;
                  const catPct = totalLimitNum > 0 ? Math.round((catAllocNum / totalLimitNum) * 100) : 0;

                  return (
                    <View key={c.id}>
                      <View style={styles.catRow}>
                        <View style={[styles.catIconBox, { backgroundColor: cfg.bg }]}>
                          <IconComp size={18} color={cfg.color} strokeWidth={2.2} />
                        </View>

                        <View style={styles.catNameGroup}>
                          <Text variant="sm" weight="bold" numberOfLines={1} style={{ color: colors.mainText }}>
                            {c.name}
                          </Text>
                          {catAllocNum > 0 ? (
                            <Text variant="xs" color="secondary" style={{ fontSize: 10.5, marginTop: 1 }}>
                              {catPct}% of total limit
                            </Text>
                          ) : (
                            <Text variant="xs" color="tertiary" style={{ fontSize: 10.5, marginTop: 1 }}>
                              No limit set
                            </Text>
                          )}
                        </View>

                        <View style={styles.catInputWrapper}>
                          <Input
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            prefix={currencySymbol}
                            value={categoryAllocations[c.id] || ''}
                            onChangeText={(val) => handleAllocationChange(c.id, val)}
                            containerStyle={{ marginBottom: 0, width: 130 }}
                            inputStyle={{ fontSize: 13, paddingVertical: 5, fontWeight: '700' }}
                          />
                        </View>
                      </View>

                      {idx < categories.length - 1 && (
                        <View
                          style={[
                            styles.divider,
                            { backgroundColor: isDark ? colors.border : colors.borderLight },
                          ]}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* 4. Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          >
            <Check size={18} color={colors.onPrimary} strokeWidth={2.5} />
            <Text variant="base" weight="bold" style={{ color: colors.onPrimary, marginLeft: 8 }}>
              {loading ? 'Saving Budget...' : isEditing ? 'Update Budget' : 'Save Budget'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  heroAmountCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  heroOverlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  heroOverline: {
    letterSpacing: 0.6,
  },
  amountInputRow: {
    marginTop: 2,
  },
  amountContainer: {
    marginBottom: 0,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  presetPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  allocationVisualizer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  allocTrack: {
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: 6,
  },
  allocFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  allocStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionWrapper: {
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    paddingHorizontal: 2,
  },
  sectionLabel: {
    letterSpacing: 0.5,
  },
  categoryCard: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    overflow: 'hidden',
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  catIconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  catNameGroup: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  catInputWrapper: {
    alignItems: 'flex-end',
  },
  divider: {
    height: 1,
    marginLeft: 66,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.sm,
  },
});
