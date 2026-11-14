import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';
import { savingsService } from '../../services/savingsService';
import { SupportedCurrency } from '../../types/database';
import { Text, Input, Button, Header, Card, LoadingState, DatePickerField } from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { CURRENCY_SYMBOLS, parseCurrencyInput } from '../../utils/currency';
import { Calendar, Check } from 'lucide-react-native';

const GOAL_CATEGORIES = [
  'Emergency Fund',
  'Travel & Vacation',
  'Home & Property',
  'Vehicle',
  'Gadget',
  'Retirement',
  'General',
];

export default function AddGoalScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditing = Boolean(editId);
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const demoGoals = useDemoStore((s) => s.demoGoals);
  const demoProfile = useDemoStore((s) => s.demoProfile);
  const createDemoGoal = useDemoStore((s) => s.createDemoGoal);
  const updateDemoGoal = useDemoStore((s) => s.updateDemoGoal);

  const isDemo = !user || (editId?.startsWith('demo-') ?? false);

  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [currentAmountStr, setCurrentAmountStr] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Emergency Fund');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(Boolean(editId && !isDemo));

  useEffect(() => {
    if (!editId) {
      setInitialLoading(false);
      return;
    }
    if (isDemo) {
      const existing = demoGoals.find((g) => g.id === editId);
      if (existing) {
        setName(existing.name);
        setTargetAmountStr(String(existing.target_amount));
        setCurrentAmountStr(String(existing.current_amount));
        setTargetDate(existing.target_date || '');
        setCategory(existing.category || 'Emergency Fund');
      }
      setInitialLoading(false);
      return;
    }

    setInitialLoading(true);
    savingsService
      .getGoalById(editId)
      .then((res) => {
        if (!res?.goal) return;
        setName(res.goal.name);
        setTargetAmountStr(String(res.goal.target_amount));
        setCurrentAmountStr(String(res.goal.current_amount));
        setTargetDate(res.goal.target_date || '');
        setCategory(res.goal.category || 'Emergency Fund');
      })
      .catch((err) => toast.error(getErrorMessage(err, 'Failed to load goal details.')))
      .finally(() => setInitialLoading(false));
  }, [editId, isDemo, demoGoals]);

  const handleSave = async () => {
    const targetAmount = parseCurrencyInput(targetAmountStr);
    const currentAmount = parseCurrencyInput(currentAmountStr);

    if (!name.trim()) {
      toast.warning('Please enter a name for your financial goal.', 'Goal Name Required');
      return;
    }
    if (targetAmount <= 0) {
      toast.warning('Please enter a target amount greater than zero.', 'Invalid Target');
      return;
    }

    try {
      setLoading(true);
      if (isDemo) {
        if (editId) {
          updateDemoGoal(editId, {
            name: name.trim(),
            targetAmount,
            currentAmount,
            targetDate: targetDate.trim() || null,
            category,
          });
        } else {
          createDemoGoal({
            name: name.trim(),
            targetAmount,
            currentAmount,
            targetDate: targetDate.trim() || undefined,
            category,
          });
        }
      } else if (user) {
        if (editId) {
          await savingsService.updateGoal(editId, {
            name: name.trim(),
            targetAmount,
            currentAmount,
            targetDate: targetDate.trim() || null,
            category,
          });
        } else {
          await savingsService.createGoal(user.id, {
            name: name.trim(),
            targetAmount,
            currentAmount,
            targetDate: targetDate.trim() || undefined,
            category,
          });
        }
      }

      toast.success(editId ? 'Savings goal updated.' : `Goal "${name.trim()}" created!`);
      router.back();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to save savings goal.'));
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
      <Header title={isEditing ? 'Edit Savings Goal' : 'New Savings Goal'} showBack />
      {initialLoading ? (
        <LoadingState message="Loading goal details..." />
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
          label="Goal Name"
          placeholder="e.g. 6-Month Emergency Fund"
          value={name}
          onChangeText={setName}
        />

        <Card elevated style={styles.amountCard}>
          <Text variant="xs" color="secondary" weight="semibold">
            TARGET AMOUNT
          </Text>
          <View style={styles.amountInputRow}>
            <Text variant="3xl" weight="bold" color="secondary">
              {currencySymbol}
            </Text>
            <Input
              placeholder="100000"
              keyboardType="decimal-pad"
              value={targetAmountStr}
              onChangeText={setTargetAmountStr}
              inputStyle={styles.bigAmountInput}
              containerStyle={styles.amountContainer}
            />
          </View>
        </Card>

        <Input
          label="Already Saved (Optional)"
          placeholder="0.00"
          prefix={currencySymbol}
          keyboardType="decimal-pad"
          value={currentAmountStr}
          onChangeText={setCurrentAmountStr}
        />

        <DatePickerField
          label="Target Date"
          value={targetDate}
          onChange={setTargetDate}
        />

        {/* Category Selector */}
        <View style={styles.categorySection}>
          <Text variant="sm" weight="medium" color="secondary" style={styles.sectionLabel}>
            Goal Category
          </Text>
          <View style={styles.pillsRow}>
            {GOAL_CATEGORIES.map((c) => {
              const isSelected = category === c;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    variant="xs"
                    weight={isSelected ? 'bold' : 'regular'}
                    style={{ color: isSelected ? colors.primary : colors.mainText }}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Button
          title={isEditing ? 'Update Goal' : 'Create Goal'}
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
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
});

