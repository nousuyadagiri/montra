import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Target,
  Plus,
  Calendar,
  ShieldCheck,
  Plane,
  Laptop,
  Car,
  Home,
  PiggyBank,
  Check,
} from 'lucide-react-native';
import { SavingsGoal, SupportedCurrency } from '../../types/database';
import { useAppTheme } from '../../store/themeStore';
import { Text } from './Typography';
import { Spacing, BorderRadius, Shadows } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  currency?: SupportedCurrency;
  onPress?: () => void;
  onAddContribution?: () => void;
}

const getGoalCategoryConfig = (category: string | undefined, name: string | undefined, isDark: boolean) => {
  const combined = `${category || ''} ${name || ''}`.toLowerCase();

  if (combined.includes('emergency') || combined.includes('fund') || combined.includes('safety')) {
    return {
      Icon: ShieldCheck,
      color: '#10B981',
      bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
    };
  }
  if (combined.includes('travel') || combined.includes('trip') || combined.includes('vacation') || combined.includes('japan') || combined.includes('flight')) {
    return {
      Icon: Plane,
      color: '#8B5CF6',
      bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF',
    };
  }
  if (combined.includes('macbook') || combined.includes('laptop') || combined.includes('gadget') || combined.includes('phone') || combined.includes('tech')) {
    return {
      Icon: Laptop,
      color: '#0284C7',
      bg: isDark ? 'rgba(2, 132, 199, 0.15)' : '#F0F9FF',
    };
  }
  if (combined.includes('vehicle') || combined.includes('car') || combined.includes('bike')) {
    return {
      Icon: Car,
      color: '#F59E0B',
      bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
    };
  }
  if (combined.includes('home') || combined.includes('property') || combined.includes('house') || combined.includes('flat')) {
    return {
      Icon: Home,
      color: '#3B82F6',
      bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
    };
  }
  if (combined.includes('retire') || combined.includes('saving') || combined.includes('invest')) {
    return {
      Icon: PiggyBank,
      color: '#059669',
      bg: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5',
    };
  }

  return {
    Icon: Target,
    color: '#6366F1',
    bg: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
  };
};

const formatTargetDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({
  goal,
  currency = 'INR',
  onPress,
  onAddContribution,
}) => {
  const { colors, isDark } = useAppTheme();

  const progress = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
  const progressClamped = Math.min(Math.max(progress, 0), 1);
  const percentage = Math.round(progressClamped * 100);
  const isDone = goal.is_completed || progress >= 1;

  const cfg = getGoalCategoryConfig(goal.category, goal.name, isDark);
  const IconComp = cfg.Icon;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isDone ? colors.success : isDark ? colors.border : colors.borderLight,
        },
        !isDark ? Shadows.sm : undefined,
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
          <IconComp size={20} color={cfg.color} strokeWidth={2.2} />
        </View>

        <View style={styles.titleInfo}>
          <Text variant="sm" weight="bold" numberOfLines={1} style={{ color: colors.mainText }}>
            {goal.name}
          </Text>
          {goal.target_date ? (
            <View style={styles.targetDateRow}>
              <Calendar size={11} color={colors.secondaryText} />
              <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
                Target: {formatTargetDate(goal.target_date)}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.rightHeader}>
          <View
            style={[
              styles.pctBadge,
              {
                backgroundColor: isDone ? colors.successMuted : cfg.bg,
              },
            ]}
          >
            {isDone && <Check size={11} color={colors.positive} strokeWidth={2.5} style={{ marginRight: 2 }} />}
            <Text
              variant="xs"
              weight="bold"
              style={{ color: isDone ? colors.positive : cfg.color, fontSize: 11 }}
            >
              {isDone ? 'Completed' : `${percentage}%`}
            </Text>
          </View>

          {onAddContribution && !isDone ? (
            <TouchableOpacity
              onPress={onAddContribution}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.addBtn,
                {
                  backgroundColor: isDark ? colors.elevatedSurface : colors.background,
                  borderColor: isDark ? colors.border : colors.borderLight,
                },
              ]}
              accessibilityLabel="Add contribution"
            >
              <Plus size={13} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Progress Track */}
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
              backgroundColor: isDone ? colors.positive : cfg.color,
            },
          ]}
        />
      </View>

      {/* Amount Footer */}
      <View style={styles.footerRow}>
        <Text variant="xs" color="secondary" style={{ fontSize: 11.5 }}>
          Saved: <Text variant="xs" weight="bold" style={{ color: colors.mainText }}>{formatCurrency(goal.current_amount, currency)}</Text>
        </Text>
        <Text variant="xs" color="secondary" style={{ fontSize: 11.5 }}>
          Goal: <Text variant="xs" weight="bold" style={{ color: colors.mainText }}>{formatCurrency(goal.target_amount, currency)}</Text>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  titleInfo: {
    flex: 1,
    gap: 2,
  },
  targetDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pctBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
