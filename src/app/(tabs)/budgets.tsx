import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { budgetService, BudgetWithSpending } from '../../services/budgetService';
import { savingsService } from '../../services/savingsService';
import { SavingsGoal } from '../../types/database';
import {
  Text,
  Heading,
  CurrencyText,
  Button,
  Card,
  Badge,
  LoadingState,
  EmptyState,
} from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import {
  PieChart,
  Plus,
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react-native';

export default function BudgetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [bData, gData] = await Promise.all([
        budgetService.getBudgets(user.id),
        savingsService.getGoals(user.id),
      ]);
      setBudgets(bData);
      setGoals(gData);
    } catch (err) {
      console.warn('Failed to fetch budgets/goals:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState message="Tracking your budgets and financial goals..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: insets.bottom + Spacing['3xl'],
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Heading level={1}>Budgets & Goals</Heading>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/budgets/add')}
            >
              <Plus size={18} color="#0B0F14" />
              <Text variant="xs" weight="bold" style={{ color: '#0B0F14', marginLeft: 4 }}>
                Budget
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => router.push('/goals/add')}
            >
              <Target size={18} color={colors.primary} />
              <Text variant="xs" weight="bold" color="primary" style={{ marginLeft: 4 }}>
                Goal
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 1: Active Monthly Budgets */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconRow}>
            <PieChart size={20} color={colors.primary} />
            <Text variant="md" weight="bold">
              Monthly Budgets
            </Text>
          </View>
          <Text variant="xs" color="secondary">
            {budgets.length} Active
          </Text>
        </View>

        {budgets.length === 0 ? (
          <Card elevated style={styles.emptyCard}>
            <EmptyState
              icon={<PieChart size={40} color={colors.primary} />}
              title="No Budgets Created"
              description="Establish monthly spending caps to avoid overspending and grow your net worth."
              actionTitle="Create Monthly Budget"
              onAction={() => router.push('/budgets/add')}
            />
          </Card>
        ) : (
          budgets.map((b) => {
            const isExceeded = b.totalSpent > b.total_limit;
            const isApproaching = !isExceeded && b.spentPercentage >= 80;
            const barWidth = Math.min(100, Math.max(3, b.spentPercentage));

            return (
              <Card key={b.id} elevated style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <View>
                    <Text variant="base" weight="bold">
                      {b.name}
                    </Text>
                    <Text variant="xs" color="secondary">
                      {b.period.toUpperCase()} • {b.month ? `Month ${b.month}` : ''} {b.year}
                    </Text>
                  </View>

                  <Badge
                    label={isExceeded ? 'Exceeded' : isApproaching ? 'Warning' : 'On Track'}
                    variant={isExceeded ? 'error' : isApproaching ? 'warning' : 'success'}
                    size="sm"
                  />
                </View>

                {/* Main Progress Bar */}
                <View style={styles.progressSection}>
                  <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${barWidth}%`,
                          backgroundColor: isExceeded
                            ? colors.error
                            : isApproaching
                            ? colors.warning
                            : colors.primary,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.budgetNumbersRow}>
                    <Text variant="xs" color="secondary">
                      Spent:{' '}
                      <Text variant="xs" weight="bold" color="main">
                        {formatCurrency(b.totalSpent, profile?.currency)}
                      </Text>
                    </Text>
                    <Text variant="xs" color="secondary">
                      Limit:{' '}
                      <Text variant="xs" weight="bold" color="main">
                        {formatCurrency(b.total_limit, profile?.currency)}
                      </Text>
                    </Text>
                  </View>
                </View>

                {/* Category Allocations within Budget */}
                {b.categoriesWithSpending && b.categoriesWithSpending.length > 0 ? (
                  <View style={styles.categorySublist}>
                    <Text variant="xs" color="secondary" weight="semibold" style={styles.sublistTitle}>
                      CATEGORY ALLOCATIONS
                    </Text>
                    {b.categoriesWithSpending.map((catItem) => {
                      const cExceeded = (catItem.spentAmount || 0) > catItem.allocated_amount;
                      const cPct = catItem.spentPercentage || 0;
                      return (
                        <View key={catItem.id} style={styles.catSubRow}>
                          <View style={styles.catSubInfo}>
                            <Text variant="sm" weight="medium">
                              {catItem.category?.name || 'Category'}
                            </Text>
                            <Text variant="xs" color="secondary">
                              {formatCurrency(catItem.spentAmount || 0, profile?.currency)} /{' '}
                              {formatCurrency(catItem.allocated_amount, profile?.currency)}
                            </Text>
                          </View>
                          <Badge
                            label={`${cPct}%`}
                            variant={cExceeded ? 'error' : cPct >= 80 ? 'warning' : 'neutral'}
                            size="sm"
                          />
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </Card>
            );
          })
        )}

        {/* Section 2: Savings & Financial Goals */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <View style={styles.sectionIconRow}>
            <Target size={20} color={colors.secondary} />
            <Text variant="md" weight="bold">
              Savings Goals
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/goals/add')}>
            <Text variant="xs" color="secondary">
              + New Goal
            </Text>
          </TouchableOpacity>
        </View>

        {goals.length === 0 ? (
          <Card elevated style={styles.emptyCard}>
            <EmptyState
              icon={<Target size={40} color={colors.secondary} />}
              title="No Goals Yet"
              description="Define savings targets for emergency funds, vacations, or investments."
              actionTitle="Set a Savings Goal"
              onAction={() => router.push('/goals/add')}
            />
          </Card>
        ) : (
          goals.map((g) => {
            const target = Number(g.target_amount);
            const current = Number(g.current_amount);
            const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
            const isDone = g.is_completed || current >= target;

            return (
              <TouchableOpacity
                key={g.id}
                activeOpacity={0.7}
                onPress={() => router.push(`/goals/${g.id}`)}
              >
                <Card elevated style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      <Text variant="base" weight="bold">
                        {g.name}
                      </Text>
                      <Text variant="xs" color="secondary">
                        {g.category} {g.target_date ? `• Target: ${g.target_date}` : ''}
                      </Text>
                    </View>
                    <Badge
                      label={isDone ? 'Completed' : `${pct}%`}
                      variant={isDone ? 'success' : 'primary'}
                      size="sm"
                    />
                  </View>

                  <View style={styles.progressSection}>
                    <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${pct}%`,
                            backgroundColor: isDone ? colors.success : colors.secondary,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.budgetNumbersRow}>
                      <Text variant="xs" color="secondary">
                        Saved:{' '}
                        <Text variant="xs" weight="bold" color="main">
                          {formatCurrency(current, profile?.currency)}
                        </Text>
                      </Text>
                      <Text variant="xs" color="secondary">
                        Target:{' '}
                        <Text variant="xs" weight="bold" color="main">
                          {formatCurrency(target, profile?.currency)}
                        </Text>
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  budgetCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  progressSection: {
    gap: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  budgetNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categorySublist: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: Spacing.sm,
  },
  sublistTitle: {
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  catSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catSubInfo: {
    gap: 2,
  },
  goalCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  goalInfo: {
    flex: 1,
    gap: 2,
  },
});

