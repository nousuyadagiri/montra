import React, { useState, useCallback } from 'react';
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
  Card,
  Badge,
  Button,
  Input,
  Header,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../../components/ui';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { formatCurrency, parseCurrencyInput, CURRENCY_SYMBOLS } from '../../utils/currency';
import {
  Trash2,
  Pencil,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react-native';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
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
  const activeCurrency: SupportedCurrency = ((isDemo ? demoProfile?.currency : profile?.currency) as SupportedCurrency) || 'INR';
  const currencySymbol = CURRENCY_SYMBOLS[activeCurrency] || '₹';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Goal Details"
        showBack
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/goals/add', params: { editId: goal.id } })}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Edit goal"
            >
              <Pencil size={19} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteGoal}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Delete goal"
            >
              <Trash2 size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Goal Overview Card */}
        <Card elevated style={styles.goalCard}>
          <View style={styles.goalTitleRow}>
            <View>
              <Heading level={2}>{goal.name}</Heading>
              <Text variant="xs" color="secondary" style={{ marginTop: 2 }}>
                {goal.category} {goal.target_date ? `• Target: ${goal.target_date}` : ''}
              </Text>
            </View>
            <Badge
              label={isDone ? 'Goal Achieved!' : `${progressPct}%`}
              variant={isDone ? 'success' : 'primary'}
            />
          </View>

          <View style={styles.amountsRow}>
            <View>
              <Text variant="xs" color="secondary">
                Saved so far
              </Text>
              <CurrencyText
                amount={current}
                currency={activeCurrency}
                variant="2xl"
                weight="bold"
                style={{ color: colors.primary }}
              />
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="xs" color="secondary">
                Target
              </Text>
              <CurrencyText
                amount={target}
                currency={activeCurrency}
                variant="xl"
                weight="bold"
              />
            </View>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: colors.elevatedSurface }]}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progressPct}%`,
                  backgroundColor: isDone ? colors.success : colors.primary,
                },
              ]}
            />
          </View>
        </Card>

        {/* Action Button: Deposit / Withdraw */}
        <View style={styles.actionRow}>
          <Button
            title={showAddForm ? 'Cancel Contribution' : '+ Add Contribution'}
            variant={showAddForm ? 'outline' : 'primary'}
            onPress={() => setShowAddForm(!showAddForm)}
          />
        </View>

        {/* Contribution Form */}
        {showAddForm ? (
          <Card elevated style={styles.formCard}>
            <Text variant="base" weight="bold" style={{ marginBottom: Spacing.sm }}>
              Record Contribution
            </Text>

            <View style={styles.typeToggle}>
              {(['deposit', 'withdrawal'] as const).map((t) => {
                const isSelected = contribType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setContribType(t)}
                    style={[
                      styles.typePill,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                      },
                    ]}
                  >
                    <Text
                      variant="xs"
                      weight={isSelected ? 'bold' : 'medium'}
                      style={{
                        color: isSelected ? colors.onPrimary : colors.mainText,
                        textTransform: 'capitalize',
                      }}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
              placeholder="e.g. Monthly bonus saved"
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
          </Card>
        ) : null}

        {/* Contribution History */}
        <Text variant="base" weight="bold" style={styles.historyTitle}>
          Contribution History
        </Text>

        {contributions.length === 0 ? (
          <EmptyState
            title="No Contributions"
            description="You haven't recorded any deposits or withdrawals for this goal yet."
          />
        ) : (
          contributions.map((c) => {
            const isDeposit = c.type === 'deposit';
            return (
              <Card key={c.id} style={styles.historyCard}>
                <View style={styles.historyRow}>
                  <View
                    style={[
                      styles.iconDot,
                      {
                        backgroundColor: isDeposit ? colors.successMuted : colors.errorMuted,
                      },
                    ]}
                  >
                    {isDeposit ? (
                      <ArrowDownLeft size={16} color={colors.success} />
                    ) : (
                      <ArrowUpRight size={16} color={colors.error} />
                    )}
                  </View>

                  <View style={styles.historyDetails}>
                    <Text variant="sm" weight="semibold">
                      {isDeposit ? 'Deposit' : 'Withdrawal'}
                    </Text>
                    <Text variant="xs" color="secondary">
                      {c.date} {c.notes ? `• ${c.notes}` : ''}
                    </Text>
                  </View>

                  <CurrencyText
                    amount={c.amount}
                    currency={profile?.currency || 'INR'}
                    variant="sm"
                    weight="bold"
                    style={{ color: isDeposit ? colors.success : colors.error }}
                  />
                </View>
              </Card>
            );
          })
        )}
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
  goalCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  goalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  actionRow: {
    marginBottom: Spacing.lg,
  },
  formCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  typeToggle: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: {
    marginBottom: Spacing.sm,
  },
  historyCard: {
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  historyDetails: {
    flex: 1,
    gap: 2,
  },
});

