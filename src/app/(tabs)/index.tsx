import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BarChart3,
  Wallet,
  Sparkles,
  TrendingUp,
  Plus,
  ArrowDownLeft,
  ArrowLeftRight,
  Users,
  LogIn,
} from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import { useSyncStore } from '../../store/syncStore';
import { dashboardService, DashboardMetrics } from '../../services/dashboardService';
import { DEMO_ANALYTICS_INSIGHTS } from '../../services/demoData';
import {
  Text,
  Heading,
  BalanceCard,
  TransactionItem,
  QuickActionButton,
  MonthlyOverview,
  IncomeExpenseChart,
  DemoDataBadge,
  DashboardSkeleton,
  EmptyState,
  ErrorState,
} from '../../components/ui';
import { CategoryProgressRow } from '../../components/charts/FinanceCharts';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';
import { SupportedCurrency } from '../../types/database';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const syncTick = useSyncStore((s) => s.syncTick);

  const demoProfile = useDemoStore((s) => s.demoProfile);
  const demoTransactions = useDemoStore((s) => s.demoTransactions);
  const demoAccounts = useDemoStore((s) => s.demoAccounts);
  const getDemoDashboardMetrics = useDemoStore((s) => s.getDemoDashboardMetrics);

  const [realMetrics, setRealMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const hasLoadedRef = useRef(false);

  const isDemo = !user;

  const fetchDashboard = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      setFetchError(null);
      return;
    }
    try {
      setFetchError(null);
      const data = await dashboardService.getDashboardMetrics(user.id, selectedDate);
      hasLoadedRef.current = true;
      setRealMetrics(data);
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Unable to load dashboard metrics.');
      setFetchError(msg);
      if (hasLoadedRef.current) {
        toast.error(msg, 'Sync Issue');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard])
  );

  useEffect(() => {
    if (syncTick > 0) {
      fetchDashboard();
    }
  }, [syncTick, fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  // Re-evaluates automatically whenever subscribed demo slices or selectedDate change
  void demoTransactions;
  void demoAccounts;
  void demoProfile;
  const demoMetrics = getDemoDashboardMetrics(selectedDate.getFullYear(), selectedDate.getMonth());

  const emptyRealMetrics: DashboardMetrics = useMemo(
    () => ({
      totalBalance: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      netSavings: 0,
      savingsRate: 0,
      monthlySalary: Number(profile?.monthly_salary || 0),
      additionalIncome: 0,
      salaryDate: profile?.salary_date || 1,
      todayExpenses: 0,
      thisWeekExpenses: 0,
      thisMonthExpenses: 0,
      recentTransactions: [],
      categoryBreakdown: [],
      monthlyTrends: [],
    }),
    [profile?.monthly_salary, profile?.salary_date]
  );

  const statusBarHeight = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 0;
  const topInset = Math.max(insets.top, statusBarHeight, Platform.OS === 'android' ? 28 : 16);
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 24 : 10);
  const tabHeight = 62 + bottomInset;

  if (loading && !isDemo && !realMetrics) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
        <DashboardSkeleton />
      </View>
    );
  }

  if (!loading && !isDemo && !realMetrics && fetchError) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: 'center', paddingTop: topInset },
        ]}
      >
        <ErrorState
          title="Could Not Load Dashboard"
          message={fetchError}
          onRetry={() => {
            setLoading(true);
            fetchDashboard();
          }}
        />
      </View>
    );
  }

  const metrics = isDemo ? demoMetrics : (realMetrics || emptyRealMetrics);
  const activeProfile = isDemo ? demoProfile : profile;
  const currency: SupportedCurrency = (activeProfile?.currency as SupportedCurrency) || 'INR';
  const displayName = isDemo
    ? demoProfile.full_name
    : (profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Financier');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + (Platform.OS === 'android' ? 14 : 10),
            paddingBottom: tabHeight + Spacing.lg,
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
          <View style={styles.welcomeTextGroup}>
            <Text variant="xs" color="secondary" weight="semibold" style={styles.greetingSub}>
              WELCOME BACK
            </Text>
            <Heading level={2} style={styles.userName} numberOfLines={1}>
              {displayName}
            </Heading>
          </View>

          <View style={styles.headerRightActions}>
            {isDemo ? <DemoDataBadge /> : null}

            <TouchableOpacity
              style={[
                styles.iconBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                },
              ]}
              onPress={() => router.push('/analytics')}
              accessibilityLabel="View Analytics"
            >
              <BarChart3 size={17} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {isDemo ? (
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
            style={[
              styles.demoPromptBanner,
              { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text variant="xs" weight="bold" color="primary">
                Demo Mode Preview
              </Text>
              <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
                Sign in with your account to sync real-time finances across devices.
              </Text>
            </View>
            <View style={[styles.demoSignInChip, { backgroundColor: colors.primary }]}>
              <LogIn size={12} color={colors.onPrimary} />
              <Text variant="xs" weight="bold" style={{ color: colors.onPrimary, fontSize: 11 }}>
                Sign In
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* 2. MONTH SELECTOR */}
        <View style={styles.monthSelectorRow}>
          <MonthlyOverview
            currentDate={selectedDate}
            onPrevMonth={() => {
              const prev = new Date(selectedDate);
              prev.setMonth(prev.getMonth() - 1);
              setSelectedDate(prev);
            }}
            onNextMonth={() => {
              const next = new Date(selectedDate);
              next.setMonth(next.getMonth() + 1);
              setSelectedDate(next);
            }}
            onPressToday={() => setSelectedDate(new Date())}
          />
        </View>

        {/* 3. HERO BALANCE CARD */}
        <BalanceCard
          totalBalance={metrics.totalBalance}
          monthlyIncome={metrics.monthlyIncome}
          monthlyExpenses={metrics.monthlyExpenses}
          netSavings={metrics.netSavings}
          savingsRate={metrics.savingsRate}
          currency={currency}
          onPressAnalytics={() => router.push('/analytics')}
        />

        {/* 4. QUICK ACTIONS */}
        <View style={styles.quickActionsRow}>
          <QuickActionButton
            icon={Plus}
            label="Expense"
            variant="negative"
            onPress={() => router.push({ pathname: '/transactions/add', params: { type: 'expense' } })}
          />
          <QuickActionButton
            icon={ArrowDownLeft}
            label="Income"
            variant="positive"
            onPress={() => router.push({ pathname: '/transactions/add', params: { type: 'income' } })}
          />
          <QuickActionButton
            icon={ArrowLeftRight}
            label="Transfer"
            variant="secondary"
            onPress={() => router.push({ pathname: '/transactions/add', params: { type: 'transfer' } })}
          />
          <QuickActionButton
            icon={Users}
            label="Split"
            variant="primary"
            onPress={() => router.push('/(tabs)/split')}
          />
        </View>

        {/* 5. SALARY OVERVIEW (Compact Strip) */}
        <View
          style={[
            styles.salaryCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <View style={styles.salaryHeaderRow}>
            <View style={styles.iconHeadingRow}>
              <Wallet size={15} color={colors.primary} />
              <Text variant="xs" weight="bold">
                Salary Overview
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Text variant="xs" color="primary" weight="bold" style={{ fontSize: 11 }}>
                Manage
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.salaryStatsRow}>
            <View style={styles.salaryStatItem}>
              <Text variant="xs" color="secondary" style={styles.statLabel}>
                Base Monthly
              </Text>
              <Text variant="sm" weight="bold" style={styles.statValue}>
                {formatCurrency(metrics.monthlySalary, currency)}
              </Text>
            </View>
            <View style={styles.salaryStatItem}>
              <Text variant="xs" color="secondary" style={styles.statLabel}>
                Additional
              </Text>
              <Text variant="sm" weight="bold" style={styles.statValue}>
                {formatCurrency(metrics.additionalIncome, currency)}
              </Text>
            </View>
            <View style={styles.salaryStatItem}>
              <Text variant="xs" color="secondary" style={styles.statLabel}>
                Pay Date
              </Text>
              <Text variant="sm" weight="bold" style={styles.statValue}>
                Day {metrics.salaryDate ?? 1}
              </Text>
            </View>
          </View>
        </View>

        {/* 6. INCOME VS EXPENSES VISUALIZATION */}
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.iconHeadingRow}>
              <TrendingUp size={15} color={colors.secondary} />
              <Text variant="xs" weight="bold">
                Income vs Expenses
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/analytics')}>
              <Text variant="xs" color="secondary" weight="medium" style={{ fontSize: 11 }}>
                View Trends
              </Text>
            </TouchableOpacity>
          </View>

          <IncomeExpenseChart data={metrics.monthlyTrends || []} height={135} />
        </View>

        {/* 7. SPENDING BREAKDOWN */}
        {metrics.categoryBreakdown && metrics.categoryBreakdown.length > 0 ? (
          <View
            style={[
              styles.breakdownCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <Text variant="xs" weight="bold">
                Top Spending
              </Text>
              <TouchableOpacity onPress={() => router.push('/analytics')}>
                <Text variant="xs" color="secondary" weight="medium" style={{ fontSize: 11 }}>
                  All Categories
                </Text>
              </TouchableOpacity>
            </View>

            {metrics.categoryBreakdown.slice(0, 3).map((cat, idx) => (
              <CategoryProgressRow
                key={idx}
                category={cat.categoryName}
                amount={cat.amount}
                percentage={cat.percentage}
                color={cat.color}
              />
            ))}
          </View>
        ) : null}

        {/* 8. FINANCIAL INSIGHT */}
        {isDemo ? (
          <View
            style={[
              styles.insightBanner,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <View style={styles.insightIconCircle}>
              <Sparkles size={14} color={colors.primary} />
            </View>
            <View style={styles.insightTextGroup}>
              <Text variant="xs" weight="bold" color="primary" style={{ fontSize: 10 }}>
                FINANCIAL INSIGHT
              </Text>
              <Text variant="xs" color="secondary" style={{ lineHeight: 16, marginTop: 1, fontSize: 11.5 }}>
                {DEMO_ANALYTICS_INSIGHTS[0].description}
              </Text>
            </View>
          </View>
        ) : null}

        {/* 9. RECENT TRANSACTIONS */}
        <View style={styles.recentTransactionsHeader}>
          <Text variant="sm" weight="bold">
            Recent Transactions
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
            <Text variant="xs" color="primary" weight="bold">
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {metrics.recentTransactions && metrics.recentTransactions.length > 0 ? (
          <View
            style={[
              styles.transactionsCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
          >
            {metrics.recentTransactions.slice(0, 5).map((item, idx) => (
              <TransactionItem
                key={item.id}
                transaction={item}
                currency={currency}
                onPress={() => router.push(`/transactions/${item.id}`)}
                showDivider={idx < Math.min(metrics.recentTransactions.length, 5) - 1}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            title="No Transactions Yet"
            description="Tap '+ Expense' or '+ Income' above to record your first real transaction."
          />
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
    marginBottom: Spacing.xs,
  },
  welcomeTextGroup: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  greetingSub: {
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 1,
  },
  userName: {
    fontSize: 20,
    letterSpacing: -0.4,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  demoPromptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  demoSignInChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthSelectorRow: {
    marginVertical: Spacing.xs,
    alignItems: 'center',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  salaryCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  salaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  salaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  salaryStatItem: {
    flex: 1,
    gap: 1,
  },
  statLabel: {
    fontSize: 10.5,
  },
  statValue: {
    fontSize: 13.5,
  },
  chartCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  breakdownCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  insightIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(163, 230, 53, 0.12)',
  },
  insightTextGroup: {
    flex: 1,
  },
  recentTransactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: Spacing.xs,
    paddingHorizontal: 2,
  },
  transactionsCard: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
});
