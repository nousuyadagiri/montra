import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Download, TrendingUp, Sparkles, PieChart, ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import { useSyncStore } from '../../store/syncStore';
import { analyticsService, AnalyticsSummary } from '../../services/analyticsService';
import { transactionService } from '../../services/transactionService';
import { SupportedCurrency } from '../../types/database';
import { DEMO_ANALYTICS_INSIGHTS } from '../../services/demoData';
import {
  Text,
  Card,
  Header,
  IncomeExpenseChart,
  DemoDataBadge,
  LoadingState,
  ErrorState,
  TransactionsIllustration,
} from '../../components/ui';
import { CategoryProgressRow } from '../../components/charts/FinanceCharts';
import { Spacing, BorderRadius, Shadows } from '../../theme/tokens';
import { exportTransactionsToCSV } from '../../utils/csvExport';
import { formatCurrency } from '../../utils/currency';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';

const PERIODS = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
] as const;

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const syncTick = useSyncStore((s) => s.syncTick);

  const demoTransactions = useDemoStore((s) => s.demoTransactions);
  const demoProfile = useDemoStore((s) => s.demoProfile);
  const getDemoAnalytics = useDemoStore((s) => s.getDemoAnalytics);

  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const isDemo = !user;

  const fetchAnalytics = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      setFetchError(null);
      return;
    }
    try {
      setFetchError(null);
      const summary = await analyticsService.getAnalytics(user.id, period);
      hasLoadedRef.current = true;
      setData(summary);
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Unable to load analytics.');
      setFetchError(msg);
      if (hasLoadedRef.current) {
        toast.error(msg, 'Sync Issue');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, period]);

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
    }, [fetchAnalytics])
  );

  useEffect(() => {
    if (syncTick > 0) {
      fetchAnalytics();
    }
  }, [syncTick, fetchAnalytics]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleExport = async () => {
    try {
      if (isDemo) {
        await exportTransactionsToCSV(demoTransactions);
        return;
      }
      if (!user) return;
      const txns = await transactionService.getTransactions(user.id);
      await exportTransactionsToCSV(txns);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Could not export transactions.'), 'Export Failed');
    }
  };

  void demoTransactions;
  const demoSummary = getDemoAnalytics(period);

  const activeSummary = isDemo ? demoSummary : data;
  const currency: SupportedCurrency = ((isDemo ? demoProfile?.currency : profile?.currency) as SupportedCurrency) || 'INR';

  const totalIncome = activeSummary?.totalIncome || 0;
  const totalExpenses = activeSummary?.totalExpenses || 0;
  const netSavings = activeSummary?.netSavings || 0;
  const savingsRate = activeSummary?.savingsRate || 0;

  const chartData = useMemo(
    () =>
      (activeSummary?.monthlyComparison || []).map((m) => ({
        month: m.month,
        income: m.income,
        expense: m.expense,
      })),
    [activeSummary]
  );

  const categoryBreakdown = useMemo(
    () =>
      (activeSummary?.categoryBreakdown || []).map((c) => ({
        categoryName: c.name,
        amount: c.amount,
        percentage: c.percentage,
        color: c.color,
        icon: c.icon || 'tag',
      })),
    [activeSummary]
  );

  if (loading && !refreshing && !isDemo) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Financial Analytics" showBack />
        <LoadingState message="Aggregating financial trends..." />
      </View>
    );
  }

  if (!loading && !isDemo && !data && fetchError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Financial Analytics" showBack />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ErrorState
            title="Could Not Load Analytics"
            message={fetchError}
            onRetry={() => {
              setLoading(true);
              fetchAnalytics();
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Financial Analytics"
        showBack
        rightAction={
          <View style={styles.headerRightRow}>
            {isDemo ? <DemoDataBadge compact /> : null}
            <TouchableOpacity
              onPress={handleExport}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Export CSV"
            >
              <Download size={19} color={colors.mainText} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing['3xl'] },
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
        {/* Period Selector Tabs */}
        <View
          style={[
            styles.periodTabs,
            { backgroundColor: colors.elevatedSurface, borderColor: colors.borderLight },
          ]}
        >
          {PERIODS.map((p) => {
            const isSelected = period === p.value;
            return (
              <TouchableOpacity
                key={p.value}
                onPress={() => setPeriod(p.value)}
                activeOpacity={0.7}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isSelected ? colors.surface : 'transparent',
                    borderColor: isSelected ? colors.borderLight : 'transparent',
                    borderWidth: isSelected ? StyleSheet.hairlineWidth : 0,
                  },
                ]}
              >
                <Text
                  variant="xs"
                  weight={isSelected ? 'bold' : 'medium'}
                  style={{
                    color: isSelected ? colors.mainText : colors.secondaryText,
                  }}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Financial Net Summary Card */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? colors.border : colors.borderLight,
            },
            !isDark ? Shadows.sm : undefined,
          ]}
        >
          <View style={styles.summaryTopRow}>
            <View>
              <Text variant="xs" color="secondary" weight="bold" style={styles.summarySubLabel}>
                NET SAVINGS ({period.toUpperCase()})
              </Text>
              <Text
                variant="2xl"
                weight="extrabold"
                style={{
                  color: netSavings >= 0 ? colors.positive : colors.negative,
                  marginTop: 3,
                  fontSize: 24,
                }}
              >
                {netSavings >= 0 ? '+' : ''}
                {formatCurrency(netSavings, currency)}
              </Text>
            </View>

            <View
              style={[
                styles.savingsRatePill,
                {
                  backgroundColor:
                    savingsRate >= 50
                      ? colors.successMuted
                      : colors.warningMuted,
                },
              ]}
            >
              <Text
                variant="xs"
                weight="bold"
                style={{ color: savingsRate >= 50 ? colors.positive : colors.warning, fontSize: 11.5 }}
              >
                {savingsRate}% Saved
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.inOutRow}>
            <View style={styles.inOutItem}>
              <View style={styles.iconDotRow}>
                <View style={[styles.miniDot, { backgroundColor: colors.successMuted }]}>
                  <ArrowDownLeft size={11} color={colors.positive} />
                </View>
                <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
                  Income
                </Text>
              </View>
              <Text variant="sm" weight="bold" style={{ color: colors.positive, marginTop: 4 }}>
                {formatCurrency(totalIncome, currency)}
              </Text>
            </View>

            <View style={[styles.vLine, { backgroundColor: colors.borderLight }]} />

            <View style={styles.inOutItem}>
              <View style={styles.iconDotRow}>
                <View style={[styles.miniDot, { backgroundColor: colors.expenseMuted }]}>
                  <ArrowUpRight size={11} color={colors.negative} />
                </View>
                <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
                  Expenses
                </Text>
              </View>
              <Text variant="sm" weight="bold" style={{ color: colors.negative, marginTop: 4 }}>
                {formatCurrency(totalExpenses, currency)}
              </Text>
            </View>

            <View style={[styles.vLine, { backgroundColor: colors.borderLight }]} />

            <View style={styles.inOutItem}>
              <View style={styles.iconDotRow}>
                <View style={[styles.miniDot, { backgroundColor: colors.primaryMuted }]}>
                  <TrendingUp size={11} color={colors.primary} />
                </View>
                <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
                  Daily Avg
                </Text>
              </View>
              <Text variant="sm" weight="bold" style={{ color: colors.mainText, marginTop: 4 }}>
                {formatCurrency(totalExpenses / (period === 'week' ? 7 : period === 'month' ? 30 : 365), currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Income vs Expenses Chart */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? colors.border : colors.borderLight,
            },
            !isDark ? Shadows.sm : undefined,
          ]}
        >
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconBadge, { backgroundColor: colors.primaryMuted }]}>
              <TrendingUp size={15} color={colors.primary} />
            </View>
            <View>
              <Text variant="sm" weight="bold">
                Income vs Expenses Trends
              </Text>
              <Text variant="xs" color="secondary" style={{ fontSize: 10.5 }}>
                Monthly comparison and savings trajectory
              </Text>
            </View>
          </View>
          <IncomeExpenseChart data={chartData} height={180} />
        </View>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 ? (
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : colors.borderLight,
              },
              !isDark ? Shadows.sm : undefined,
            ]}
          >
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: colors.primaryMuted }]}>
                <PieChart size={15} color={colors.primary} />
              </View>
              <View>
                <Text variant="sm" weight="bold">
                  Category Spending Breakdown
                </Text>
                <Text variant="xs" color="secondary" style={{ fontSize: 10.5 }}>
                  Ranked by top expenditure
                </Text>
              </View>
            </View>

            {categoryBreakdown.map((cat, idx) => (
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

        {/* Financial Insights */}
        <View style={styles.insightsSection}>
          <View style={styles.insightsHeader}>
            <Sparkles size={16} color={colors.primary} />
            <Text variant="sm" weight="bold">
              Automated Insights & Recommendations
            </Text>
          </View>

          {DEMO_ANALYTICS_INSIGHTS.map((insight) => (
            <View
              key={insight.id}
              style={[
                styles.insightCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDark ? colors.border : colors.borderLight,
                },
                !isDark ? Shadows.sm : undefined,
              ]}
            >
              <View style={styles.insightTop}>
                <Text variant="xs" weight="bold" color="primary" style={{ letterSpacing: 0.5 }}>
                  {insight.title.toUpperCase()}
                </Text>
              </View>
              <Text variant="xs" color="secondary" style={{ lineHeight: 18, marginTop: 4 }}>
                {insight.description}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  periodTabs: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  summarySubLabel: {
    letterSpacing: 0.8,
    fontSize: 11,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  savingsRatePill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  inOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inOutItem: {
    flex: 1,
  },
  iconDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vLine: {
    width: 1,
    height: 36,
    marginHorizontal: Spacing.md,
  },
  sectionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  sectionIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightsSection: {
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    paddingLeft: Spacing.xs,
  },
  insightCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  insightTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
