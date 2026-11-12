import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Target, Plus, Calendar, CheckCircle2 } from 'lucide-react-native';
import { SavingsGoal, SupportedCurrency } from '../../types/database';
import { useAppTheme } from '../../store/themeStore';
import { Text, CurrencyText } from './Typography';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  currency?: SupportedCurrency;
  onPress?: () => void;
  onAddContribution?: () => void;
}

export const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({
  goal,
  currency = 'INR',
  onPress,
  onAddContribution,
}) => {
  const { colors, isDark } = useAppTheme();

  const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) : 0;
  const progressClamped = Math.min(Math.max(progress, 0), 1);
  const percentage = Math.round(progressClamped * 100);
  const isDone = goal.is_completed || progress >= 1;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isDone ? colors.success : colors.borderLight,
          borderWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleInfo}>
          <Text variant="md" weight="bold" numberOfLines={1}>
            {goal.name}
          </Text>
          {goal.target_date ? (
            <View style={styles.targetDateRow}>
              <Calendar size={12} color={colors.secondaryText} />
              <Text variant="xs" color="secondary">
                Target: {goal.target_date}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.rightHeader}>
          <Text
            variant="sm"
            weight="extrabold"
            style={{ color: isDone ? colors.positive : colors.primary }}
          >
            {percentage}%
          </Text>
          {onAddContribution && !isDone ? (
            <TouchableOpacity
              onPress={onAddContribution}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.addBtn,
                { backgroundColor: colors.primaryMuted },
              ]}
              accessibilityLabel="Add contribution"
            >
              <Plus size={14} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Progress Track */}
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
              backgroundColor: isDone ? colors.positive : colors.primary,
            },
          ]}
        />
      </View>

      {/* Amount Footer */}
      <View style={styles.footerRow}>
        <Text variant="xs" color="secondary">
          Saved: <Text variant="xs" weight="bold" color="main">{formatCurrency(goal.current_amount, currency)}</Text>
        </Text>
        <Text variant="xs" color="secondary">
          Goal: <Text variant="xs" weight="bold" color="main">{formatCurrency(goal.target_amount, currency)}</Text>
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
  titleInfo: {
    gap: 4,
    flex: 1,
  },
  targetDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
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
