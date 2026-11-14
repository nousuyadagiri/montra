import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Alert,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PieChart, Plus, Target, Pencil, Trash2 } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import { useSyncStore } from '../../store/syncStore';
import { budgetService, BudgetWithSpending } from '../../services/budgetService';
import { savingsService } from '../../services/savingsService';
import { SavingsGoal, SupportedCurrency } from '../../types/database';
import {
  Text,
  Heading,
  BudgetProgressCard,
  SavingsGoalCard,
  DemoDataBadge,
  EmptyState,
  ErrorState,
  ListSkeleton,
  BudgetIllustration,
  SavingsGoalIllustration,
} from '../../components/ui';
import { Spacing, BorderRadius, Shadows } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';

export default function BudgetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const syncTick = useSyncStore((s) => s.syncTick);

  const demoBudgets = useDemoStore((s) => s.demoBudgets);
  const demoTransactions = useDemoStore((s) => s.demoTransactions);
  const demoGoals = useDemoStore((s) => s.demoGoals);
  const demoProfile = useDemoStore((s) => s.demoProfile);
  const getDemoBudgets = useDemoStore((s) => s.getDemoBudgets);
  const deleteDemoBudget = useDemoStore((s) => s.deleteDemoBudget);

  const [activeTab, setActiveTab] = useState<'budgets' | 'goals'>('budgets');
  const [realBudgets, setRealBudgets] = useState<BudgetWithSpending[]>([]);
  const [realGoals, setRealGoals] = useState<SavingsGoal[]>([]);
  const [initialLoading, setInitialLoading] = useState(Boolean(user));
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const isDemo = !user;

  const fetchData = useCallback(async () => {
    if (!user) {
      setInitialLoading(false);
      setRefreshing(false);
      setFetchError(null);
      return;
    }
    try {
      setFetchError(null);
      const [bData, gData] = await Promise.all([
        budgetService.getBudgets(user.id),
        savingsService.getGoals(user.id),
      ]);
      hasLoadedRef.current = true;
      setRealBudgets(bData);
      setRealGoals(gData);
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Unable to load budgets and savings goals.');
      setFetchError(msg);
      if (hasLoadedRef.current) {
        toast.error(msg, 'Load Failed');
      }
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  useEffect(() => {
    if (syncTick > 0) {
      fetchData();
    }
  }, [syncTick, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  void demoBudgets;
  void demoTransactions;
  const demoBudgetsComputed = getDemoBudgets();

  const activeBudgets = isDemo ? demoBudgetsComputed : realBudgets;
  const activeGoals = isDemo ? demoGoals : realGoals;
  const activeProfile = isDemo ? demoProfile : profile;
  const currency: SupportedCurrency = (activeProfile?.currency as SupportedCurrency) || 'INR';

  // Budget calculations
  const totalBudgetLimit = useMemo(
    () => activeBudgets.reduce((sum, b) => sum + (b.total_limit || 0), 0),
    [activeBudgets]
  );

  const totalBudgetSpent = useMemo(
    () => activeBudgets.reduce((sum, b) => sum + (b.totalSpent || 0), 0),
    [activeBudgets]
  );

  const remainingBudget = totalBudgetLimit - totalBudgetSpent;
  const overallProgress = totalBudgetLimit > 0 ? totalBudgetSpent / totalBudgetLimit : 0;
  const overallPercentage = Math.round(overallProgress * 100);

  const handleDeleteBudget = (budgetId: string, budgetName: string) => {
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete "${budgetName}"? This will remove the budget and its category limits.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isDemo) {
                deleteDemoBudget(budgetId);
              } else {
                await budgetService.deleteBudget(budgetId);
                fetchData();
              }
              toast.success(`Budget "${budgetName}" deleted.`);
            } catch (err: unknown) {
              toast.error(getErrorMessage(err, 'Failed to delete budget.'));
            }
          },
        },
      ]
    );
  };

  const statusBarHeight = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 0;
  const topInset = Math.max(insets.top, statusBarHeight, Platform.OS === 'android' ? 28 : 16);
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 24 : 10);
  const tabHeight = 62 + bottomInset;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + (Platform.OS === 'android' ? 16 : 12),
            paddingBottom: tabHeight + Spacing.xl,
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
        {/* 1. TOP HEADER */}
        <View style={styles.topHeader}>
          <View style={styles.titleWithBadge}>
            <Heading level={2} style={styles.screenTitle}>Budgets & Goals</Heading>
            {isDemo ? <DemoDataBadge compact /> : null}
          </View>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push(activeTab === 'budgets' ? '/budgets/add' : '/goals/add')}
              accessibilityLabel={activeTab === 'budgets' ? 'Add Budget' : 'Add Goal'}
            >
              <Plus size={15} color={colors.onPrimary} strokeWidth={2.5} />
              <Text variant="xs" weight="bold" style={{ color: colors.onPrimary, marginLeft: 4 }}>
                {activeTab === 'budgets' ? 'New Budget' : 'New Goal'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. TAB SWITCHER */}
        <View
          style={[
            styles.tabSwitcher,
            { backgroundColor: colors.elevatedSurface, borderColor: colors.borderLight },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'budgets' && {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
                borderWidth: StyleSheet.hairlineWidth,
              },
            ]}
            onPress={() => setActiveTab('budgets')}
            activeOpacity={0.7}
          >
            <PieChart
              size={15}
              color={activeTab === 'budgets' ? colors.primary : colors.secondaryText}
            />
            <Text
              variant="xs"
              weight={activeTab === 'budgets' ? 'bold' : 'medium'}
              style={{
                color: activeTab === 'budgets' ? colors.mainText : colors.secondaryText,
              }}
            >
              Budgets
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'goals' && {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
                borderWidth: StyleSheet.hairlineWidth,
              },
            ]}
            onPress={() => setActiveTab('goals')}
            activeOpacity={0.7}
          >
            <Target
              size={15}
              color={activeTab === 'goals' ? colors.primary : colors.secondaryText}
            />
            <Text
              variant="xs"
              weight={activeTab === 'goals' ? 'bold' : 'medium'}
              style={{
                color: activeTab === 'goals' ? colors.mainText : colors.secondaryText,
              }}
            >
              Savings Goals
            </Text>
          </TouchableOpacity>
        </View>

        {/* =========================================
            TAB 1: BUDGETS
        ========================================= */}
        {activeTab === 'budgets' ? (
          <>
            {/* Total Monthly Budget Overview Card */}
            <View
              style={[
                styles.overviewCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDark ? colors.border : colors.borderLight,
                },
                !isDark ? Shadows.sm : undefined,
              ]}
            >
              <View style={styles.overviewTop}>
                <View>
                  <Text variant="xs" color="secondary" weight="bold" style={{ letterSpacing: 0.6 }}>
                    TOTAL MONTHLY BUDGET
                  </Text>
                  <Text variant="2xl" weight="extrabold" style={{ marginTop: 2, letterSpacing: -0.5 }}>
                    {formatCurrency(totalBudgetLimit, currency)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.percentageBadge,
                    {
                      backgroundColor:
                        totalBudgetLimit === 0
                          ? colors.elevatedSurface
                          : overallPercentage >= 100
                          ? colors.expenseMuted
                          : overallPercentage >= 80
                          ? colors.warningMuted
                          : colors.successMuted,
                    },
                  ]}
                >
                  <Text
                    variant="xs"
                    weight="extrabold"
                    style={{
                      color:
                        totalBudgetLimit === 0
                          ? colors.secondaryText
                          : overallPercentage >= 100
                          ? colors.negative
                          : overallPercentage >= 80
                          ? colors.warning
                          : colors.positive,
                      fontSize: 11,
                    }}
                  >
                    {totalBudgetLimit === 0 ? 'Not set' : `${overallPercentage}% spent`}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View
                style={[
                  styles.track,
                  {
                    backgroundColor: isDark ? colors.elevatedSurface : colors.background,
                  },
                ]}
              >
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.min(overallProgress * 100, 100)}%`,
                      backgroundColor:
                        totalBudgetLimit === 0
                          ? colors.borderLight
                          : overallPercentage >= 100
                          ? colors.negative
                          : overallPercentage >= 80
                          ? colors.warning
                          : colors.positive,
                    },
                  ]}
                />
              </View>

              <View style={styles.overviewBottom}>
                <Text variant="xs" color="secondary">
                  Spent:{' '}
                  <Text variant="xs" weight="bold" color="main">
                    {formatCurrency(totalBudgetSpent, currency)}
                  </Text>
                </Text>
                <Text variant="xs" color="secondary">
                  Remaining:{' '}
                  <Text
                    variant="xs"
                    weight="bold"
                    style={{
                      color: remainingBudget >= 0 ? colors.positive : colors.negative,
                    }}
                  >
                    {formatCurrency(remainingBudget, currency)}
                  </Text>
                </Text>
              </View>
            </View>

            {/* Category Budgets List */}
            <View style={styles.sectionTitleRow}>
              <Text variant="sm" weight="bold">
                Monthly Budgets
              </Text>
              <Text variant="xs" color="secondary">
                {activeBudgets.length} {activeBudgets.length === 1 ? 'Budget' : 'Budgets'}
              </Text>
            </View>

            {!isDemo && initialLoading ? (
              <ListSkeleton count={4} cardHeight={76} />
            ) : !isDemo && fetchError && activeBudgets.length === 0 ? (
              <ErrorState
                title="Could Not Load Budgets"
                message={fetchError}
                onRetry={() => {
                  setInitialLoading(true);
                  fetchData();
                }}
              />
            ) : activeBudgets.length === 0 ? (
              <EmptyState
                illustration={<BudgetIllustration size={160} />}
                title="No Budgets Yet"
                description="Set monthly spending limits for categories to keep your everyday expenses under control."
                actionTitle="Create Budget"
                actionIcon={<Plus size={16} color={colors.onPrimary} />}
                onAction={() => router.push('/budgets/add')}
              />
            ) : (
              activeBudgets.map((b) => {
                const pct = b.total_limit > 0 ? Math.round((b.totalSpent / b.total_limit) * 100) : 0;
                const ratio = b.total_limit > 0 ? Math.min(b.totalSpent / b.total_limit, 1) : 0;
                const barColor = pct >= 100 ? colors.negative : pct >= 80 ? colors.warning : colors.primary;

                return (
                  <View key={b.id} style={{ marginBottom: Spacing.md }}>
                    <View
                      style={[
                        styles.budgetGroupCard,
                        { backgroundColor: colors.surface, borderColor: colors.borderLight },
                      ]}
                    >
                      <View style={styles.budgetGroupHeader}>
                        <View style={{ flex: 1, paddingRight: Spacing.sm }}>
                          <Text variant="sm" weight="bold" numberOfLines={1}>
                            {b.name}
                          </Text>
                          <Text variant="xs" color="secondary" style={{ fontSize: 11, marginTop: 1 }}>
                            {formatCurrency(b.totalSpent, currency)} of {formatCurrency(b.total_limit, currency)} ({pct}%)
                          </Text>
                        </View>
                        <View style={styles.budgetGroupActions}>
                          <TouchableOpacity
                            onPress={() => router.push({ pathname: '/budgets/add', params: { editId: b.id } })}
                            style={[styles.miniIconBtn, { backgroundColor: colors.primaryMuted }]}
                            accessibilityLabel={`Edit ${b.name}`}
                          >
                            <Pencil size={13} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteBudget(b.id, b.name)}
                            style={[styles.miniIconBtn, { backgroundColor: colors.errorMuted }]}
                            accessibilityLabel={`Delete ${b.name}`}
                          >
                            <Trash2 size={13} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={[styles.miniTrack, { backgroundColor: colors.elevatedSurface }]}>
                        <View
                          style={[
                            styles.miniFill,
                            { width: `${ratio * 100}%`, backgroundColor: barColor },
                          ]}
                        />
                      </View>
                    </View>

                    {(b.categoriesWithSpending || []).map((catItem) => (
                      <BudgetProgressCard
                        key={catItem.id}
                        categoryName={catItem.category?.name || b.name}
                        categoryIcon={catItem.category?.icon}
                        categoryColor={catItem.category?.color}
                        allocatedAmount={catItem.allocated_amount}
                        spentAmount={catItem.spentAmount || 0}
                        currency={currency}
                      />
                    ))}
                  </View>
                );
              })
            )}
          </>
        ) : (
          /* =========================================
              TAB 2: SAVINGS GOALS
          ========================================= */
          <>
            <View style={styles.sectionTitleRow}>
              <Text variant="sm" weight="bold">
                Active Goals
              </Text>
              <TouchableOpacity onPress={() => router.push('/goals/add')}>
                <Text variant="xs" color="primary" weight="bold">
                  + New Goal
                </Text>
              </TouchableOpacity>
            </View>

            {!isDemo && initialLoading ? (
              <ListSkeleton count={4} cardHeight={82} />
            ) : !isDemo && fetchError && activeGoals.length === 0 ? (
              <ErrorState
                title="Could Not Load Goals"
                message={fetchError}
                onRetry={() => {
                  setInitialLoading(true);
                  fetchData();
                }}
              />
            ) : activeGoals.length === 0 ? (
              <EmptyState
                illustration={<SavingsGoalIllustration size={160} />}
                title="No Savings Goals Yet"
                description="Set aside money for your next big milestone, emergency fund, dream gadget, or vacation."
                actionTitle="Create First Goal"
                actionIcon={<Plus size={16} color={colors.onPrimary} />}
                onAction={() => router.push('/goals/add')}
              />
            ) : (
              activeGoals.map((goal) => (
                <SavingsGoalCard
                  key={goal.id}
                  goal={goal}
                  currency={currency}
                  onPress={() => router.push(`/goals/${goal.id}`)}
                  onAddContribution={() => router.push(`/goals/${goal.id}`)}
                />
              ))
            )}
          </>
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  screenTitle: {
    fontSize: 20,
    letterSpacing: -0.4,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  tabSwitcher: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
  },
  overviewCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  overviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  percentageBadge: {
    alignItems: 'flex-end',
  },
  track: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  overviewBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  budgetGroupCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  budgetGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  budgetGroupActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTrack: {
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});
