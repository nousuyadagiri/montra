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
import {
  Download,
  TrendingUp,
  Sparkles,
  PieChart,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';
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
  Header,
  IncomeExpenseChart,
  DemoDataBadge,
  LoadingState,
  ErrorState,
  CategoryIcon,
} from '../../components/ui';
import { Spacing, BorderRadius, Shadows } from '../../theme/tokens';
import { NEO_ACCENTS } from '../../theme/colors';
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
  const { colors, isDark, themePalette } = useAppTheme();
  const isNeo = themePalette === 'neo-pistachio';
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
  const currency: SupportedCurrency =
    ((isDemo ? demoProfile?.currency : profile?.currency) as SupportedCurrency) || 'INR';

  const totalIncome = activeSummary?.totalIncome || 0;
  const totalExpenses = activeSummary?.totalExpenses || 0;
  const netSavings = activeSummary?.netSavings || 0;
  const savingsRate = activeSummary?.savingsRate || 0;
  const dailyDays = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const dailyAvg = totalExpenses / dailyDays;
  const expenseRatio = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0;

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

  // Consistent High-Contrast Obsidian Theme for the Hero Summary Card
  const heroCardBg = '#141418';
  const heroCardBorder = 'rgba(255, 255, 255, 0.09)';
  const heroSubText = 'rgba(255, 255, 255, 0.7)';
  const heroMutedBorder = 'rgba(255, 255, 255, 0.1)';
  const heroEmerald = '#34D399';
  const heroCoral = '#FB7185';
  const heroPistachio = '#CBD87E';

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
          { paddingBottom: insets.bottom + 110 },
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
        {/* 1. Period Selector Tabs (Sleek Apple Segmented Control) */}
        <View
          style={[
            styles.periodTabs,
            {
              backgroundColor: isDark ? '#1C1C22' : '#EEF1F6',
              borderColor: isDark ? '#2A2A32' : '#E2E6ED',
            },
          ]}
        >
          {PERIODS.map((p) => {
            const isSelected = period === p.value;
            const activeBg = isDark ? '#2C2C38' : '#FFFFFF';
            const activeColor = isDark ? '#FFFFFF' : '#141416';

            return (
              <TouchableOpacity
                key={p.value}
                onPress={() => setPeriod(p.value)}
                activeOpacity={0.7}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isSelected ? activeBg : 'transparent',
                    borderColor: isSelected
                      ? isDark
                        ? '#3C3C4A'
                        : '#E2E6ED'
                      : 'transparent',
                    borderWidth: isSelected ? StyleSheet.hairlineWidth : 0,
                  },
                  isSelected && !isDark ? styles.activeTabShadow : undefined,
                ]}
              >
                <Text
                  variant="xs"
                  weight={isSelected ? 'bold' : 'medium'}
                  style={{
                    color: isSelected ? activeColor : colors.secondaryText,
                    fontSize: 12,
                  }}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. Hero Net Savings Card (Obsidian Executive Style - Crystal Clear Contrast) */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: heroCardBg,
              borderColor: heroCardBorder,
            },
            Shadows.md,
          ]}
        >
          {/* Header Row: Label & Savings Rate Pill */}
          <View style={styles.summaryTopRow}>
            <View>
              <Text variant="xs" weight="bold" style={[styles.summarySubLabel, { color: heroSubText }]}>
                NET SAVINGS ({period.toUpperCase()})
              </Text>
              <Text
                variant="2xl"
                weight="extrabold"
                style={{
                  color: netSavings >= 0 ? heroEmerald : heroCoral,
                  marginTop: 4,
                  fontSize: 27,
                  letterSpacing: -0.5,
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
                      ? 'rgba(52, 211, 153, 0.18)'
                      : 'rgba(251, 191, 36, 0.18)',
                },
              ]}
            >
              <Text
                variant="xs"
                weight="bold"
                style={{
                  color: savingsRate >= 50 ? heroEmerald : '#FBBF24',
                  fontSize: 12,
                }}
              >
                {savingsRate}% Saved
              </Text>
            </View>
          </View>

          {/* Embedded Savings Rate Progress Bar */}
          <View style={styles.savingsProgressSection}>
            <View style={[styles.savingsProgressTrack, { backgroundColor: heroMutedBorder }]}>
              <View
                style={[
                  styles.savingsProgressFill,
                  {
                    width: `${Math.min(Math.max(savingsRate, 4), 100)}%`,
                    backgroundColor: netSavings >= 0 ? heroEmerald : heroCoral,
                  },
                ]}
              />
            </View>
            <View style={styles.savingsProgressMeta}>
              <Text variant="xs" style={{ color: heroSubText, fontSize: 11 }}>
                {netSavings >= 0
                  ? `${savingsRate}% of total income retained as savings`
                  : 'Outflow exceeded total income for this period'}
              </Text>
              <Text
                variant="xs"
                weight="bold"
                style={{ color: netSavings >= 0 ? heroEmerald : heroCoral, fontSize: 11 }}
              >
                {netSavings >= 0 ? 'Surplus' : 'Deficit'}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: heroMutedBorder }]} />

          {/* 3-Column Metrics Strip: Income | Expenses | Daily Avg */}
          <View style={styles.inOutRow}>
            {/* 1. Income Column */}
            <View style={styles.inOutItem}>
              <View style={styles.iconDotRow}>
                <View style={[styles.miniDot, { backgroundColor: 'rgba(52, 211, 153, 0.18)' }]}>
                  <ArrowDownLeft size={12} color={heroEmerald} strokeWidth={2.4} />
                </View>
                <Text variant="xs" weight="semibold" style={{ color: heroSubText, fontSize: 11 }}>
                  Income
                </Text>
              </View>
              <Text variant="sm" weight="extrabold" style={{ color: heroEmerald, marginTop: 4, fontSize: 13 }}>
                +{formatCurrency(totalIncome, currency)}
              </Text>
            </View>

            <View style={[styles.vLine, { backgroundColor: heroMutedBorder }]} />

            {/* 2. Expenses Column */}
            <View style={styles.inOutItem}>
              <View style={styles.iconDotRow}>
                <View style={[styles.miniDot, { backgroundColor: 'rgba(251, 113, 133, 0.18)' }]}>
                  <ArrowUpRight size={12} color={heroCoral} strokeWidth={2.4} />
                </View>
                <Text variant="xs" weight="semibold" style={{ color: heroSubText, fontSize: 11 }}>
                  Expenses
                </Text>
              </View>
              <Text variant="sm" weight="extrabold" style={{ color: heroCoral, marginTop: 4, fontSize: 13 }}>
                -{formatCurrency(totalExpenses, currency)}
              </Text>
            </View>

            <View style={[styles.vLine, { backgroundColor: heroMutedBorder }]} />

            {/* 3. Daily Avg Column (Guaranteed 100% Crisp & High Contrast) */}
            <View style={styles.inOutItem}>
              <View style={styles.iconDotRow}>
                <View style={[styles.miniDot, { backgroundColor: 'rgba(203, 216, 126, 0.22)' }]}>
                  <TrendingUp size={12} color={heroPistachio} strokeWidth={2.4} />
                </View>
                <Text variant="xs" weight="semibold" style={{ color: heroSubText, fontSize: 11 }}>
                  Daily Avg
                </Text>
              </View>
              <Text variant="sm" weight="extrabold" style={{ color: '#FFFFFF', marginTop: 4, fontSize: 13 }}>
                {formatCurrency(dailyAvg, currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Executive KPI Health Strip */}
        <View style={styles.kpiRow}>
          {/* Savings Health */}
          <View
            style={[
              styles.kpiCard,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : colors.borderLight,
              },
              !isDark ? Shadows.sm : undefined,
            ]}
          >
            <View style={styles.kpiHeader}>
              <ShieldCheck size={14} color={savingsRate >= 50 ? colors.positive : colors.primary} />
              <Text variant="xs" color="secondary" style={styles.kpiLabel}>
                Savings Health
              </Text>
            </View>
            <Text
              variant="md"
              weight="extrabold"
              style={{
                color: savingsRate >= 50 ? colors.positive : colors.mainText,
                marginTop: 2,
              }}
            >
              {savingsRate}%
            </Text>
            <Text variant="xs" color="secondary" style={styles.kpiSub}>
              {savingsRate >= 50 ? 'Optimal' : savingsRate >= 20 ? 'Healthy' : 'Needs Focus'}
            </Text>
          </View>

          {/* Expense Ratio */}
          <View
            style={[
              styles.kpiCard,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : colors.borderLight,
              },
              !isDark ? Shadows.sm : undefined,
            ]}
          >
            <View style={styles.kpiHeader}>
              <PieChart size={14} color={colors.secondary} />
              <Text variant="xs" color="secondary" style={styles.kpiLabel}>
                Expense Ratio
              </Text>
            </View>
            <Text variant="md" weight="extrabold" style={{ color: colors.mainText, marginTop: 2 }}>
              {expenseRatio}%
            </Text>
            <Text variant="xs" color="secondary" style={styles.kpiSub}>
              of total inflow
            </Text>
          </View>

          {/* Daily Burn Rate */}
          <View
            style={[
              styles.kpiCard,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : colors.borderLight,
              },
              !isDark ? Shadows.sm : undefined,
            ]}
          >
            <View style={styles.kpiHeader}>
              <Zap size={14} color={colors.warning} />
              <Text variant="xs" color="secondary" style={styles.kpiLabel}>
                Daily Burn
              </Text>
            </View>
            <Text variant="md" weight="extrabold" style={{ color: colors.mainText, marginTop: 2 }}>
              {formatCurrency(dailyAvg, currency)}
            </Text>
            <Text variant="xs" color="secondary" style={styles.kpiSub}>
              per day avg
            </Text>
          </View>
        </View>

        {/* 4. Cash Flow Trends Chart Card */}
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
            <View style={styles.sectionTitleLeft}>
              <View style={[styles.sectionIconBadge, { backgroundColor: colors.primaryMuted }]}>
                <TrendingUp size={16} color={colors.primary} />
              </View>
              <View>
                <Text variant="sm" weight="bold">
                  Cash Flow Trends
                </Text>
                <Text variant="xs" color="secondary" style={{ fontSize: 11, marginTop: 1 }}>
                  Monthly comparison and savings trajectory
                </Text>
              </View>
            </View>

            <View style={[styles.trendBadge, { backgroundColor: colors.successMuted }]}>
              <Text variant="xs" weight="bold" style={{ color: colors.positive, fontSize: 11 }}>
                Net: +{formatCurrency(netSavings, currency)}
              </Text>
            </View>
          </View>

          <IncomeExpenseChart data={chartData} height={180} />
        </View>

        {/* 5. Category Spending Breakdown */}
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
              <View style={styles.sectionTitleLeft}>
                <View style={[styles.sectionIconBadge, { backgroundColor: colors.primaryMuted }]}>
                  <PieChart size={16} color={colors.primary} />
                </View>
                <View>
                  <Text variant="sm" weight="bold">
                    Category Spending Breakdown
                  </Text>
                  <Text variant="xs" color="secondary" style={{ fontSize: 11, marginTop: 1 }}>
                    Ranked by top expenditure
                  </Text>
                </View>
              </View>

              <View style={[styles.trendBadge, { backgroundColor: colors.expenseMuted }]}>
                <Text variant="xs" weight="bold" style={{ color: colors.negative, fontSize: 11 }}>
                  {formatCurrency(totalExpenses, currency)} Total
                </Text>
              </View>
            </View>

            <View style={styles.categoryList}>
              {categoryBreakdown.map((cat, idx) => (
                <View key={idx} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryNameRow}>
                      <View style={[styles.categoryIconCircle, { backgroundColor: `${cat.color}22` }]}>
                        <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                      </View>
                      <View>
                        <Text variant="sm" weight="bold">
                          {cat.categoryName}
                        </Text>
                        <Text variant="xs" color="secondary" style={{ fontSize: 10.5 }}>
                          Rank #{idx + 1} outflow
                        </Text>
                      </View>
                    </View>

                    <View style={styles.categoryAmountRow}>
                      <Text variant="sm" weight="extrabold">
                        {formatCurrency(cat.amount, currency)}
                      </Text>
                      <View style={[styles.categoryPctBadge, { backgroundColor: `${cat.color}1E` }]}>
                        <Text variant="xs" weight="bold" style={{ color: cat.color, fontSize: 11 }}>
                          {cat.percentage}%
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View
                    style={[
                      styles.categoryProgressTrack,
                      {
                        backgroundColor: isDark
                          ? colors.elevatedSurface
                          : '#EFF1F5',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.categoryProgressBar,
                        {
                          backgroundColor: cat.color,
                          width: `${Math.min(100, Math.max(5, cat.percentage))}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* 6. Smart Financial Insights */}
        <View style={styles.insightsSection}>
          <View style={styles.insightsHeader}>
            <Sparkles size={16} color={colors.primary} />
            <Text variant="sm" weight="bold">
              Smart Financial Insights
            </Text>
          </View>

          {/* Contextual Card 1: High Savings Rate */}
          <View
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
              <View style={styles.insightBadgeRow}>
                <View style={[styles.insightPill, { backgroundColor: colors.successMuted }]}>
                  <Text variant="xs" weight="bold" style={{ color: colors.positive, fontSize: 10.5 }}>
                    SAVINGS CHAMPION
                  </Text>
                </View>
              </View>
              <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
                {savingsRate}% Retained
              </Text>
            </View>
            <Text variant="xs" weight="bold" style={{ marginTop: 6, fontSize: 12.5 }}>
              Exceptional Savings Trajectory
            </Text>
            <Text variant="xs" color="secondary" style={{ lineHeight: 18, marginTop: 2, fontSize: 11.5 }}>
              You retained {formatCurrency(netSavings, currency)} of your earnings this period. Your savings rate
              of {savingsRate}% is far higher than the standard 20% savings rule.
            </Text>
          </View>

          {/* Contextual Card 2: Top Outflow Category */}
          {categoryBreakdown.length > 0 ? (
            <View
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
                <View style={styles.insightBadgeRow}>
                  <View style={[styles.insightPill, { backgroundColor: colors.expenseMuted }]}>
                    <Text variant="xs" weight="bold" style={{ color: colors.negative, fontSize: 10.5 }}>
                      TOP OUTFLOW
                    </Text>
                  </View>
                </View>
                <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
                  {categoryBreakdown[0].percentage}% of spend
                </Text>
              </View>
              <Text variant="xs" weight="bold" style={{ marginTop: 6, fontSize: 12.5 }}>
                {categoryBreakdown[0].categoryName} is Your Primary Expense
              </Text>
              <Text variant="xs" color="secondary" style={{ lineHeight: 18, marginTop: 2, fontSize: 11.5 }}>
                {formatCurrency(categoryBreakdown[0].amount, currency)} was allocated to{' '}
                {categoryBreakdown[0].categoryName}. Monitoring discretionary spending in this category will optimize your liquidity.
              </Text>
            </View>
          ) : null}

          {/* Contextual Card 3: Daily Pace */}
          <View
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
              <View style={styles.insightBadgeRow}>
                <View style={[styles.insightPill, { backgroundColor: colors.primaryMuted }]}>
                  <Text variant="xs" weight="bold" color="primary" style={{ fontSize: 10.5 }}>
                    SPENDING VELOCITY
                  </Text>
                </View>
              </View>
              <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
                Pace Control
              </Text>
            </View>
            <Text variant="xs" weight="bold" style={{ marginTop: 6, fontSize: 12.5 }}>
              Controlled Daily Average
            </Text>
            <Text variant="xs" color="secondary" style={{ lineHeight: 18, marginTop: 2, fontSize: 11.5 }}>
              Your average outflow is {formatCurrency(dailyAvg, currency)} per day. Continuing at this pace ensures
              consistent month-end surplus.
            </Text>
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
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
  },
  activeTabShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  summarySubLabel: {
    letterSpacing: 0.9,
    fontSize: 10.5,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  savingsRatePill: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: BorderRadius.full,
  },
  savingsProgressSection: {
    marginTop: Spacing.md,
    gap: 6,
  },
  savingsProgressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  savingsProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  savingsProgressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    height: 38,
    marginHorizontal: Spacing.sm + 2,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  kpiCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  kpiSub: {
    fontSize: 10.5,
    marginTop: 2,
  },
  sectionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: BorderRadius.full,
  },
  categoryList: {
    gap: Spacing.md,
  },
  categoryItem: {
    width: '100%',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryPctBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryProgressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  categoryProgressBar: {
    height: '100%',
    borderRadius: 3,
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
    alignItems: 'center',
  },
  insightBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insightPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
