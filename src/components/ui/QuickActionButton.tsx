import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { Text } from './Typography';
import { Spacing, BorderRadius } from '../../theme/tokens';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'positive' | 'negative' | 'secondary' | 'neutral';
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon: Icon,
  label,
  onPress,
  variant = 'neutral',
}) => {
  const { colors, isDark } = useAppTheme();

  let iconColor = colors.mainText;
  let bgColor = colors.surface;

  switch (variant) {
    case 'primary':
      iconColor = colors.primary;
      bgColor = colors.primaryMuted;
      break;
    case 'positive':
      iconColor = colors.positive;
      bgColor = colors.successMuted;
      break;
    case 'negative':
      iconColor = colors.negative;
      bgColor = colors.expenseMuted;
      break;
    case 'secondary':
      iconColor = colors.secondary;
      bgColor = colors.secondaryMuted;
      break;
    default:
      iconColor = colors.mainText;
      bgColor = colors.elevatedSurface;
  }

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
            backgroundColor: bgColor,
            borderColor: colors.borderLight,
          },
        ]}
      >
        <Icon size={18} color={iconColor} strokeWidth={2.2} />
      </View>
      <Text variant="xs" color="secondary" weight="semibold" style={styles.label}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 0.1,
  },
});
