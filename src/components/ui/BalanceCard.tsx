import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react-native';
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
          borderColor: colors.border,
        },
        Shadows.sm,
      ]}
    >
      {/* Top Meta Row */}
      <View style={styles.topRow}>
        <View style={styles.labelGroup}>
          <Text variant="xs" color="secondary" weight="semibold" style={styles.label}>
            TOTAL AVAILABLE BALANCE
          </Text>
          <TouchableOpacity
            onPress={() => setHideBalance(!hideBalance)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={hideBalance ? 'Show balance' : 'Hide balance'}
          >
            {hideBalance ? (
              <EyeOff size={14} color={colors.secondaryText} />
            ) : (
              <Eye size={14} color={colors.secondaryText} />
            )}
          </TouchableOpacity>
        </View>

        <Badge
          label={`${savingsRate}% Saved`}
          variant={netSavings >= 0 ? 'success' : 'error'}
          size="sm"
        />
      </View>

      {/* Main Balance Display */}
      <View style={styles.balanceRow}>
        {hideBalance ? (
          <Heading level={1} style={styles.hiddenText}>
            ••••••••
          </Heading>
        ) : (
          <CurrencyText
            amount={totalBalance}
            currency={currency}
            variant="2xl"
            weight="extrabold"
            style={styles.balanceAmount}
          />
        )}
      </View>

      {/* Subtle Separator */}
      <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

      {/* Bottom Income & Expense Metrics */}
      <View style={styles.metricsRow}>
        {/* Income */}
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <View
              style={[
                styles.iconDot,
                { backgroundColor: colors.successMuted },
              ]}
            >
              <ArrowDownLeft size={12} color={colors.positive} />
            </View>
            <Text variant="xs" color="secondary" weight="medium">
              Income
            </Text>
          </View>
          <CurrencyText
            amount={monthlyIncome}
            currency={currency}
            variant="sm"
            weight="bold"
            style={{ color: colors.positive, marginTop: 2 }}
          />
        </View>

        <View style={[styles.verticalDivider, { backgroundColor: colors.borderLight }]} />

        {/* Expenses */}
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <View
              style={[
                styles.iconDot,
                { backgroundColor: colors.expenseMuted },
              ]}
            >
              <ArrowUpRight size={12} color={colors.negative} />
            </View>
            <Text variant="xs" color="secondary" weight="medium">
              Expenses
            </Text>
          </View>
          <CurrencyText
            amount={monthlyExpenses}
            currency={currency}
            variant="sm"
            weight="bold"
            style={{ color: colors.negative, marginTop: 2 }}
          />
        </View>

        <View style={[styles.verticalDivider, { backgroundColor: colors.borderLight }]} />

        {/* Net Savings */}
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <View
              style={[
                styles.iconDot,
                { backgroundColor: colors.primaryMuted },
              ]}
            >
              <TrendingUp size={12} color={colors.primary} />
            </View>
            <Text variant="xs" color="secondary" weight="medium">
              Savings
            </Text>
          </View>
          <CurrencyText
            amount={netSavings}
            currency={currency}
            variant="sm"
            weight="bold"
            style={{ color: netSavings >= 0 ? colors.mainText : colors.negative, marginTop: 2 }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    letterSpacing: 0.8,
    fontSize: 10,
  },
  balanceRow: {
    marginVertical: 2,
  },
  balanceAmount: {
    letterSpacing: -0.6,
  },
  hiddenText: {
    fontSize: 28,
    letterSpacing: 4,
    height: 38,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    marginHorizontal: Spacing.xs,
  },
});
