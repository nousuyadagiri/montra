import React, { useState, useEffect } from 'react';
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
import { Text, Input, Button, Header, Card, LoadingState } from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { CURRENCY_SYMBOLS, parseCurrencyInput } from '../../utils/currency';
import { deduplicateCategories } from '../../utils/categories';
import { Check } from 'lucide-react-native';

export default function AddBudgetScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditing = Boolean(editId);
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const demoCategories = useDemoStore((s) => s.demoCategories);
  const demoBudgets = useDemoStore((s) => s.demoBudgets);
  const demoProfile = useDemoStore((s) => s.demoProfile);
  const createDemoBudget = useDemoStore((s) => s.createDemoBudget);
  const updateDemoBudget = useDemoStore((s) => s.updateDemoBudget);

  const isDemo = !user;

  const [name, setName] = useState('Monthly Budget');
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

  const activeCurrency: SupportedCurrency = ((isDemo ? demoProfile?.currency : profile?.currency) as SupportedCurrency) || 'INR';
  const currencySymbol = CURRENCY_SYMBOLS[activeCurrency] || '₹';

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
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Input
          label="Budget Name"
          placeholder="e.g. November 2026 Budget"
          value={name}
          onChangeText={setName}
        />

        <Card elevated style={styles.amountCard}>
          <Text variant="xs" color="secondary" weight="semibold">
            TOTAL MONTHLY LIMIT
          </Text>
          <View style={styles.amountInputRow}>
            <Text variant="3xl" weight="bold" color="primary">
              {currencySymbol}
            </Text>
            <Input
              placeholder="50000"
              keyboardType="decimal-pad"
              value={totalLimitStr}
              onChangeText={setTotalLimitStr}
              inputStyle={styles.bigAmountInput}
              containerStyle={styles.amountContainer}
            />
          </View>
        </Card>

        {/* Category-Specific Limits */}
        {categories.length > 0 ? (
          <View style={styles.categorySection}>
            <Text variant="sm" weight="semibold" color="secondary" style={styles.sectionLabel}>
              CATEGORY BUDGET CAPS (OPTIONAL)
            </Text>
            <Card elevated style={styles.catCard}>
              {categories.map((c) => (
                <View key={c.id} style={styles.catRow}>
                  <View style={styles.catNameGroup}>
                    <View
                      style={[styles.catColorCircle, { backgroundColor: c.color || colors.primary }]}
                    />
                    <Text variant="sm" weight="medium" style={styles.catName}>
                      {c.name}
                    </Text>
                  </View>
                  <View style={styles.catInputWrapper}>
                    <Input
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      prefix={currencySymbol}
                      value={categoryAllocations[c.id] || ''}
                      onChangeText={(val) => handleAllocationChange(c.id, val)}
                      containerStyle={{ marginBottom: 0, width: 140 }}
                      inputStyle={{ fontSize: 13, paddingVertical: 4 }}
                    />
                  </View>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        <Button
          title="Save Budget"
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleSave}
          leftIcon={<Check size={20} color={colors.onPrimary} />}
          buttonStyle={{ marginTop: Spacing.xl }}
        />
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
  amountCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  amountContainer: {
    marginBottom: 0,
    width: 220,
  },
  bigAmountInput: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    marginBottom: Spacing.xs,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  catCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  catColorCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  catName: {
    flex: 1,
  },
  catInputWrapper: {
    width: 140,
  },
});

