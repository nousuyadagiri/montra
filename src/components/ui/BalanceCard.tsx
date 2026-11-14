import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft, TrendingUp, Sparkles } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { Text, Heading, CurrencyText } from './Typography';
import { Badge } from './Badge';
import { SupportedCurrency } from '../../types/database';
import { Spacing, BorderRadius, Shadows } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';

interface BalanceCardProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netSavings: number;
  savingsRate: number;
  currency?: SupportedCurrency;
  monthName?: string;
  onPressAnalytics?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  netSavings,
  savingsRate,
  currency = 'INR',
  onPressAnalytics,
}) => {
  const { colors, isDark } = useAppTheme();
  const [hideBalance, setHideBalance] = useState(false);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? colors.border : colors.borderLight,
        },
        !isDark ? Shadows.sm : undefined,
      ]}
    >
      {/* Top Meta Bar */}
      <View style={styles.topRow}>
        <View style={styles.labelGroup}>
          <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
          <Text variant="xs" color="secondary" weight="bold" style={styles.label}>
            TOTAL AVAILABLE BALANCE
          </Text>
          <TouchableOpacity
            onPress={() => setHideBalance(!hideBalance)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={hideBalance ? 'Show balance' : 'Hide balance'}
            style={styles.eyeBtn}
          >
            {hideBalance ? (
              <EyeOff size={14} color={colors.secondaryText} />
            ) : (
              <Eye size={14} color={colors.secondaryText} />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onPressAnalytics}
          disabled={!onPressAnalytics}
          activeOpacity={0.7}
        >
          <Badge
            label={`${savingsRate}% Saved`}
            variant={netSavings >= 0 ? 'success' : 'error'}
            size="sm"
          />
        </TouchableOpacity>
      </View>

      {/* Main Hero Balance Display */}
      <View style={styles.balanceRow}>
        {hideBalance ? (
          <Heading level={1} style={styles.hiddenText}>
            ••••••••
          </Heading>
        ) : (
          <CurrencyText
            amount={totalBalance}
            currency={currency}
            variant="3xl"
            weight="extrabold"
            style={styles.balanceAmount}
          />
        )}
      </View>

      {/* Bottom 3-Column Performance Strip */}
      <View style={[styles.metricsStrip, { backgroundColor: isDark ? colors.elevatedSurface : colors.background }]}>
        {/* Income */}
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <View style={[styles.iconCircle, { backgroundColor: colors.successMuted }]}>
              <ArrowDownLeft size={11} color={colors.positive} strokeWidth={2.4} />
            </View>
            <Text variant="xs" color="secondary" weight="semibold" style={styles.metricLabel}>
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

        <View style={[styles.stripDivider, { backgroundColor: colors.borderLight }]} />

        {/* Expenses */}
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <View style={[styles.iconCircle, { backgroundColor: colors.expenseMuted }]}>
              <ArrowUpRight size={11} color={colors.negative} strokeWidth={2.4} />
            </View>
            <Text variant="xs" color="secondary" weight="semibold" style={styles.metricLabel}>
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

        <View style={[styles.stripDivider, { backgroundColor: colors.borderLight }]} />

        {/* Savings */}
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
              <TrendingUp size={11} color={colors.primary} strokeWidth={2.4} />
            </View>
            <Text variant="xs" color="secondary" weight="semibold" style={styles.metricLabel}>
              Savings
            </Text>
          </View>
          <CurrencyText
            amount={netSavings}
            currency={currency}
            variant="sm"
            weight="extrabold"
            style={{ color: netSavings >= 0 ? colors.mainText : colors.negative, marginTop: 2 }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: Spacing.md + 4,
    marginBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs + 2,
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
    fontSize: 10.5,
  },
  eyeBtn: {
    padding: 2,
  },
  balanceRow: {
    marginBottom: Spacing.md,
    marginTop: 2,
  },
  balanceAmount: {
    letterSpacing: -1,
  },
  hiddenText: {
    letterSpacing: 4,
    opacity: 0.5,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
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
