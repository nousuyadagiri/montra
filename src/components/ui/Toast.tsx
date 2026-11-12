import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { ToastVariant, useToastStore } from '../../store/toastStore';
import { Text } from './Typography';
import { BorderRadius, Spacing } from '../../theme/tokens';

/** Global floating fintech notification banner rendered inside RootLayout */
export const ToastHost: React.FC = () => {
  const current = useToastStore((s) => s.current);
  const dismiss = useToastStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => {
      dismiss(current.id);
    }, current.durationMs);
    return () => clearTimeout(timer);
  }, [current, dismiss]);

  if (!current) return null;

  const variantConfig: Record<
    ToastVariant,
    { accent: string; badgeBg: string; border: string; Icon: typeof CheckCircle2 }
  > = {
    success: {
      accent: colors.positive,
      badgeBg: colors.successMuted,
      border: colors.positive,
      Icon: CheckCircle2,
    },
    error: {
      accent: colors.negative,
      badgeBg: colors.errorMuted,
      border: colors.negative,
      Icon: AlertCircle,
    },
    warning: {
      accent: colors.warning,
      badgeBg: colors.warningMuted,
      border: colors.warning,
      Icon: AlertTriangle,
    },
    info: {
      accent: colors.primary,
      badgeBg: colors.primaryMuted,
      border: colors.primary,
      Icon: Info,
    },
  };

  const cfg = variantConfig[current.variant];
  const StatusIcon = cfg.Icon;
  const topOffset = Math.max(insets.top, Platform.OS === 'android' ? 28 : 12) + Spacing.xs;

  return (
    <View style={[styles.portal, { top: topOffset }]} pointerEvents="box-none">
      <Animated.View
        key={current.id}
        entering={FadeInUp.springify().damping(18).stiffness(220)}
        exiting={FadeOutUp.duration(180)}
        style={[
          styles.banner,
          {
            backgroundColor: isDark ? colors.elevatedSurface : colors.surface,
            borderColor: isDark ? colors.border : colors.borderLight,
            borderLeftColor: cfg.border,
          },
        ]}
      >
        <View style={[styles.iconBadge, { backgroundColor: cfg.badgeBg }]}>
          <StatusIcon size={18} color={cfg.accent} strokeWidth={2.2} />
        </View>

        <View style={styles.textWrap}>
          {current.title ? (
            <Text variant="xs" weight="bold" numberOfLines={1} style={styles.title}>
              {current.title}
            </Text>
          ) : null}
          <Text variant="xs" color="secondary" numberOfLines={3} style={styles.message}>
            {current.message}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => dismiss(current.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.closeBtn}
          accessibilityLabel="Dismiss notification"
        >
          <X size={15} color={colors.tertiaryText} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  portal: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9999,
    alignItems: 'center',
  },
  banner: {
    width: '100%',
    maxWidth: 460,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderLeftWidth: 3.5,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    marginBottom: 1,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
  },
});

