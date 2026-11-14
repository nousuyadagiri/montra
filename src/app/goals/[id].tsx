import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import { savingsService } from '../../services/savingsService';
import { SavingsGoal, SavingsContribution, SupportedCurrency } from '../../types/database';
import {
  Text,
  Heading,
  CurrencyText,
  Button,
  Input,
  Header,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../../components/ui';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';
import { Spacing, BorderRadius, Shadows } from '../../theme/tokens';
import { formatCurrency, parseCurrencyInput, CURRENCY_SYMBOLS } from '../../utils/currency';
import {
  Trash2,
  Pencil,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Plane,
  Laptop,
  Car,
  Home,
  PiggyBank,
  Target,
  Calendar,
  Sparkles,
  Plus,
} from 'lucide-react-native';

const getGoalCategoryMeta = (category?: string | null) => {
  const norm = (category || '').toLowerCase();
  if (norm.includes('emergency')) {
    return { icon: ShieldCheck, color: '#10B981', label: category || 'Emergency Fund' };
  }
  if (norm.includes('travel') || norm.includes('vacation') || norm.includes('trip')) {
    return { icon: Plane, color: '#0EA5E9', label: category || 'Travel & Vacation' };
  }
  if (
    norm.includes('gadget') ||
    norm.includes('macbook') ||
    norm.includes('laptop') ||
    norm.includes('phone') ||
    norm.includes('tech')
  ) {
    return { icon: Laptop, color: '#8B5CF6', label: category || 'Gadget & Tech' };
  }
  if (norm.includes('vehicle') || norm.includes('car') || norm.includes('bike')) {
    return { icon: Car, color: '#F59E0B', label: category || 'Vehicle' };
  }
  if (
    norm.includes('home') ||
    norm.includes('property') ||
    norm.includes('house') ||
    norm.includes('rent')
  ) {
    return { icon: Home, color: '#EC4899', label: category || 'Home & Property' };
  }
  if (norm.includes('retire') || norm.includes('invest') || norm.includes('pension')) {
    return { icon: PiggyBank, color: '#14B8A6', label: category || 'Retirement' };
  }
  return { icon: Target, color: '#6366F1', label: category || 'Savings Goal' };
};

const formatGoalDate = (dateStr?: string | null) => {
  if (!dateStr) return null;
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const getDaysRemaining = (targetDateStr?: string | null) => {
  if (!targetDateStr) return null;
  try {
    const parts = targetDateStr.split('-');
    let targetTime = 0;
    if (parts.length === 3) {
      targetTime = new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10)
      ).getTime();
    } else {
      targetTime = new Date(targetDateStr).getTime();
    }
    if (isNaN(targetTime)) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDays = Math.ceil((targetTime - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Passed deadline';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return '1 day remaining';
    return `${diffDays} days remaining`;
  } catch {
    return null;
  }
};

const PRESET_CONTRIBUTIONS = [1000, 2000, 5000, 10000];

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const demoGoals = useDemoStore((s) => s.demoGoals);
  const demoGoalContributions = useDemoStore((s) => s.demoGoalContributions);
  const demoProfile = useDemoStore((s) => s.demoProfile);
  const addDemoContribution = useDemoStore((s) => s.addDemoContribution);
  const deleteDemoGoal = useDemoStore((s) => s.deleteDemoGoal);

  const isDemo = !user || (id?.startsWith('demo-') ?? false);

  const [goal, setGoal] = useState<SavingsGoal | null>(null);
  const [contributions, setContributions] = useState<SavingsContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Contribution Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [contribType, setContribType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [contribAmountStr, setContribAmountStr] = useState('');
  const [contribNotes, setContribNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGoalData = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setLoadError('Goal ID is missing.');
      return;
    }
    setLoadError(null);
    if (isDemo) {
      const found = demoGoals.find((g) => g.id === id) || null;
      setGoal(found);
      setContributions(demoGoalContributions[id] || []);
      if (!found) setLoadError('This demo savings goal could not be found.');
      setLoading(false);
      return;
    }

    try {
      const data = await savingsService.getGoalById(id);
      if (data) {
        setGoal(data.goal);
        setContributions(data.contributions);
      } else {
        setLoadError('Savings goal not found.');
      }
    } catch (err: unknown) {
      setLoadError(getErrorMessage(err, 'Failed to load savings goal.'));
    } finally {
      setLoading(false);
    }
  }, [id, isDemo, demoGoals, demoGoalContributions]);

  useFocusEffect(
    useCallback(() => {
      fetchGoalData();
    }, [fetchGoalData])
  );

  const handleAddContribution = async () => {
    if (!goal) return;
    const amount = parseCurrencyInput(contribAmountStr);

    if (amount <= 0) {
      toast.warning('Please enter an amount greater than zero.', 'Invalid Amount');
      return;
    }
    if (contribType === 'withdrawal' && amount > Number(goal.current_amount)) {
      toast.warning('Withdrawal amount exceeds the current saved amount.', 'Insufficient Balance');
      return;
    }

    try {
      setSubmitting(true);
      if (isDemo) {
        addDemoContribution(goal.id, amount, contribType, contribNotes.trim() || undefined);
      } else if (user) {
        await savingsService.addContribution(
          goal.id,
          user.id,
          amount,
          contribType,
          contribNotes.trim() || undefined
        );
      }

      setContribAmountStr('');
      setContribNotes('');
      setShowAddForm(false);
      toast.success(
        contribType === 'deposit' ? 'Contribution added to your goal!' : 'Withdrawal recorded.'
      );
      await fetchGoalData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to record contribution.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePresetSelect = (preset: number) => {
    const currentVal = parseCurrencyInput(contribAmountStr);
    const newVal = currentVal > 0 ? currentVal + preset : preset;
    setContribAmountStr(String(newVal));
  };

  const handleDeleteGoal = () => {
    if (!goal) return;
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isDemo) {
                deleteDemoGoal(goal.id);
              } else {
                await savingsService.deleteGoal(goal.id);
              }
              toast.success(`Goal "${goal.name}" deleted.`);
              router.back();
            } catch (err: unknown) {
              toast.error(getErrorMessage(err, 'Failed to delete goal.'));
            }
          },
        },
      ]
    );
  };

  const categoryMeta = useMemo(() => getGoalCategoryMeta(goal?.category), [goal?.category]);
  const CategoryIcon = categoryMeta.icon;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Goal Details" showBack />
        <LoadingState message="Fetching goal details..." />
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Goal Details" showBack />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ErrorState
            title="Goal Unavailable"
            message={loadError || 'This savings goal could not be loaded.'}
            onRetry={() => {
              setLoading(true);
              fetchGoalData();
            }}
          />
        </View>
      </View>
    );
  }

  const target = Number(goal.target_amount);
  const current = Number(goal.current_amount);
  const progressPct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const isDone = goal.is_completed || current >= target;
  const remainingNeeded = Math.max(0, target - current);
  const formattedDate = formatGoalDate(goal.target_date);
  const daysRemainingText = getDaysRemaining(goal.target_date);

  const activeCurrency: SupportedCurrency =
    ((isDemo ? demoProfile?.currency : profile?.currency) as SupportedCurrency) || 'INR';
  const currencySymbol = CURRENCY_SYMBOLS[activeCurrency] || '₹';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Goal Details"
        showBack
        rightAction={
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/goals/add', params: { editId: goal.id } })}
              style={[
                styles.headerActionBtn,
                { backgroundColor: colors.primaryMuted },
              ]}
              accessibilityLabel="Edit goal"
            >
              <Pencil size={15} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteGoal}
              style={[
                styles.headerActionBtn,
                { backgroundColor: colors.errorMuted },
              ]}
              accessibilityLabel="Delete goal"
            >
              <Trash2 size={15} color={colors.error} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO GOAL CARD */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? colors.border : colors.borderLight,
            },
            !isDark ? Shadows.sm : undefined,
          ]}
        >
          {/* Top meta row */}
          <View style={styles.heroTopRow}>
            <View style={styles.categoryInfoGroup}>
              <View
                style={[
                  styles.categorySquircle,
                  { backgroundColor: `${categoryMeta.color}18` },
                ]}
              >
                <CategoryIcon size={20} color={categoryMeta.color} strokeWidth={2.2} />
              </View>
              <View>
                <Text variant="xs" color="secondary" weight="semibold">
                  {categoryMeta.label}
                </Text>
                {formattedDate ? (
                  <View style={styles.dateMetaRow}>
                    <Calendar size={11} color={colors.secondaryText} />
                    <Text variant="xs" color="secondary" style={{ fontSize: 11, marginLeft: 3 }}>
                      {formattedDate}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isDone ? colors.successMuted : colors.primaryMuted,
                  borderColor: isDone ? colors.positive : colors.primary,
                },
              ]}
            >
              {isDone ? (
                <Sparkles size={12} color={colors.positive} style={{ marginRight: 3 }} />
              ) : null}
              <Text
                variant="xs"
                weight="bold"
                style={{
                  color: isDone ? colors.positive : colors.primary,
                  fontSize: 11,
                }}
              >
                {isDone ? 'Goal Achieved!' : `${progressPct}% Saved`}
              </Text>
            </View>
          </View>

          {/* Goal title */}
          <Heading level={2} style={styles.goalTitle}>
            {goal.name}
          </Heading>

          {/* Saved amount hero */}
          <View style={styles.savedAmountBlock}>
            <Text variant="xs" color="secondary" weight="bold" style={styles.savedAmountLabel}>
              CURRENT SAVINGS
            </Text>
            <Text variant="3xl" weight="extrabold" style={styles.savedAmountValue}>
              {formatCurrency(current, activeCurrency)}
            </Text>
          </View>

          {/* Progress bar */}
          <View style={[styles.progressTrack, { backgroundColor: isDark ? colors.elevatedSurface : colors.background }]}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progressPct}%`,
                  backgroundColor: isDone ? colors.positive : categoryMeta.color,
                },
              ]}
            />
          </View>

          {/* 3 Metric chips */}
          <View style={styles.metricsRow}>
            <View
              style={[
                styles.metricTile,
                { backgroundColor: isDark ? colors.elevatedSurface : colors.background, borderColor: colors.borderLight },
              ]}
            >
              <Text variant="xs" color="secondary">Target Goal</Text>
              <Text variant="sm" weight="bold" color="main" style={{ marginTop: 2 }}>
                {formatCurrency(target, activeCurrency)}
              </Text>
            </View>

            <View
              style={[
                styles.metricTile,
                { backgroundColor: isDark ? colors.elevatedSurface : colors.background, borderColor: colors.borderLight },
              ]}
            >
              <Text variant="xs" color="secondary">Remaining</Text>
              <Text
                variant="sm"
                weight="bold"
                style={{
                  marginTop: 2,
                  color: remainingNeeded === 0 ? colors.positive : colors.mainText,
                }}
              >
                {remainingNeeded === 0 ? 'Fully Funded' : formatCurrency(remainingNeeded, activeCurrency)}
              </Text>
            </View>

            <View
              style={[
                styles.metricTile,
                { backgroundColor: isDark ? colors.elevatedSurface : colors.background, borderColor: colors.borderLight },
              ]}
            >
              <Text variant="xs" color="secondary">Timeline</Text>
              <Text variant="sm" weight="bold" color="main" numberOfLines={1} style={{ marginTop: 2, fontSize: 12 }}>
                {daysRemainingText || 'No deadline'}
              </Text>
            </View>
          </View>
        </View>

        {/* CONTRIBUTION ACTION BUTTON */}
        <View style={styles.actionRow}>
          <Button
            title={showAddForm ? 'Cancel Contribution' : '+ Add Contribution'}
            variant={showAddForm ? 'outline' : 'primary'}
            onPress={() => setShowAddForm(!showAddForm)}
            size="lg"
          />
        </View>

        {/* CONTRIBUTION FORM */}
        {showAddForm ? (
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
              !isDark ? Shadows.sm : undefined,
            ]}
          >
            <Text variant="base" weight="bold" style={{ marginBottom: Spacing.sm }}>
              Record Contribution
            </Text>

            {/* Type selector */}
            <View
              style={[
                styles.typeToggle,
                { backgroundColor: colors.elevatedSurface, borderColor: colors.borderLight },
              ]}
            >
              {(['deposit', 'withdrawal'] as const).map((t) => {
                const isSelected = contribType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setContribType(t)}
                    style={[
                      styles.typePill,
                      isSelected && {
                        backgroundColor: colors.surface,
                        borderColor: colors.borderLight,
                        borderWidth: 1,
                      },
                      isSelected && !isDark ? Shadows.sm : undefined,
                    ]}
                  >
                    <Text
                      variant="xs"
                      weight={isSelected ? 'bold' : 'medium'}
                      style={{
                        color: isSelected ? colors.primary : colors.secondaryText,
                        textTransform: 'capitalize',
                      }}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Preset Amount Chips */}
            <View style={styles.presetsRow}>
              {PRESET_CONTRIBUTIONS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: isDark ? colors.elevatedSurface : colors.background,
                      borderColor: colors.borderLight,
                    },
                  ]}
                  onPress={() => handlePresetSelect(preset)}
                  activeOpacity={0.7}
                >
                  <Plus size={10} color={colors.secondaryText} />
                  <Text variant="xs" weight="bold" color="secondary">
                    {currencySymbol}{preset >= 1000 ? `${preset / 1000}k` : preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Amount"
              placeholder="0.00"
              prefix={currencySymbol}
              keyboardType="decimal-pad"
              value={contribAmountStr}
              onChangeText={setContribAmountStr}
            />

            <Input
              label="Notes (Optional)"
              placeholder="e.g. Monthly salary savings"
              value={contribNotes}
              onChangeText={setContribNotes}
            />

            <Button
              title={`Confirm ${contribType === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
              variant="primary"
              loading={submitting}
              onPress={handleAddContribution}
              buttonStyle={{ marginTop: Spacing.sm }}
            />
          </View>
        ) : null}

        {/* CONTRIBUTION HISTORY */}
        <View style={styles.historyHeader}>
          <Text variant="base" weight="bold">
            Contribution History
          </Text>
          <Text variant="xs" color="secondary">
            {contributions.length} {contributions.length === 1 ? 'record' : 'records'}
          </Text>
        </View>

        {contributions.length === 0 ? (
          <EmptyState
            title="No Contributions Yet"
            description="You haven't recorded any deposits or withdrawals for this goal yet."
          />
        ) : (
          contributions.map((c) => {
            const isDeposit = c.type === 'deposit';
            const formattedItemDate = formatGoalDate(c.date) || c.date;

            return (
              <View
                key={c.id}
                style={[
                  styles.historyCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderLight,
                  },
                  !isDark ? Shadows.sm : undefined,
                ]}
              >
                <View style={styles.historyRow}>
                  <View
                    style={[
                      styles.iconDot,
                      {
                        backgroundColor: isDeposit ? colors.successMuted : colors.expenseMuted,
                      },
                    ]}
                  >
                    {isDeposit ? (
                      <ArrowDownLeft size={16} color={colors.positive} />
                    ) : (
                      <ArrowUpRight size={16} color={colors.negative} />
                    )}
                  </View>

                  <View style={styles.historyDetails}>
                    <Text variant="sm" weight="bold">
                      {isDeposit ? 'Deposit' : 'Withdrawal'}
                    </Text>
                    <Text variant="xs" color="secondary" style={{ marginTop: 1 }}>
                      {formattedItemDate} {c.notes ? `• ${c.notes}` : ''}
                    </Text>
                  </View>

                  <CurrencyText
                    amount={c.amount}
                    currency={activeCurrency}
                    variant="sm"
                    weight="bold"
                    style={{ color: isDeposit ? colors.positive : colors.negative }}
                  />
                </View>
              </View>
            );
          })
        )}

        {/* DELETE GOAL BUTTON AT BOTTOM */}
        <TouchableOpacity
          style={[styles.bottomDeleteBtn, { borderColor: colors.errorMuted }]}
          onPress={handleDeleteGoal}
          activeOpacity={0.7}
        >
          <Trash2 size={16} color={colors.error} />
          <Text variant="sm" weight="bold" style={{ color: colors.error, marginLeft: 6 }}>
            Delete Goal
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categorySquircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  goalTitle: {
    fontSize: 22,
    marginBottom: Spacing.sm,
    letterSpacing: -0.4,
  },
  savedAmountBlock: {
    marginBottom: Spacing.md,
  },
  savedAmountLabel: {
    letterSpacing: 0.6,
    fontSize: 11,
    marginBottom: 2,
  },
  savedAmountValue: {
    letterSpacing: -0.5,
  },
  progressTrack: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    width: '100%',
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  metricTile: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionRow: {
    marginBottom: Spacing.lg,
  },
  formCard: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  typeToggle: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 3,
    marginBottom: Spacing.md,
  },
  typePill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  presetChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  historyCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconDot: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  historyDetails: {
    flex: 1,
  },
  bottomDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginTop: Spacing.xl,
  },
});
