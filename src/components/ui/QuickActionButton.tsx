import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { Text } from './Typography';
import { BorderRadius } from '../../theme/tokens';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'positive' | 'negative' | 'secondary' | 'neutral';
}

interface ActionThemeSpec {
  iconColor: string;
  bgColor: string;
  borderColor: string;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon: Icon,
  label,
  onPress,
  variant = 'neutral',
}) => {
  const { colors, isDark } = useAppTheme();

  const getActionTheme = (): ActionThemeSpec => {
    switch (variant) {
      case 'negative': // Expense
        return {
          iconColor: isDark ? '#FB7185' : '#E11D48',
          bgColor: isDark ? 'rgba(244, 63, 94, 0.16)' : '#FFF1F2',
          borderColor: isDark ? 'rgba(244, 63, 94, 0.38)' : '#FECDD3',
        };
      case 'positive': // Income
        return {
          iconColor: isDark ? '#34D399' : '#059669',
          bgColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5',
          borderColor: isDark ? 'rgba(16, 185, 129, 0.38)' : '#A7F3D0',
        };
      case 'secondary': // Transfer
        return {
          iconColor: isDark ? '#818CF8' : '#4F46E5',
          bgColor: isDark ? 'rgba(99, 102, 241, 0.16)' : '#EEF2FF',
          borderColor: isDark ? 'rgba(99, 102, 241, 0.38)' : '#C7D2FE',
        };
      case 'primary': // Split
        return {
          iconColor: isDark ? '#38BDF8' : '#0284C7',
          bgColor: isDark ? 'rgba(56, 189, 248, 0.16)' : '#F0F9FF',
          borderColor: isDark ? 'rgba(56, 189, 248, 0.38)' : '#BAE6FD',
        };
      default:
        return {
          iconColor: colors.mainText,
          bgColor: isDark ? colors.elevatedSurface : colors.surface,
          borderColor: isDark ? colors.border : colors.borderLight,
        };
    }
  };

  const actionTheme = getActionTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: actionTheme.bgColor,
            borderColor: actionTheme.borderColor,
          },
        ]}
      >
        <Icon size={21} color={actionTheme.iconColor} strokeWidth={2.4} />
      </View>
      <Text
        variant="xs"
        weight="bold"
        numberOfLines={1}
        style={[styles.label, { color: colors.mainText }]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.xl, // 16px sleek squircle
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
    fontSize: 12,
    letterSpacing: -0.2,
  },
});
