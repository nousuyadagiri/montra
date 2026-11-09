import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { Spacing } from '../../theme/tokens';
import { Text } from './Typography';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  style,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 12),
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        },
        style,
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.leftSlot}>
          {showBack ? (
            <TouchableOpacity
              onPress={handleBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[styles.backButton, { backgroundColor: colors.surface }]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={22} color={colors.mainText} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.titleCenter}>
          <Text variant="md" weight="bold" align="center" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="xs" color="secondary" align="center" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightSlot}>{rightAction || null}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  contentRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSlot: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  rightSlot: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});

