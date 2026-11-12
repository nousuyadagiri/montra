import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import {
  Home,
  ShoppingBag,
  Utensils,
  Car,
  Zap,
  Tag,
  Wifi,
  Film,
  HeartPulse,
  Wallet,
  Briefcase,
  PiggyBank,
  ArrowLeftRight,
  TrendingUp,
  CreditCard,
  Layers,
  LucideIcon,
} from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { BorderRadius } from '../../theme/tokens';

const ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  'shopping-bag': ShoppingBag,
  shopping: ShoppingBag,
  groceries: ShoppingBag,
  utensils: Utensils,
  food: Utensils,
  dining: Utensils,
  car: Car,
  transport: Car,
  transportation: Car,
  zap: Zap,
  electricity: Zap,
  utilities: Zap,
  tag: Tag,
  wifi: Wifi,
  internet: Wifi,
  film: Film,
  entertainment: Film,
  'heart-pulse': HeartPulse,
  health: HeartPulse,
  fitness: HeartPulse,
  wallet: Wallet,
  salary: Wallet,
  briefcase: Briefcase,
  freelance: Briefcase,
  business: Briefcase,
  'piggy-bank': PiggyBank,
  savings: PiggyBank,
  transfer: ArrowLeftRight,
  investments: TrendingUp,
  credit: CreditCard,
};

interface CategoryIconProps {
  icon?: string;
  name?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'squircle';
  style?: ViewStyle;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  icon,
  name,
  color,
  size = 'md',
  shape = 'squircle',
  style,
}) => {
  const { colors, isDark } = useAppTheme();

  // Resolve icon
  const key = (icon || name || '').toLowerCase().trim();
  const IconComponent = ICON_MAP[key] || Layers;

  // Resolve compact dimensions
  let containerSize = 36;
  let iconSize = 17;

  if (size === 'sm') {
    containerSize = 28;
    iconSize = 14;
  } else if (size === 'lg') {
    containerSize = 44;
    iconSize = 22;
  }

  const iconColor = color || colors.primary;
  // Refined soft translucent tint
  const bg = color
    ? (isDark ? `${color}1F` : `${color}14`)
    : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)');

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: shape === 'circle' ? containerSize / 2 : BorderRadius.md,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      <IconComponent size={iconSize} color={iconColor} strokeWidth={2.2} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
