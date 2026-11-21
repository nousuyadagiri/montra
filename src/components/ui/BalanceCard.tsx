import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { Text, Heading, CurrencyText } from './Typography';
import { SupportedCurrency } from '../../types/database';
import { Spacing, BorderRadius, Shadows } from '../../theme/tokens';
import { NEO_ACCENTS } from '../../theme/colors';
import { formatCurrency } from '../../utils/currency';

export interface BalanceCardProps {
  totalBalance: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  netSavings?: number;
  savingsRate?: number;
  currency?: SupportedCurrency;
  monthName?: string;
  onPressAnalytics?: () => void;
  showGoal?: boolean;
  targetAmount?: number;
  onPressGoal?: () => void;
  showMetricsStrip?: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  totalBalance,
  monthlyIncome = 0,
  monthlyExpenses = 0,
  netSavings = 0,
  savingsRate = 0,
  currency = 'INR',
  onPressAnalytics,
  showGoal = false,
  targetAmount,
  onPressGoal,
  showMetricsStrip = false,
}) => {
  const { colors, isDark, themePalette } = useAppTheme();
  const [hideBalance, setHideBalance] = useState(false);

  const isNeo = themePalette === 'neo-pistachio';
  // Obsidian dark hero card matching reference screen 1
  const cardBg = isNeo ? '#1C1C1E' : isDark ? '#1C1C1E' : '#141416';
  const cardBorder = isNeo ? '#2C2C32' : 'rgba(255, 255, 255, 0.08)';
  const textColor = '#FFFFFF';
  const subTextColor = 'rgba(255, 255, 255, 0.65)';
  const accentDotColor = isNeo ? NEO_ACCENTS.pistachio : colors.primary;
  const stripBg = isNeo ? '#26262B' : isDark ? colors.elevatedSurface : colors.background;

  const progressPct = Math.min(Math.max(savingsRate, 0), 100);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
        },
        Shadows.md,
      ]}
    >
      {/* Top Meta Bar */}
      <View style={styles.topRow}>
        <View style={styles.labelGroup}>
          <View style={[styles.statusDot, { backgroundColor: accentDotColor }]} />
          <Text variant="xs" weight="bold" style={[styles.label, { color: subTextColor }]}>
            TOTAL AVAILABLE BALANCE
          </Text>
          <TouchableOpacity
            onPress={() => setHideBalance(!hideBalance)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={hideBalance ? 'Show balance' : 'Hide balance'}
            style={styles.eyeBtn}
          >
            {hideBalance ? (
              <EyeOff size={14} color={subTextColor} />
            ) : (
              <Eye size={14} color={subTextColor} />
            )}
          </TouchableOpacity>
        </View>

        {onPressAnalytics ? (
          <TouchableOpacity
            onPress={onPressAnalytics}
            activeOpacity={0.8}
            style={styles.arrowCircleBtn}
            accessibilityLabel="View Analytics"
          >
            <ArrowUpRight
              size={16}
              color="#141416"
              strokeWidth={2.4}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Main Hero Balance Display */}
      <View style={styles.balanceRow}>
        {hideBalance ? (
          <Heading level={1} style={[styles.hiddenText, { color: textColor }]}>
            ••••••••
          </Heading>
        ) : (
          <CurrencyText
            amount={totalBalance}
            currency={currency}
            variant="3xl"
            weight="extrabold"
            style={[styles.balanceAmount, { color: textColor }]}
          />
        )}
        <View style={styles.subBalanceLine}>
          <Text variant="xs" style={{ color: subTextColor, fontSize: 11 }}>
            Net monthly liquidity
          </Text>
          <View style={[styles.neoRateBadge, { backgroundColor: 'rgba(203, 216, 126, 0.2)' }]}>
            <Text
              variant="xs"
              weight="bold"
              style={{
                color: NEO_ACCENTS.pistachio,
                fontSize: 11,
              }}
            >
              +{savingsRate}%
            </Text>
          </View>
        </View>
      </View>

      {/* Target Progress Bar Strip (Optional embedded mode) */}
      {showGoal ? (
        <TouchableOpacity
          activeOpacity={onPressGoal ? 0.75 : 1}
          onPress={onPressGoal}
          style={[styles.goalProgressBox, { backgroundColor: isNeo ? '#26262B' : '#222228' }]}
        >
          <View style={styles.goalHeaderRow}>
            <Text variant="xs" weight="medium" style={{ color: subTextColor, fontSize: 11 }}>
              Monthly Investment Goal
            </Text>
            <Text
              variant="xs"
              weight="bold"
              style={{
                color: isNeo ? NEO_ACCENTS.pistachio : '#4ADE80',
                fontSize: 11,
              }}
            >
              {progressPct}% to Target
            </Text>
          </View>
          <View style={[styles.goalTrack, { backgroundColor: isNeo ? '#36363E' : '#33333C' }]}>
            <View
              style={[
                styles.goalFill,
                {
                  width: `${Math.max(progressPct, 4)}%`,
                  backgroundColor: isNeo ? NEO_ACCENTS.pistachio : '#4ADE80',
                },
              ]}
            />
          </View>
          <View style={styles.goalAmountRow}>
            <Text variant="xs" weight="bold" style={{ color: textColor, fontSize: 11 }}>
              {formatCurrency(totalBalance, currency)}
            </Text>
            <Text variant="xs" style={{ color: subTextColor, fontSize: 10.5 }}>
              Target: {formatCurrency(targetAmount || Math.max(monthlyIncome, totalBalance * 1.5, 50000), currency)}
            </Text>
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Bottom 3-Column Performance Strip (Optional embedded mode) */}
      {showMetricsStrip ? (
        <View style={[styles.metricsStrip, { backgroundColor: stripBg }]}>
          {/* Income */}
          <View style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <View style={[styles.iconCircle, { backgroundColor: colors.successMuted }]}>
                <ArrowDownLeft size={11} color={colors.positive} strokeWidth={2.4} />
              </View>
              <Text variant="xs" weight="semibold" style={[styles.metricLabel, { color: subTextColor }]}>
                Income
              </Text>
            </View>
            <CurrencyText
              amount={monthlyIncome}
              currency={currency}
              variant="sm"
              weight="extrabold"
              style={{ color: colors.positive, marginTop: 2 }}
            />
          </View>

          <View style={[styles.stripDivider, { backgroundColor: isNeo ? '#383842' : colors.borderLight }]} />

          {/* Expenses */}
          <View style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <View style={[styles.iconCircle, { backgroundColor: colors.expenseMuted }]}>
                <ArrowUpRight size={11} color={colors.negative} strokeWidth={2.4} />
              </View>
              <Text variant="xs" weight="semibold" style={[styles.metricLabel, { color: subTextColor }]}>
                Expenses
              </Text>
            </View>
            <CurrencyText
              amount={monthlyExpenses}
              currency={currency}
              variant="sm"
              weight="extrabold"
              style={{ color: colors.negative, marginTop: 2 }}
            />
          </View>

          <View style={[styles.stripDivider, { backgroundColor: isNeo ? '#383842' : colors.borderLight }]} />

          {/* Savings */}
          <View style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <View style={[styles.iconCircle, { backgroundColor: isNeo ? 'rgba(203, 216, 126, 0.16)' : colors.primaryMuted }]}>
                <TrendingUp size={11} color={isNeo ? NEO_ACCENTS.pistachio : colors.primary} strokeWidth={2.4} />
              </View>
              <Text variant="xs" weight="semibold" style={[styles.metricLabel, { color: subTextColor }]}>
                Savings
              </Text>
            </View>
            <CurrencyText
              amount={netSavings}
              currency={currency}
              variant="sm"
              weight="extrabold"
              style={{
                color: netSavings >= 0 ? textColor : colors.negative,
                marginTop: 2,
              }}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
};

export interface InvestmentGoalCardProps {
  totalBalance: number;
  targetAmount?: number;
  savingsRate?: number;
  currency?: SupportedCurrency;
  onPress?: () => void;
}

export const InvestmentGoalCard: React.FC<InvestmentGoalCardProps> = ({
  totalBalance,
  targetAmount = 50000,
  savingsRate = 0,
  currency = 'INR',
  onPress,
}) => {
  const { colors, isDark, themePalette } = useAppTheme();
  const isNeo = themePalette === 'neo-pistachio';
  const progressPct = Math.min(Math.max(savingsRate, 0), 100);

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      style={[
        styles.standaloneGoalCard,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? colors.border : colors.borderLight,
        },
        !isDark ? Shadows.sm : undefined,
      ]}
    >
      <View style={styles.goalHeaderRow}>
        <Text variant="xs" weight="bold" style={{ color: colors.mainText, fontSize: 12 }}>
          Investment Goal
        </Text>
        <Text
          variant="xs"
          weight="bold"
          style={{
            color: isNeo ? '#7A8C1B' : colors.primary,
            fontSize: 12,
          }}
        >
          {progressPct}% to Target
        </Text>
      </View>

      <View style={[styles.goalTrack, { backgroundColor: isDark ? colors.elevatedSurface : '#F0F1F5' }]}>
        <View
          style={[
            styles.goalFill,
            {
              width: `${Math.max(progressPct, 4)}%`,
              backgroundColor: isNeo ? NEO_ACCENTS.pistachio : colors.primary,
            },
          ]}
        />
      </View>

      <View style={styles.goalAmountRow}>
        <Text variant="xs" weight="bold" style={{ color: colors.mainText, fontSize: 11.5 }}>
          {formatCurrency(totalBalance, currency)}
        </Text>
        <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
          Target: {formatCurrency(targetAmount, currency)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: Spacing.md + 4,
    marginBottom: Spacing.sm + 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs + 2,
  },
  arrowCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  neoRateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    letterSpacing: 0.8,
    fontSize: 10,
  },
  eyeBtn: {
    padding: 2,
  },
  balanceRow: {
    marginBottom: 2,
    marginTop: 2,
  },
  balanceAmount: {
    letterSpacing: -1,
  },
  subBalanceLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  hiddenText: {
    letterSpacing: 4,
    opacity: 0.5,
  },
  goalProgressBox: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 4,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm + 2,
    gap: 6,
  },
  standaloneGoalCard: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    marginBottom: Spacing.sm + 2,
    gap: 8,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.sm,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 11,
  },
  stripDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    marginHorizontal: Spacing.xs,
  },
});
