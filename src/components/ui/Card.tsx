import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewProps,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useAppTheme } from '../../store/themeStore';
import { NEO_ACCENTS } from '../../theme/colors';
import { BorderRadius, Shadows, Spacing } from '../../theme/tokens';

export interface CardProps extends ViewProps {
  elevated?: boolean;
  onPress?: () => void;
  variant?: 'surface' | 'elevated' | 'outline' | 'pistachio' | 'lavender' | 'obsidian';
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevated = false,
  variant = 'surface',
  onPress,
  style,
  ...rest
}) => {
  const { colors, isDark } = useAppTheme();

  const getCardTheme = (): { bg: string; border: string; radius: number } => {
    switch (variant) {
      case 'pistachio':
        return {
          bg: NEO_ACCENTS.pistachio,
          border: 'rgba(0, 0, 0, 0.06)',
          radius: BorderRadius['2xl'],
        };
      case 'lavender':
        return {
          bg: NEO_ACCENTS.lavender,
          border: 'rgba(0, 0, 0, 0.06)',
          radius: BorderRadius['2xl'],
        };
      case 'obsidian':
        return {
          bg: isDark ? '#18181C' : NEO_ACCENTS.obsidian,
          border: isDark ? '#2A2A32' : 'rgba(255, 255, 255, 0.08)',
          radius: BorderRadius['2xl'],
        };
      case 'elevated':
        return {
          bg: colors.elevatedSurface,
          border: colors.borderLight,
          radius: BorderRadius.xl,
        };
      case 'outline':
        return {
          bg: 'transparent',
          border: colors.border,
          radius: BorderRadius.xl,
        };
      case 'surface':
      default:
        return {
          bg: elevated ? colors.elevatedSurface : colors.surface,
          border: isDark ? colors.border : colors.borderLight,
          radius: BorderRadius.xl,
        };
    }
  };

  const cardTheme = getCardTheme();

  const baseCardStyle: ViewStyle = {
    backgroundColor: cardTheme.bg,
    borderRadius: cardTheme.radius,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: cardTheme.border,
    ...(elevated && !isDark && variant === 'surface' ? Shadows.sm : {}),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[baseCardStyle, style]}
        {...(rest as any)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[baseCardStyle, style]} {...rest}>
      {children}
    </View>
  );
};
