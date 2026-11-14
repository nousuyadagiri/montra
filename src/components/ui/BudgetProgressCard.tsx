import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { CategoryIcon } from './CategoryIcon';
import { Text } from './Typography';
import { SupportedCurrency } from '../../types/database';
import { Spacing, BorderRadius, Shadows } from '../../theme/tokens';
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

  const progress = allocatedAmount > 0 ? spentAmount / allocatedAmount : 0;
  const progressClamped = Math.min(Math.max(progress, 0), 1);
  const percentage = Math.round(progress * 100);

  const remaining = allocatedAmount - spentAmount;
  const isOverBudget = spentAmount > allocatedAmount;
  const isWarning = progress >= 0.8 && !isOverBudget;

  let barColor = colors.positive;
  let pillBg = colors.successMuted;
  if (isOverBudget) {
    barColor = colors.negative;
    pillBg = colors.expenseMuted;
  } else if (isWarning) {
    barColor = colors.warning;
    pillBg = colors.warningMuted;
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
          borderColor: isOverBudget ? colors.expense : isDark ? colors.border : colors.borderLight,
        },
        !isDark ? Shadows.sm : undefined,
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
            <Text variant="sm" weight="bold" numberOfLines={1} style={{ color: colors.mainText }}>
              {categoryName}
            </Text>
            <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
              {isOverBudget ? (
                <Text variant="xs" weight="bold" style={{ color: colors.negative }}>
                  Over budget by {formatCurrency(Math.abs(remaining), currency)}
                </Text>
              ) : (
                `${formatCurrency(remaining, currency)} remaining`
              )}
            </Text>
          </View>
        </View>

        <View style={styles.rightAction}>
          <View style={[styles.pctBadge, { backgroundColor: pillBg }]}>
            <Text variant="xs" weight="bold" style={{ color: barColor, fontSize: 11 }}>
              {percentage}%
            </Text>
          </View>

          {onDelete ? (
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.deleteBtn,
                {
                  backgroundColor: isDark ? colors.elevatedSurface : colors.background,
                  borderColor: isDark ? colors.border : colors.borderLight,
                },
              ]}
              accessibilityLabel={`Delete ${categoryName} budget`}
            >
              <Trash2 size={13} color={colors.error} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Progress Bar Track */}
      <View
        style={[
          styles.track,
          { backgroundColor: isDark ? colors.elevatedSurface : colors.borderLight },
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
        <Text variant="xs" color="secondary" style={{ fontSize: 11.5 }}>
          Spent: <Text variant="xs" weight="bold" style={{ color: colors.mainText }}>{formatCurrency(spentAmount, currency)}</Text>
        </Text>
        <Text variant="xs" color="secondary" style={{ fontSize: 11.5 }}>
          Limit: <Text variant="xs" weight="bold" style={{ color: colors.mainText }}>{formatCurrency(allocatedAmount, currency)}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.sm + 2,
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
    gap: 6,
  },
  pctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  track: {
    height: 6,
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
