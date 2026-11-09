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
import { BorderRadius, Shadows, Spacing } from '../../theme/tokens';

export interface CardProps extends ViewProps {
  elevated?: boolean;
  onPress?: () => void;
  variant?: 'surface' | 'elevated' | 'outline';
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

  const getBackgroundColor = () => {
    if (variant === 'elevated' || elevated) {
      return colors.elevatedSurface;
    }
    return colors.surface;
  };

  const baseCardStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: isDark ? colors.border : '#EDF2F7',
    ...(elevated && !isDark ? Shadows.md : {}),
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
