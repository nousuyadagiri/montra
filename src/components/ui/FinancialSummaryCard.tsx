import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { Text, CurrencyText } from './Typography';
import { SupportedCurrency } from '../../types/database';
import { Spacing, BorderRadius, Shadows } from '../../theme/tokens';

interface FinancialSummaryCardProps {
  income: number;
  expenses: number;
  netSavings: number;
  currency?: SupportedCurrency;
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  income,
  expenses,
  netSavings,
  currency = 'INR',
}) => {
  const { colors, isDark } = useAppTheme();

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
      <View style={styles.col}>
        <View style={styles.headerRow}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isDark ? 'rgba(74, 222, 128, 0.15)' : 'rgba(22, 163, 74, 0.12)' },
            ]}
          >
            <ArrowDownLeft size={14} color={colors.positive} />
          </View>
          <Text variant="xs" color="secondary" weight="semibold">
            INCOME
          </Text>
        </View>
        <CurrencyText
          amount={income}
          currency={currency}
          variant="md"
          weight="bold"
          style={{ color: colors.positive, marginTop: 4 }}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.col}>
        <View style={styles.headerRow}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(220, 38, 38, 0.12)' },
            ]}
          >
            <ArrowUpRight size={14} color={colors.negative} />
          </View>
          <Text variant="xs" color="secondary" weight="semibold">
            EXPENSES
          </Text>
        </View>
        <CurrencyText
          amount={expenses}
          currency={currency}
          variant="md"
          weight="bold"
          style={{ color: colors.negative, marginTop: 4 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  col: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: Spacing.md,
  },
});

