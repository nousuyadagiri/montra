import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { analyticsService, AnalyticsSummary } from '../../services/analyticsService';
import { transactionService } from '../../services/transactionService';
import {
  Text,
  Heading,
  CurrencyText,
  Card,
  Badge,
  Header,
  LoadingState,
  Button,
} from '../../components/ui';
import { MonthlyBarChart, CategoryProgressRow } from '../../components/charts/FinanceCharts';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { exportTransactionsToCSV } from '../../utils/csvExport';
import {
  BarChart3,
  Download,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart,
} from 'lucide-react-native';

const PERIODS = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
] as const;

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    try {
      const summary = await analyticsService.getAnalytics(user.id, period);
      setData(summary);
    } catch (err) {
      console.warn('Analytics fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleExport = async () => {
    if (!user) return;
    const txns = await transactionService.getTransactions(user.id);
    await exportTransactionsToCSV(txns);
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Analytics & Reports" showBack />
        <LoadingState message="Aggregating financial trends..." />
      </View>
    );
  }

  const chartData = (data?.monthlyComparison || []).map((m) => ({
    month: m.month,
    income: m.income,
    expense: m.expense,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Financial Analytics"
        showBack
        rightAction={
          <TouchableOpacity onPress={handleExport} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Download size={20} color={colors.mainText} />
          </TouchableOpacity>
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
        <View style={[styles.periodTabs, { backgroundColor: colors.surface }]}>
          {PERIODS.map((p) => {
            const isSelected = period === p.value;
            return (
              <TouchableOpacity
                key={p.value}
                onPress={() => setPeriod(p.value)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isSelected ? colors.primary : 'transparent',
                  },
                ]}
              >
                <Text
                  variant="sm"
                  weight={isSelected ? 'bold' : 'medium'}
                  style={{ color: isSelected ? '#0B0F14' : colors.secondaryText }}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* High-Level Net Metrics */}
        <Card elevated style={styles.metricsCard}>
          <View style={styles.metricRow}>
            <View style={styles.metricCol}>
              <View style={styles.metricIconRow}>
                <View style={[styles.miniCircle, { backgroundColor: colors.successMuted }]}>
                  <ArrowDownLeft size={14} color={colors.success} />
                </View>
                <Text variant="xs" color="secondary">
                  Total Income
                </Text>
              </View>
              <CurrencyText
                amount={data?.totalIncome ?? 0}
                currency={profile?.currency || 'INR'}
                variant="lg"
                weight="bold"
                style={{ color: colors.success }}
              />
            </View>

            <View style={[styles.vLine, { backgroundColor: colors.border }]} />

            <View style={styles.metricCol}>
              <View style={styles.metricIconRow}>
                <View style={[styles.miniCircle, { backgroundColor: colors.errorMuted }]}>
                  <ArrowUpRight size={14} color={colors.error} />
                </View>
                <Text variant="xs" color="secondary">
                  Total Expenses
                </Text>
              </View>
              <CurrencyText
                amount={data?.totalExpenses ?? 0}
                currency={profile?.currency || 'INR'}
                variant="lg"
                weight="bold"
                style={{ color: colors.error }}
              />
            </View>
          </View>

          <View style={[styles.hLine, { backgroundColor: colors.border }]} />

          <View style={styles.netSavingsRow}>
            <View>
              <Text variant="xs" color="secondary">
                Net Savings
              </Text>
              <CurrencyText
                amount={data?.netSavings ?? 0}
                currency={profile?.currency || 'INR'}
                variant="xl"
                weight="extrabold"
              />
            </View>
            <Badge
              label={`${data?.savingsRate ?? 0}% Saved`}
              variant={(data?.netSavings ?? 0) >= 0 ? 'success' : 'error'}
              size="md"
            />
          </View>
        </Card>

        {/* Comparison Chart */}
        <Card elevated style={styles.chartCard}>
          <Text variant="base" weight="bold" style={styles.cardTitle}>
            Income vs Expenses Trends
          </Text>
          <MonthlyBarChart data={chartData} height={190} />
        </Card>

        {/* Category Breakdown */}
        {data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
          <Card elevated style={styles.categoryCard}>
            <Text variant="base" weight="bold" style={styles.cardTitle}>
              Spending by Category
            </Text>
            {data.categoryBreakdown.map((c, idx) => (
              <CategoryProgressRow
                key={idx}
                category={c.name}
                amount={c.amount}
                percentage={c.percentage}
                color={c.color}
              />
            ))}
          </Card>
        ) : null}

        {/* Highest Expense Items */}
        {data?.topExpenses && data.topExpenses.length > 0 ? (
          <Card elevated style={styles.topCard}>
            <Text variant="base" weight="bold" style={styles.cardTitle}>
              Largest Expenses
            </Text>
            {data.topExpenses.map((txn) => (
              <View key={txn.id} style={styles.topExpenseRow}>
                <View style={styles.topInfo}>
                  <Text variant="sm" weight="semibold">
                    {txn.title}
                  </Text>
                  <Text variant="xs" color="secondary">
                    {txn.category?.name || 'General'} • {txn.date}
                  </Text>
                </View>
                <CurrencyText
                  amount={txn.amount}
                  currency={profile?.currency || 'INR'}
                  variant="sm"
                  weight="bold"
                  style={{ color: colors.error }}
                />
              </View>
            ))}
          </Card>
        ) : null}
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
    paddingTop: Spacing.sm,
  },
  periodTabs: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: 3,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  metricsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricCol: {
    flex: 1,
  },
  metricIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  miniCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vLine: {
    width: 1,
    height: 40,
    marginHorizontal: Spacing.md,
  },
  hLine: {
    height: 1,
    marginVertical: Spacing.md,
  },
  netSavingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    marginBottom: Spacing.md,
  },
  categoryCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  topCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  topExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topInfo: {
    gap: 2,
  },
});

