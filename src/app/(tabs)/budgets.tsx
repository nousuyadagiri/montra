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
import {
  PieChart,
  Plus,
  Target,
  Pencil,
  Trash2,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
  Wallet,
} from 'lucide-react-native';
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

  // Goals calculations
  const totalGoalsTarget = useMemo(
    () => activeGoals.reduce((sum, g) => sum + Number(g.target_amount || 0), 0),
    [activeGoals]
  );
  const totalGoalsSaved = useMemo(
    () => activeGoals.reduce((sum, g) => sum + Number(g.current_amount || 0), 0),
    [activeGoals]
  );
  const goalsProgress = totalGoalsTarget > 0 ? totalGoalsSaved / totalGoalsTarget : 0;
  const goalsPercentage = Math.min(100, Math.round(goalsProgress * 100));
  const completedGoalsCount = activeGoals.filter(
    (g) => g.is_completed || Number(g.current_amount) >= Number(g.target_amount)
  ).length;

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + (Platform.OS === 'android' ? 16 : 12),
            paddingBottom: Spacing.xl,
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
              style={[styles.addBtn, { backgroundColor: colors.primary }, !isDark ? Shadows.sm : undefined]}
              onPress={() => router.push(activeTab === 'budgets' ? '/budgets/add' : '/goals/add')}
              activeOpacity={0.8}
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
              activeTab === 'budgets' && [
                styles.tabBtnActive,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                },
                !isDark ? Shadows.sm : undefined,
              ],
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
              activeTab === 'goals' && [
                styles.tabBtnActive,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                },
                !isDark ? Shadows.sm : undefined,
              ],
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
                  <View style={styles.overviewLabelRow}>
                    <TrendingUp size={12} color={colors.secondaryText} />
                    <Text variant="xs" color="secondary" weight="bold" style={styles.overviewLabel}>
                      TOTAL MONTHLY BUDGET
                    </Text>
                  </View>
                  <Text variant="2xl" weight="extrabold" style={styles.overviewAmount}>
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

              {/* Stats Tiles */}
              <View style={styles.statTilesRow}>
                <View
                  style={[
                    styles.statTile,
                    { backgroundColor: isDark ? colors.elevatedSurface : colors.background, borderColor: colors.borderLight },
                  ]}
                >
                  <View style={styles.statTileHeader}>
                    <ArrowUpRight size={12} color={colors.secondaryText} />
                    <Text variant="xs" color="secondary" weight="medium">Spent</Text>
                  </View>
                  <Text variant="sm" weight="bold" color="main" style={{ marginTop: 2 }}>
                    {formatCurrency(totalBudgetSpent, currency)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statTile,
                    { backgroundColor: isDark ? colors.elevatedSurface : colors.background, borderColor: colors.borderLight },
                  ]}
                >
                  <View style={styles.statTileHeader}>
                    <Wallet size={12} color={remainingBudget >= 0 ? colors.positive : colors.negative} />
                    <Text variant="xs" color="secondary" weight="medium">Remaining</Text>
                  </View>
                  <Text
                    variant="sm"
                    weight="bold"
                    style={{
                      marginTop: 2,
                      color: remainingBudget >= 0 ? colors.positive : colors.negative,
                    }}
                  >
                    {formatCurrency(remainingBudget, currency)}
                  </Text>
                </View>
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
                        !isDark ? Shadows.sm : undefined,
                      ]}
                    >
                      <View style={styles.budgetGroupHeader}>
                        <View style={{ flex: 1, paddingRight: Spacing.sm }}>
                          <Text variant="base" weight="bold" numberOfLines={1}>
                            {b.name}
                          </Text>
                          <Text variant="xs" color="secondary" style={{ fontSize: 11, marginTop: 2 }}>
                            {formatCurrency(b.totalSpent, currency)} of {formatCurrency(b.total_limit, currency)}
                          </Text>
                        </View>
                        <View style={styles.budgetGroupActions}>
                          <View
                            style={[
                              styles.groupPctBadge,
                              {
                                backgroundColor:
                                  pct >= 100
                                    ? colors.expenseMuted
                                    : pct >= 80
                                    ? colors.warningMuted
                                    : colors.primaryMuted,
                              },
                            ]}
                          >
                            <Text
                              variant="xs"
                              weight="bold"
                              style={{
                                color:
                                  pct >= 100
                                    ? colors.negative
                                    : pct >= 80
                                    ? colors.warning
                                    : colors.primary,
                                fontSize: 11,
                              }}
                            >
                              {pct}%
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => router.push({ pathname: '/budgets/add', params: { editId: b.id } })}
                            style={[
                              styles.miniIconBtn,
                              {
                                backgroundColor: isDark ? colors.elevatedSurface : colors.background,
                                borderColor: colors.borderLight,
                              },
                            ]}
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
            {/* Savings Goals Overview Card */}
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
                  <View style={styles.overviewLabelRow}>
                    <Target size={12} color={colors.secondaryText} />
                    <Text variant="xs" color="secondary" weight="bold" style={styles.overviewLabel}>
                      TOTAL SAVED IN GOALS
                    </Text>
                  </View>
                  <Text variant="2xl" weight="extrabold" style={styles.overviewAmount}>
                    {formatCurrency(totalGoalsSaved, currency)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.percentageBadge,
                    {
                      backgroundColor:
                        totalGoalsTarget === 0
                          ? colors.elevatedSurface
                          : goalsPercentage >= 100
                          ? colors.successMuted
                          : colors.primaryMuted,
                    },
                  ]}
                >
                  <Text
                    variant="xs"
                    weight="extrabold"
                    style={{
                      color:
                        totalGoalsTarget === 0
                          ? colors.secondaryText
                          : goalsPercentage >= 100
                          ? colors.positive
                          : colors.primary,
                      fontSize: 11,
                    }}
                  >
                    {totalGoalsTarget === 0 ? 'No goals' : `${goalsPercentage}% reached`}
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
                      width: `${Math.min(goalsProgress * 100, 100)}%`,
                      backgroundColor: goalsPercentage >= 100 ? colors.positive : colors.primary,
                    },
                  ]}
                />
              </View>

              {/* Stats Tiles */}
              <View style={styles.statTilesRow}>
                <View
                  style={[
                    styles.statTile,
                    { backgroundColor: isDark ? colors.elevatedSurface : colors.background, borderColor: colors.borderLight },
                  ]}
                >
                  <View style={styles.statTileHeader}>
                    <Target size={12} color={colors.secondaryText} />
                    <Text variant="xs" color="secondary" weight="medium">Total Target</Text>
                  </View>
                  <Text variant="sm" weight="bold" color="main" style={{ marginTop: 2 }}>
                    {formatCurrency(totalGoalsTarget, currency)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statTile,
                    { backgroundColor: isDark ? colors.elevatedSurface : colors.background, borderColor: colors.borderLight },
                  ]}
                >
                  <View style={styles.statTileHeader}>
                    <CheckCircle2 size={12} color={colors.positive} />
                    <Text variant="xs" color="secondary" weight="medium">Milestones</Text>
                  </View>
                  <Text
                    variant="sm"
                    weight="bold"
                    style={{
                      marginTop: 2,
                      color: colors.positive,
                    }}
                  >
                    {completedGoalsCount} of {activeGoals.length} Done
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionTitleRow}>
              <Text variant="sm" weight="bold">
                Active Goals
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/goals/add')}
                style={styles.newGoalInlineBtn}
              >
                <Plus size={13} color={colors.primary} strokeWidth={2.5} />
                <Text variant="xs" color="primary" weight="bold" style={{ marginLeft: 3 }}>
                  New Goal
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
    marginBottom: Spacing.md,
  },
  screenTitle: {
    fontSize: 22,
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  tabSwitcher: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 3,
    marginBottom: Spacing.lg,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  tabBtnActive: {
    borderWidth: 1,
  },
  overviewCard: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  overviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  overviewLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  overviewLabel: {
    letterSpacing: 0.6,
    fontSize: 11,
  },
  overviewAmount: {
    marginTop: 2,
    letterSpacing: -0.5,
  },
  percentageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
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
  statTilesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statTile: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  newGoalInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  budgetGroupCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
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
  groupPctBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginRight: 2,
  },
  miniIconBtn: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTrack: {
    height: 5,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});
