import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAppTheme } from '../../store/themeStore';
import { BorderRadius, Spacing } from '../../theme/tokens';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.md,
  style,
}) => {
  const { colors, isDark } = useAppTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const bg = isDark ? '#1F2937' : '#E2E8F0';

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: bg,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const DashboardSkeleton: React.FC = () => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      {/* Top Greeting */}
      <View style={styles.headerRow}>
        <View style={{ gap: 6 }}>
          <Skeleton width={100} height={12} />
          <Skeleton width={160} height={28} />
        </View>
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>

      {/* Hero Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Skeleton width={140} height={14} />
        <Skeleton width={200} height={38} style={{ marginVertical: 12 }} />
        <Skeleton width="100%" height={1} style={{ marginVertical: 8 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Skeleton width={80} height={24} />
          <Skeleton width={80} height={24} />
          <Skeleton width={80} height={24} />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={{ flexDirection: 'row', gap: 12, marginVertical: 16 }}>
        <Skeleton width="22%" height={52} borderRadius={16} />
        <Skeleton width="22%" height={52} borderRadius={16} />
        <Skeleton width="22%" height={52} borderRadius={16} />
        <Skeleton width="22%" height={52} borderRadius={16} />
      </View>

      {/* Section */}
      <Skeleton width={180} height={20} style={{ marginVertical: 12 }} />
      <Skeleton width="100%" height={140} borderRadius={16} />
    </View>
  );
};

interface ListSkeletonProps {
  count?: number;
  cardHeight?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ count = 5, cardHeight = 68 }) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.listWrap}>
      {Array.from({ length: count }).map((_, idx) => (
        <View
          key={idx}
          style={[
            styles.listCard,
            {
              minHeight: cardHeight,
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <Skeleton width={38} height={38} borderRadius={12} />
          <View style={styles.listMid}>
            <Skeleton width={idx % 2 === 0 ? '58%' : '46%'} height={14} />
            <Skeleton width={idx % 2 === 0 ? '36%' : '30%'} height={11} />
          </View>
          <Skeleton width={68} height={16} borderRadius={6} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  card: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  listWrap: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  listMid: {
    flex: 1,
    gap: 7,
  },
});

