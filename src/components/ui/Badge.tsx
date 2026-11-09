import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../../store/themeStore';
import { BorderRadius, Spacing } from '../../theme/tokens';
import { Text } from './Typography';

export type BadgeVariant = 'success' | 'error' | 'warning' | 'primary' | 'secondary' | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  icon,
  style,
}) => {
  const { colors } = useAppTheme();

  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.successMuted, text: colors.success };
      case 'error':
        return { bg: colors.errorMuted, text: colors.error };
      case 'warning':
        return { bg: colors.warningMuted, text: colors.warning };
      case 'primary':
        return { bg: colors.primaryMuted, text: colors.primary };
      case 'secondary':
        return { bg: colors.secondaryMuted, text: colors.secondary };
      case 'neutral':
      default:
        return { bg: colors.border, text: colors.secondaryText };
    }
  };

  const { bg, text } = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingVertical: size === 'sm' ? Spacing.xxs : Spacing.xs,
          paddingHorizontal: size === 'sm' ? Spacing.xs : Spacing.sm,
        },
        style,
      ]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text
        variant={size === 'sm' ? 'xs' : 'sm'}
        weight="semibold"
        style={{ color: text }}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
});

