import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useAppTheme } from '../../store/themeStore';
import { Typography as TypographyTokens } from '../../theme/tokens';
import { formatCurrency, SupportedCurrency } from '../../utils/currency';

interface TextProps extends RNTextProps {
  variant?: 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  color?: 'main' | 'secondary' | 'tertiary' | 'primary' | 'error' | 'success' | 'warning' | string;
  align?: 'left' | 'center' | 'right';
}

export const Text: React.FC<TextProps> = ({
  children,
  variant = 'base',
  weight = 'regular',
  color = 'main',
  align = 'left',
  style,
  ...props
}) => {
  const { colors } = useAppTheme();

  const getColor = () => {
    switch (color) {
      case 'main':
        return colors.mainText;
      case 'secondary':
        return colors.secondaryText;
      case 'tertiary':
        return colors.tertiaryText;
      case 'primary':
        return colors.primary;
      case 'error':
        return colors.error;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      default:
        return color;
    }
  };

  return (
    <RNText
      style={[
        {
          fontSize: TypographyTokens.sizes[variant],
          fontWeight: TypographyTokens.weights[weight],
          color: getColor(),
          textAlign: align,
          fontFamily: TypographyTokens.fontFamily,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

export const Heading: React.FC<Omit<TextProps, 'variant' | 'weight'> & { level?: 1 | 2 | 3 }> = ({
  level = 1,
  ...props
}) => {
  const sizeMap = {
    1: '2xl' as const,
    2: 'xl' as const,
    3: 'lg' as const,
  };
  return <Text variant={sizeMap[level]} weight="bold" {...props} />;
};

interface CurrencyTextProps extends Omit<TextProps, 'children'> {
  amount: number;
  currency?: SupportedCurrency;
  showDecimals?: boolean;
}

export const CurrencyText: React.FC<CurrencyTextProps> = ({
  amount,
  currency = 'INR',
  showDecimals = true,
  style,
  ...props
}) => {
  return (
    <Text
      style={[{ fontVariant: ['tabular-nums'] }, style]}
      {...props}
    >
      {formatCurrency(amount, currency, showDecimals)}
    </Text>
  );
};

