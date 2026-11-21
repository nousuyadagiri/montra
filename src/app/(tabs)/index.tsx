import { useFocusEffect, useRouter } from "expo-router";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Bell,
  LogIn,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  RefreshControl,
  StatusBar as RNStatusBar,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryProgressRow } from "../../components/charts/FinanceCharts";
import {
  BalanceCard,
  DashboardSkeleton,
  EmptyState,
  ErrorState,
  Heading,
  IncomeExpenseChart,
  MonthlyOverview,
  QuickActionButton,
  Text,
  CurrencyText,
  TransactionItem,
  TransactionsIllustration,
} from "../../components/ui";
import {
  DashboardMetrics,
  dashboardService,
} from "../../services/dashboardService";
import { DEMO_ANALYTICS_INSIGHTS } from "../../services/demoData";
import { useAuthStore } from "../../store/authStore";
import { useDemoStore } from "../../store/demoStore";
import { useSyncStore } from "../../store/syncStore";
import { useAppTheme } from "../../store/themeStore";
import { useTabBarScroll, useTabBarStore } from "../../store/tabBarStore";
import { toast } from "../../store/toastStore";
import { BorderRadius, Shadows, Spacing } from "../../theme/tokens";
import { SupportedCurrency } from "../../types/database";
import { formatCurrency } from "../../utils/currency";
import { getErrorMessage } from "../../utils/errors";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const syncTick = useSyncStore((s) => s.syncTick);

  const demoProfile = useDemoStore((s) => s.demoProfile);
  const demoTransactions = useDemoStore((s) => s.demoTransactions);
  const demoAccounts = useDemoStore((s) => s.demoAccounts);
  const getDemoDashboardMetrics = useDemoStore(
    (s) => s.getDemoDashboardMetrics,
  );

  const [realMetrics, setRealMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const hasLoadedRef = useRef(false);
  const tabBarScroll = useTabBarScroll();

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
      const data = await dashboardService.getDashboardMetrics(
        user.id,
        selectedDate,
      );
      hasLoadedRef.current = true;
      setRealMetrics(data);
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Unable to load dashboard metrics.");
      setFetchError(msg);
      if (hasLoadedRef.current) {
        toast.error(msg, "Sync Issue");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
      useTabBarStore.getState().setIsVisible(true);
    }, [fetchDashboard]),
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
  const demoMetrics = getDemoDashboardMetrics(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
  );

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
    [profile?.monthly_salary, profile?.salary_date],
  );

  const statusBarHeight =
    Platform.OS === "android" ? (RNStatusBar.currentHeight ?? 24) : 0;
  const topInset = Math.max(
    insets.top,
    statusBarHeight,
    Platform.OS === "android" ? 28 : 16,
  );

  if (loading && !isDemo && !realMetrics) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: topInset },
        ]}
      >
        <DashboardSkeleton />
      </View>
    );
  }

  if (!loading && !isDemo && !realMetrics && fetchError) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            paddingTop: topInset,
          },
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

  const metrics = isDemo ? demoMetrics : realMetrics || emptyRealMetrics;
  const activeProfile = isDemo ? demoProfile : profile;
  const currency: SupportedCurrency =
    (activeProfile?.currency as SupportedCurrency) || "INR";
  const displayName = isDemo
    ? demoProfile.full_name
    : profile?.full_name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "Financier";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase() || "")
    .join("") || "M";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + (Platform.OS === "android" ? 12 : 8),
            paddingBottom: insets.bottom + 28,
          },
        ]}
        {...tabBarScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 1. TOP HEADER (Refined Apple & Fintech Aesthetic) */}
        <View style={styles.topHeader}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity
              style={[
                styles.avatarCircle,
                { backgroundColor: isDark ? colors.elevatedSurface : "#1C1C1E" },
              ]}
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.8}
              accessibilityLabel="View Profile"
            >
              <Text variant="xs" weight="bold" style={{ color: "#FFFFFF", fontSize: 13 }}>
                {initials}
              </Text>
            </TouchableOpacity>

            <View style={styles.welcomeTextGroup}>
              <View style={styles.greetingRow}>
                <Text
                  variant="xs"
                  color="secondary"
                  weight="semibold"
                  style={styles.greetingSub}
                >
                  FINANCIAL OVERVIEW
                </Text>
                {isDemo ? (
                  <View style={styles.demoBadge}>
                    <View style={styles.demoDot} />
                    <Text variant="xs" weight="bold" style={styles.demoText}>
                      DEMO
                    </Text>
                  </View>
                ) : null}
              </View>
              <Heading level={2} style={styles.userName} numberOfLines={1}>
                {displayName}
              </Heading>
            </View>
          </View>

          <View style={styles.headerRightActions}>
            {/* Quick Add '+' Button */}
            <TouchableOpacity
              style={[
                styles.plusCircleBtn,
                { backgroundColor: isDark ? colors.elevatedSurface : "#1C1C1E" },
              ]}
              onPress={() => router.push("/transactions/add")}
              accessibilityLabel="Quick Add Transaction"
              activeOpacity={0.8}
            >
              <Plus size={18} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>

            {/* Notifications Bell */}
            <TouchableOpacity
              style={[
                styles.iconBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                },
              ]}
              onPress={() => router.push("/analytics")}
              accessibilityLabel="Notifications"
            >
              <Bell size={17} color={colors.mainText} strokeWidth={2} />
              <View style={[styles.notificationDot, { backgroundColor: colors.primary }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Demo Mode Prompt Banner (Slim & Non-intrusive) */}
        {isDemo ? (
          <TouchableOpacity
            onPress={() => router.push("/(auth)/login")}
            activeOpacity={0.8}
            style={[
              styles.demoPromptBanner,
              {
                backgroundColor: isDark ? 'rgba(203, 216, 126, 0.12)' : '#F6F9EA',
                borderColor: isDark ? 'rgba(203, 216, 126, 0.3)' : '#DCE8A8',
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text variant="xs" weight="bold" style={{ color: isDark ? '#D4E798' : '#5E6E16', fontSize: 11.5 }}>
                Demo Mode Preview
              </Text>
              <Text variant="xs" color="secondary" style={{ fontSize: 11, marginTop: 1 }}>
                Sign in to sync your finances across all your devices.
              </Text>
            </View>
            <View
              style={[
                styles.demoSignInChip,
                { backgroundColor: isDark ? '#D4E798' : '#1C1C1E' },
              ]}
            >
              <LogIn size={11} color={isDark ? '#141416' : '#FFFFFF'} />
              <Text
                variant="xs"
                weight="bold"
                style={{ color: isDark ? '#141416' : '#FFFFFF', fontSize: 11 }}
              >
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

        {/* 3. HERO BALANCE CARD (Refined, Focused, Unified with Goal Progress) */}
        <BalanceCard
          totalBalance={metrics.totalBalance}
          monthlyIncome={metrics.monthlyIncome}
          monthlyExpenses={metrics.monthlyExpenses}
          netSavings={metrics.netSavings}
          savingsRate={metrics.savingsRate}
          currency={currency}
          onPressAnalytics={() => router.push("/analytics")}
          showGoal={true}
          targetAmount={Math.max(metrics.monthlyIncome, metrics.totalBalance * 1.5, 50000)}
          onPressGoal={() => router.push("/(tabs)/budgets")}
          showMetricsStrip={false}
        />

        {/* 4. CASH FLOW SUMMARY (Clean 3-Card Row: Income, Expenses, Savings) */}
        <View style={styles.cashFlowRow}>
          {/* Income Card */}
          <View
            style={[
              styles.cashFlowCard,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : colors.borderLight,
              },
              !isDark ? Shadows.sm : undefined,
            ]}
          >
            <View style={styles.cashFlowTop}>
              <View style={[styles.cashFlowIconCircle, { backgroundColor: colors.successMuted }]}>
                <ArrowDownLeft size={12} color={colors.positive} strokeWidth={2.4} />
              </View>
              <Text variant="xs" weight="semibold" color="secondary" style={{ fontSize: 10.5 }}>
                Income
              </Text>
            </View>
            <CurrencyText
              amount={metrics.monthlyIncome}
              currency={currency}
              variant="sm"
              weight="extrabold"
              style={{ color: colors.positive, marginTop: 3 }}
            />
          </View>

          {/* Expenses Card */}
          <View
            style={[
              styles.cashFlowCard,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : colors.borderLight,
              },
              !isDark ? Shadows.sm : undefined,
            ]}
          >
            <View style={styles.cashFlowTop}>
              <View style={[styles.cashFlowIconCircle, { backgroundColor: colors.expenseMuted }]}>
                <ArrowUpRight size={12} color={colors.negative} strokeWidth={2.4} />
              </View>
              <Text variant="xs" weight="semibold" color="secondary" style={{ fontSize: 10.5 }}>
                Expenses
              </Text>
            </View>
            <CurrencyText
              amount={metrics.monthlyExpenses}
              currency={currency}
              variant="sm"
              weight="extrabold"
              style={{ color: colors.negative, marginTop: 3 }}
            />
          </View>

          {/* Savings Card */}
          <View
            style={[
              styles.cashFlowCard,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : colors.borderLight,
              },
              !isDark ? Shadows.sm : undefined,
            ]}
          >
            <View style={styles.cashFlowTop}>
              <View style={[styles.cashFlowIconCircle, { backgroundColor: colors.primaryMuted }]}>
                <TrendingUp size={12} color={colors.primary} strokeWidth={2.4} />
              </View>
              <Text variant="xs" weight="semibold" color="secondary" style={{ fontSize: 10.5 }}>
                Savings
              </Text>
            </View>
            <CurrencyText
              amount={metrics.netSavings}
              currency={currency}
              variant="sm"
              weight="extrabold"
              style={{
                color: metrics.netSavings >= 0 ? colors.mainText : colors.negative,
                marginTop: 3,
              }}
            />
          </View>
        </View>

        {/* 6. QUICK ACTIONS (Modern Apple-style squircle buttons) */}
        <View
          style={[
            styles.quickActionsCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? colors.border : colors.borderLight,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.2 : 0.04,
              shadowRadius: 8,
              elevation: 2,
            },
          ]}
        >
          <QuickActionButton
            icon={Plus}
            label="Expense"
            variant="negative"
            onPress={() =>
              router.push({
                pathname: "/transactions/add",
                params: { type: "expense" },
              })
            }
          />
          <QuickActionButton
            icon={ArrowDownLeft}
            label="Income"
            variant="positive"
            onPress={() =>
              router.push({
                pathname: "/transactions/add",
                params: { type: "income" },
              })
            }
          />
          <QuickActionButton
            icon={ArrowLeftRight}
            label="Transfer"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: "/transactions/add",
                params: { type: "transfer" },
              })
            }
          />
          <QuickActionButton
            icon={Users}
            label="Split"
            variant="primary"
            onPress={() => router.push("/(tabs)/split")}
          />
        </View>

        {/* 6. RECENT TRANSACTIONS */}
        <View style={styles.recentTransactionsHeader}>
          <Text variant="sm" weight="bold">
            Recent Transactions
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
            <Text variant="xs" color="primary" weight="bold">
              See All →
            </Text>
          </TouchableOpacity>
        </View>

        {metrics.recentTransactions && metrics.recentTransactions.length > 0 ? (
          <View
            style={[
              styles.transactionsCard,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : colors.borderLight,
              },
              !isDark ? Shadows.sm : undefined,
            ]}
          >
            {metrics.recentTransactions.slice(0, 5).map((item, idx) => (
              <TransactionItem
                key={item.id}
                transaction={item}
                currency={currency}
                onPress={() => router.push(`/transactions/${item.id}`)}
                showDivider={
                  idx < Math.min(metrics.recentTransactions.length, 5) - 1
                }
              />
            ))}
          </View>
        ) : (
          <EmptyState
            illustration={<TransactionsIllustration size={130} />}
            title="No Transactions Yet"
            description="Tap '+ Expense' or '+ Income' above to record your first real transaction."
          />
        )}

        {/* 7. SPENDING BREAKDOWN */}
        {metrics.categoryBreakdown && metrics.categoryBreakdown.length > 0 ? (
          <View
            style={[
              styles.breakdownCard,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : colors.borderLight,
              },
              !isDark ? Shadows.sm : undefined,
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <Text variant="xs" weight="bold">
                Top Spending
              </Text>
              <TouchableOpacity onPress={() => router.push("/analytics")}>
                <Text
                  variant="xs"
                  color="secondary"
                  weight="medium"
                  style={{ fontSize: 11 }}
                >
                  All Categories →
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

        {/* 8. INCOME VS EXPENSES VISUALIZATION */}
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? colors.border : colors.borderLight,
            },
            !isDark ? Shadows.sm : undefined,
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.iconHeadingRow}>
              <View
                style={[
                  styles.chartIconBadge,
                  { backgroundColor: colors.secondaryMuted },
                ]}
              >
                <TrendingUp size={14} color={colors.secondary} />
              </View>
              <Text variant="xs" weight="bold">
                Income vs Expenses
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/analytics")}>
              <Text
                variant="xs"
                color="secondary"
                weight="medium"
                style={{ fontSize: 11 }}
              >
                View Trends →
              </Text>
            </TouchableOpacity>
          </View>

          <IncomeExpenseChart data={metrics.monthlyTrends || []} height={140} />
        </View>

        {/* 9. FINANCIAL INSIGHT */}
        {isDemo ? (
          <View
            style={[
              styles.insightBanner,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : colors.borderLight,
              },
              !isDark ? Shadows.sm : undefined,
            ]}
          >
            <View
              style={[
                styles.insightIconCircle,
                { backgroundColor: colors.primaryMuted },
              ]}
            >
              <Sparkles size={14} color={colors.primary} />
            </View>
            <View style={styles.insightTextGroup}>
              <Text
                variant="xs"
                weight="bold"
                color="primary"
                style={{ fontSize: 10, letterSpacing: 0.8 }}
              >
                FINANCIAL INSIGHT
              </Text>
              <Text
                variant="xs"
                color="secondary"
                style={{ lineHeight: 16, marginTop: 1, fontSize: 11.5 }}
              >
                {DEMO_ANALYTICS_INSIGHTS[0].description}
              </Text>
            </View>
          </View>
        ) : null}

        {/* 10. SALARY OVERVIEW (Elevated Fintech Strip) */}
        <View
          style={[
            styles.salaryCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? colors.border : colors.borderLight,
            },
            !isDark ? Shadows.sm : undefined,
          ]}
        >
          <View style={styles.salaryHeaderRow}>
            <View style={styles.iconHeadingRow}>
              <View
                style={[
                  styles.salaryIconBadge,
                  { backgroundColor: colors.primaryMuted },
                ]}
              >
                <Wallet size={15} color={colors.primary} />
              </View>
              <View>
                <Text variant="xs" weight="bold">
                  Salary Overview
                </Text>
                <Text variant="xs" color="secondary" style={{ fontSize: 10.5 }}>
                  Recurring monthly payday
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/settings")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                variant="xs"
                color="primary"
                weight="bold"
                style={{ fontSize: 11 }}
              >
                Manage →
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.salaryStatsRow,
              {
                backgroundColor: isDark
                  ? colors.elevatedSurface
                  : colors.background,
              },
            ]}
          >
            <View style={styles.salaryStatItem}>
              <Text variant="xs" color="secondary" style={styles.statLabel}>
                Base Monthly
              </Text>
              <Text variant="sm" weight="extrabold" style={styles.statValue}>
                {formatCurrency(metrics.monthlySalary, currency)}
              </Text>
            </View>
            <View
              style={[
                styles.statDivider,
                { backgroundColor: colors.borderLight },
              ]}
            />
            <View style={styles.salaryStatItem}>
              <Text variant="xs" color="secondary" style={styles.statLabel}>
                Additional
              </Text>
              <Text variant="sm" weight="extrabold" style={styles.statValue}>
                {formatCurrency(metrics.additionalIncome, currency)}
              </Text>
            </View>
            <View
              style={[
                styles.statDivider,
                { backgroundColor: colors.borderLight },
              ]}
            />
            <View style={styles.salaryStatItem}>
              <Text variant="xs" color="secondary" style={styles.statLabel}>
                Pay Date
              </Text>
              <Text variant="sm" weight="extrabold" style={styles.statValue}>
                Day {metrics.salaryDate ?? 1}
              </Text>
            </View>
          </View>
        </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: 12,
  },
  headerLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeTextGroup: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  greetingSub: {
    fontSize: 9.5,
    letterSpacing: 1.2,
  },
  demoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: "rgba(203, 216, 126, 0.22)",
  },
  demoDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: "#637410",
  },
  demoText: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#637410",
    letterSpacing: 0.4,
  },
  userName: {
    fontSize: 18,
    letterSpacing: -0.4,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  plusCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  demoPromptBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  demoSignInChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  monthSelectorRow: {
    marginVertical: Spacing.xs,
    alignItems: "center",
  },
  cashFlowRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: Spacing.sm + 2,
  },
  cashFlowCard: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  cashFlowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cashFlowIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionsCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius["2xl"],
    borderWidth: 1,
    marginBottom: Spacing.sm + 4,
  },
  salaryCard: {
    marginBottom: Spacing.sm + 4,
    padding: Spacing.md + 2,
    borderRadius: BorderRadius["2xl"],
    borderWidth: 1,
  },
  salaryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm + 2,
  },
  salaryIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  chartIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  salaryStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  salaryStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
  },
  statLabel: {
    fontSize: 10.5,
  },
  statValue: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  chartCard: {
    marginBottom: Spacing.sm + 4,
    padding: Spacing.md + 2,
    borderRadius: BorderRadius["2xl"],
    borderWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs + 2,
  },
  breakdownCard: {
    marginTop: Spacing.md + 4,
    marginBottom: Spacing.sm + 4,
    padding: Spacing.md + 2,
    borderRadius: BorderRadius["2xl"],
    borderWidth: 1,
  },
  insightBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.sm + 4,
  },
  insightIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(163, 230, 53, 0.12)",
  },
  insightTextGroup: {
    flex: 1,
  },
  recentTransactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
