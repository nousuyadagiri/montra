import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useAppTheme } from '../../store/themeStore';
import { BorderRadius, Spacing, Typography } from '../../theme/tokens';
import { Text } from './Typography';
import { Eye, EyeOff } from 'lucide-react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  labelRight?: React.ReactNode;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  compact?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  prefix?: string;
  backgroundColor?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  labelRight,
  error,
  leftIcon,
  rightIcon,
  isPassword = false,
  compact = false,
  containerStyle,
  inputStyle,
  prefix,
  backgroundColor,
  secureTextEntry,
  onFocus,
  onBlur,
  ...rest
}) => {
  const { colors, isDark } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact, containerStyle]}>
      {label || labelRight ? (
        <View style={[styles.labelRow, compact && styles.labelRowCompact]}>
          {label ? (
            <Text
              variant={compact ? 'xs' : 'sm'}
              weight="medium"
              color="secondary"
              style={styles.label}
            >
              {label}
            </Text>
          ) : (
            <View />
          )}
          {labelRight || null}
        </View>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          compact && styles.inputContainerCompact,
          {
            backgroundColor: backgroundColor ?? (isDark ? colors.surface : colors.surface),
            borderColor: error
              ? colors.error
              : isFocused
              ? colors.primary
              : colors.border,
            borderWidth: isFocused ? 1.5 : 1,
          },
        ]}
      >
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}

        {prefix ? (
          <Text
            variant="md"
            weight="bold"
            color="main"
            style={{ marginRight: Spacing.xs, fontVariant: ['tabular-nums'] }}
          >
            {prefix}
          </Text>
        ) : null}

        <TextInput
          style={[
            styles.input,
            compact && styles.inputCompact,
            {
              color: colors.mainText,
              fontFamily: Typography.fontFamily,
            },
            inputStyle,
          ]}
          placeholderTextColor={colors.tertiaryText}
          secureTextEntry={isPassword ? !showPassword : secureTextEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.iconRight}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff size={20} color={colors.secondaryText} />
            ) : (
              <Eye size={20} color={colors.secondaryText} />
            )}
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.iconRight}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text variant="xs" color="error" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
    width: '100%',
  },
  wrapperCompact: {
    marginBottom: Spacing.sm + 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  labelRowCompact: {
    marginBottom: 3,
  },
  label: {
    flexShrink: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  inputContainerCompact: {
    minHeight: 44,
    borderRadius: BorderRadius.md + 2,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: Typography.sizes.base,
    paddingVertical: Spacing.sm,
  },
  inputCompact: {
    fontSize: 14,
    paddingVertical: 6,
  },
  iconLeft: {
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRight: {
    marginLeft: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});

