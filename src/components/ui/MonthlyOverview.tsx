import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { Text } from './Typography';
import { Spacing, BorderRadius } from '../../theme/tokens';

interface MonthlyOverviewProps {
  currentDate?: Date;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onPressToday?: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MonthlyOverview: React.FC<MonthlyOverviewProps> = ({
  currentDate = new Date(),
  onPrevMonth,
  onNextMonth,
  onPressToday,
}) => {
  const { colors } = useAppTheme();

  const monthName = MONTH_NAMES[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPrevMonth}
        disabled={!onPrevMonth}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.arrowBtn}
        accessibilityLabel="Previous month"
      >
        <ChevronLeft size={16} color={colors.secondaryText} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onPressToday}
        style={styles.labelGroup}
        activeOpacity={0.7}
      >
        <Calendar size={13} color={colors.primary} />
        <Text variant="xs" weight="bold" style={styles.monthText}>
          {monthName} {year}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onNextMonth}
        disabled={!onNextMonth}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.arrowBtn}
        accessibilityLabel="Next month"
      >
        <ChevronRight size={16} color={colors.secondaryText} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'center',
  },
  arrowBtn: {
    padding: 3,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
  },
  monthText: {
    fontSize: 12,
    letterSpacing: -0.2,
  },
});
