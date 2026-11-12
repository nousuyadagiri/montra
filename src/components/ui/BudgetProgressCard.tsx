import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { CategoryIcon } from './CategoryIcon';
import { Text, CurrencyText } from './Typography';
import { SupportedCurrency } from '../../types/database';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';

interface BudgetProgressCardProps {
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  allocatedAmount: number;
  spentAmount: number;
  currency?: SupportedCurrency;
  onDelete?: () => void;
  onPress?: () => void;
}

export const BudgetProgressCard: React.FC<BudgetProgressCardProps> = ({
  categoryName,
  categoryIcon,
  categoryColor,
  allocatedAmount,
  spentAmount,
  currency = 'INR',
  onDelete,
  onPress,
}) => {
  const { colors, isDark } = useAppTheme();

  const progress = allocatedAmount > 0 ? (spentAmount / allocatedAmount) : 0;
  const progressClamped = Math.min(Math.max(progress, 0), 1);
  const percentage = Math.round(progress * 100);

  const remaining = allocatedAmount - spentAmount;
  const isOverBudget = spentAmount > allocatedAmount;
  const isWarning = progress >= 0.8 && !isOverBudget;

  let barColor = colors.positive;
  if (isOverBudget) {
    barColor = colors.negative;
  } else if (isWarning) {
    barColor = colors.warning;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isOverBudget ? colors.expense : colors.borderLight,
          borderWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.categoryInfo}>
          <CategoryIcon
            icon={categoryIcon}
            name={categoryName}
            color={categoryColor || barColor}
            size="md"
            shape="squircle"
          />
          <View style={styles.titleCol}>
            <Text variant="sm" weight="bold" numberOfLines={1}>
              {categoryName}
            </Text>
            <Text variant="xs" color="secondary">
              {isOverBudget ? (
                <Text variant="xs" style={{ color: colors.negative }}>
                  Over budget by {formatCurrency(Math.abs(remaining), currency)}
                </Text>
              ) : (
                `${formatCurrency(remaining, currency)} remaining`
              )}
            </Text>
          </View>
        </View>

        <View style={styles.rightAction}>
          <Text
            variant="sm"
            weight="extrabold"
            style={{ color: barColor }}
          >
            {percentage}%
          </Text>
          {onDelete ? (
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.deleteBtn}
              accessibilityLabel={`Delete ${categoryName} budget`}
            >
              <Trash2 size={16} color={colors.secondaryText} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Progress Bar Track */}
      <View
        style={[
          styles.track,
          { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${progressClamped * 100}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>

      {/* Bottom Spending Breakdown */}
      <View style={styles.footerRow}>
        <Text variant="xs" color="secondary">
          Spent: <Text variant="xs" weight="semibold" color="main">{formatCurrency(spentAmount, currency)}</Text>
        </Text>
        <Text variant="xs" color="secondary">
          Limit: <Text variant="xs" weight="semibold" color="main">{formatCurrency(allocatedAmount, currency)}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  titleCol: {
    gap: 2,
    flex: 1,
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  deleteBtn: {
    padding: Spacing.xs,
  },
  track: {
    height: 7,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
