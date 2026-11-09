import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useAppTheme } from '../../store/themeStore';
import { BorderRadius, Spacing, Typography } from '../../theme/tokens';
import { Text } from './Typography';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
  onPress?: (e?: any) => void | Promise<any>;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = true,
  buttonStyle,
  textStyle,
  onPress,
  accessibilityLabel,
}) => {
  const { colors, isDark } = useAppTheme();

  const getContainerStyle = (): ViewStyle => {
    let bg = colors.primary;
    let borderColor = 'transparent';
    let borderWidth = 0;

    switch (variant) {
      case 'primary':
        bg = colors.primary;
        break;
      case 'secondary':
        bg = colors.secondary;
        break;
      case 'outline':
        bg = 'transparent';
        borderColor = colors.border;
        borderWidth = 1.5;
        break;
      case 'ghost':
        bg = 'transparent';
        break;
      case 'danger':
        bg = colors.error;
        break;
    }

    if (disabled || loading) {
      bg = isDark ? '#1E293B' : '#E2E8F0';
      borderColor = 'transparent';
    }

    const paddingVertical = size === 'sm' ? Spacing.sm : size === 'lg' ? Spacing.lg : Spacing.md;
    const paddingHorizontal = size === 'sm' ? Spacing.md : size === 'lg' ? Spacing.xxl : Spacing.xl;
    const minHeight = size === 'sm' ? 36 : size === 'lg' ? 54 : 46;

    return {
      backgroundColor: bg,
      borderColor,
      borderWidth,
      borderRadius: BorderRadius.lg,
      paddingVertical,
      paddingHorizontal,
      minHeight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
      opacity: disabled && !loading ? 0.6 : 1,
    };
  };

  const getTextColor = (): string => {
    if (disabled && !loading) {
      return colors.secondaryText;
    }
    switch (variant) {
      case 'primary':
        return isDark ? '#0B0F14' : '#FFFFFF';
      case 'secondary':
        return '#FFFFFF';
      case 'outline':
        return colors.mainText;
      case 'ghost':
        return colors.mainText;
      case 'danger':
        return '#FFFFFF';
      default:
        return '#FFFFFF';
    }
  };

  const fontSize = size === 'sm' ? 'sm' : size === 'lg' ? 'md' : 'base';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled || loading}
      onPress={onPress}
      style={[getContainerStyle(), buttonStyle]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon ? <View style={styles.leftIconContainer}>{leftIcon}</View> : null}
          <Text
            variant={fontSize}
            weight="semibold"
            style={[{ color: getTextColor() }, textStyle]}
          >
            {title}
          </Text>
          {rightIcon ? <View style={styles.rightIconContainer}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconContainer: {
    marginRight: Spacing.sm,
  },
  rightIconContainer: {
    marginLeft: Spacing.sm,
  },
});
