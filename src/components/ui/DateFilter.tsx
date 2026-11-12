import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../../store/themeStore';
import { Text } from './Typography';
import { Spacing, BorderRadius } from '../../theme/tokens';

export type DateFilterOption = 'all' | 'this_month' | 'last_month' | 'this_year';

interface DateFilterProps {
  selected: DateFilterOption;
  onSelect: (option: DateFilterOption) => void;
  style?: ViewStyle;
}

const OPTIONS: { label: string; value: DateFilterOption }[] = [
  { label: 'All', value: 'all' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Year', value: 'this_year' },
];

export const DateFilter: React.FC<DateFilterProps> = ({
  selected,
  onSelect,
  style,
}) => {
  const { colors, isDark } = useAppTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, style]}
    >
      {OPTIONS.map((item) => {
        const isSelected = selected === item.value;
        return (
          <TouchableOpacity
            key={item.value}
            onPress={() => onSelect(item.value)}
            activeOpacity={0.7}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected
                  ? colors.primary
                  : colors.surface,
                borderColor: isSelected
                  ? colors.primary
                  : colors.border,
              },
            ]}
          >
            <Text
              variant="xs"
              weight={isSelected ? 'bold' : 'medium'}
              style={{
                color: isSelected ? colors.onPrimary : colors.secondaryText,
              }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
});

