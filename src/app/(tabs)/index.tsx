import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { dashboardService, DashboardMetrics } from '../../services/dashboardService';
import {
  Text,
  Heading,
  CurrencyText,
  Card,
  Badge,
  Button,
  LoadingState,
  EmptyState,
} from '../../components/ui';
import { MonthlyBarChart, CategoryProgressRow } from '../../components/charts/FinanceCharts';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  ArrowLeftRight,
  Users,
  BarChart3,
  Calendar,
  Wallet,
  TrendingUp,
  CreditCard,
  ChevronRight,
} from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    if (!user) return;
    try {
      const data = await dashboardService.getDashboardMetrics(user.id);
      setMetrics(data);
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading && !metrics) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState message="Calculating your financial metrics..." />
      </View>
    );
  }

  const totalBal = metrics?.totalBalance ?? 0;
  const mIncome = metrics?.monthlyIncome ?? 0;
  const mExpense = metrics?.monthlyExpenses ?? 0;
  const netSave = metrics?.netSavings ?? 0;
  const monthlySalary = metrics?.monthlySalary ?? 0;
  const additionalIncome = metrics?.additionalIncome ?? 0;

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
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text variant="xs" color="secondary" weight="semibold" style={styles.greetingSub}>
              WELCOME BACK
            </Text>
            <Heading level={1} style={styles.userName}>
              {profile?.full_name || 'Financier'}
            </Heading>
          </View>
          <TouchableOpacity
            style={[styles.analyticsBtn, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/analytics')}
          >
            <BarChart3 size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Section A: Total Balance Card */}
        <Card elevated style={[styles.mainCard, { borderColor: colors.primaryMuted }]}>
          <View style={styles.balanceHeader}>
            <Text variant="xs" color="secondary" weight="semibold">
              TOTAL AVAILABLE BALANCE
            </Text>
            <Badge
              label={`${metrics?.savingsRate ?? 0}% Saved`}
              variant={netSave >= 0 ? 'success' : 'error'}
              size="sm"
            />
          </View>

          <CurrencyText
            amount={totalBal}
            currency={profile?.currency || 'INR'}
            variant="3xl"
            weight="extrabold"
            style={styles.totalBalanceText}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.incomeExpenseRow}>
            <View style={styles.incomeCol}>
              <View style={styles.statIconRow}>
                <View style={[styles.miniCircle, { backgroundColor: colors.successMuted }]}>
                  <ArrowDownLeft size={14} color={colors.success} />
                </View>
                <Text variant="xs" color="secondary">
                  Monthly Income
                </Text>
              </View>
              <CurrencyText
                amount={mIncome}
                currency={profile?.currency || 'INR'}
                variant="md"
                weight="bold"
                style={{ color: colors.success }}
              />
            </View>

            <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

            <View style={styles.expenseCol}>
              <View style={styles.statIconRow}>
                <View style={[styles.miniCircle, { backgroundColor: colors.errorMuted }]}>
                  <ArrowUpRight size={14} color={colors.error} />
                </View>
                <Text variant="xs" color="secondary">
                  Monthly Expenses
                </Text>
              </View>
              <CurrencyText
                amount={mExpense}
                currency={profile?.currency || 'INR'}
                variant="md"
                weight="bold"
                style={{ color: colors.error }}
              />
            </View>
          </View>
        </Card>

        {/* Section F: Quick Action Buttons */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={() => router.push({ pathname: '/transactions/add', params: { type: 'expense' } })}
          >
            <View style={[styles.actionIconBg, { backgroundColor: colors.errorMuted }]}>
              <Plus size={18} color={colors.error} />
            </View>
            <Text variant="xs" weight="medium" align="center">
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={() => router.push({ pathname: '/transactions/add', params: { type: 'income' } })}
          >
            <View style={[styles.actionIconBg, { backgroundColor: colors.successMuted }]}>
              <ArrowDownLeft size={18} color={colors.success} />
            </View>
            <Text variant="xs" weight="medium" align="center">
              Income
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={() => router.push({ pathname: '/transactions/add', params: { type: 'transfer' } })}
          >
            <View style={[styles.actionIconBg, { backgroundColor: colors.secondaryMuted }]}>
              <ArrowLeftRight size={18} color={colors.secondary} />
            </View>
            <Text variant="xs" weight="medium" align="center">
              Transfer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/(tabs)/split')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: colors.primaryMuted }]}>
              <Users size={18} color={colors.primary} />
            </View>
            <Text variant="xs" weight="medium" align="center">
              Split
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section B: Salary & Allocation Card */}
        <Card elevated style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconHeadingRow}>
              <Wallet size={18} color={colors.primary} />
              <Text variant="base" weight="bold">
                Salary Overview
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Text variant="xs" color="primary" weight="semibold">
                Manage
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.salaryStatsRow}>
            <View style={styles.salaryStatItem}>
              <Text variant="xs" color="secondary">
                Base Monthly
              </Text>
              <CurrencyText amount={monthlySalary} variant="base" weight="bold" />
            </View>
            <View style={styles.salaryStatItem}>
              <Text variant="xs" color="secondary">
                Additional
              </Text>
              <CurrencyText amount={additionalIncome} variant="base" weight="bold" />
            </View>
            <View style={styles.salaryStatItem}>
              <Text variant="xs" color="secondary">
                Pay Date
              </Text>
              <Text variant="base" weight="bold">
                Day {metrics?.salaryDate ?? 1}
              </Text>
            </View>
          </View>
        </Card>

        {/* Section C: Expense Overview (Today, Week, Month) */}
        <View style={styles.timeframeExpenseRow}>
          <Card elevated style={styles.timeframeCard}>
            <Text variant="xs" color="secondary">
              Today
            </Text>
            <CurrencyText
              amount={metrics?.todayExpenses ?? 0}
              variant="base"
              weight="bold"
              style={styles.timeframeAmount}
            />
          </Card>
          <Card elevated style={styles.timeframeCard}>
            <Text variant="xs" color="secondary">
              This Week
            </Text>
            <CurrencyText
              amount={metrics?.thisWeekExpenses ?? 0}
              variant="base"
              weight="bold"
              style={styles.timeframeAmount}
            />
          </Card>
          <Card elevated style={styles.timeframeCard}>
            <Text variant="xs" color="secondary">
              This Month
            </Text>
            <CurrencyText
              amount={metrics?.thisMonthExpenses ?? 0}
              variant="base"
              weight="bold"
              style={styles.timeframeAmount}
            />
          </Card>
        </View>

        {/* Section D: Financial Analytics Chart */}
        <Card elevated style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconHeadingRow}>
              <TrendingUp size={18} color={colors.secondary} />
              <Text variant="base" weight="bold">
                Income vs Expenses
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/analytics')}>
              <Text variant="xs" color="secondary">
                View Full
              </Text>
            </TouchableOpacity>
          </View>
          <MonthlyBarChart data={metrics?.monthlyTrends || []} height={170} />
        </Card>

        {/* Category Breakdown (Top 4) */}
        {metrics?.categoryBreakdown && metrics.categoryBreakdown.length > 0 ? (
          <Card elevated style={styles.sectionCard}>
            <Text variant="base" weight="bold" style={{ marginBottom: Spacing.md }}>
              Category Breakdown
            </Text>
            {metrics.categoryBreakdown.slice(0, 4).map((cat, idx) => (
              <CategoryProgressRow
                key={idx}
                category={cat.categoryName}
                amount={cat.amount}
                percentage={cat.percentage}
                color={cat.color}
              />
            ))}
          </Card>
        ) : null}

        {/* Section E: Recent Transactions */}
        <View style={styles.recentTransactionsHeader}>
          <Text variant="base" weight="bold">
            Recent Transactions
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
            <Text variant="sm" color="primary" weight="medium">
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {metrics?.recentTransactions && metrics.recentTransactions.length > 0 ? (
          <View style={styles.transactionsList}>
            {metrics.recentTransactions.map((item) => {
              const isIncome = item.type === 'income';
              const isTransfer = item.type === 'transfer';
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/transactions/${item.id}`)}
                >
                  <Card style={styles.transactionCard}>
                    <View style={styles.transactionRow}>
                      <View
                        style={[
                          styles.transactionIconBg,
                          {
                            backgroundColor: isIncome
                              ? colors.successMuted
                              : isTransfer
                              ? colors.secondaryMuted
                              : colors.errorMuted,
                          },
                        ]}
                      >
                        {isIncome ? (
                          <ArrowDownLeft size={18} color={colors.success} />
                        ) : isTransfer ? (
                          <ArrowLeftRight size={18} color={colors.secondary} />
                        ) : (
                          <ArrowUpRight size={18} color={colors.error} />
                        )}
                      </View>

                      <View style={styles.transactionDetails}>
                        <Text variant="sm" weight="semibold" numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text variant="xs" color="secondary">
                          {item.category?.name || 'General'} • {item.date}
                        </Text>
                      </View>

                      <CurrencyText
                        amount={item.amount}
                        currency={profile?.currency || 'INR'}
                        variant="sm"
                        weight="bold"
                        style={{
                          color: isIncome
                            ? colors.success
                            : isTransfer
                            ? colors.secondary
                            : colors.mainText,
                        }}
                      />
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <EmptyState
            title="No Transactions Yet"
            description="Tap '+ Add Expense' or '+ Add Income' above to record your first transaction."
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
    marginBottom: Spacing.lg,
  },
  greetingSub: {
    letterSpacing: 1,
    marginBottom: 2,
  },
  userName: {
    letterSpacing: -0.5,
  },
  analyticsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  totalBalanceText: {
    marginVertical: Spacing.xs,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incomeCol: {
    flex: 1,
  },
  expenseCol: {
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    height: 36,
    marginHorizontal: Spacing.md,
  },
  statIconRow: {
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
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: 6,
  },
  actionIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  salaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  salaryStatItem: {
    flex: 1,
    gap: 4,
  },
  timeframeExpenseRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  timeframeCard: {
    flex: 1,
    padding: Spacing.md,
  },
  timeframeAmount: {
    marginTop: 4,
  },
  recentTransactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  transactionsList: {
    gap: Spacing.xs,
  },
  transactionCard: {
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  transactionDetails: {
    flex: 1,
    gap: 2,
  },
});

