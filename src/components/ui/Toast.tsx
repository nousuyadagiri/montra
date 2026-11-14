import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import {
  Check,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  X,
} from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { ToastVariant, useToastStore } from '../../store/toastStore';
import { Text } from './Typography';
import { BorderRadius, Spacing } from '../../theme/tokens';

/** Global minimalist floating capsule notification banner */
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
    {
      accent: string;
      iconBg: string;
      Icon: typeof Check;
    }
  > = {
    success: {
      accent: '#10B981',
      iconBg: isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.12)',
      Icon: Check,
    },
    error: {
      accent: '#F43F5E',
      iconBg: isDark ? 'rgba(244, 63, 94, 0.16)' : 'rgba(244, 63, 94, 0.12)',
      Icon: AlertCircle,
    },
    warning: {
      accent: '#F59E0B',
      iconBg: isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245, 158, 11, 0.12)',
      Icon: AlertTriangle,
    },
    info: {
      accent: colors.primary || '#6366F1',
      iconBg: isDark ? 'rgba(99, 102, 241, 0.16)' : 'rgba(99, 102, 241, 0.12)',
      Icon: Sparkles,
    },
  };

  const cfg = variantConfig[current.variant];
  const StatusIcon = cfg.Icon;
  const topOffset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 12) + Spacing.sm;

  // Determine if title should be shown separately
  const showTitle = Boolean(
    current.title &&
    current.title.trim() !== '' &&
    current.title.toLowerCase() !== current.message.toLowerCase()
  );

  return (
    <View style={[styles.portal, { top: topOffset }]} pointerEvents="box-none">
      <Animated.View
        key={current.id}
        entering={FadeInUp.springify().damping(20).mass(0.6).stiffness(280)}
        exiting={FadeOutUp.duration(150)}
        style={[
          styles.pillWrapper,
          {
            shadowColor: '#000000',
            shadowOpacity: isDark ? 0.45 : 0.10,
          },
        ]}
      >
        <Pressable
          onPress={() => dismiss(current.id)}
          style={[
            styles.pill,
            {
              backgroundColor: isDark ? '#141418' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.06)' }}
        >
          {/* Minimalist Status Icon Pod */}
          <View style={[styles.iconPod, { backgroundColor: cfg.iconBg }]}>
            <StatusIcon size={14} color={cfg.accent} strokeWidth={2.8} />
          </View>

          {/* Minimalist Typography */}
          <View style={styles.textWrap}>
            {showTitle ? (
              <Text
                variant="xs"
                weight="bold"
                numberOfLines={1}
                style={[styles.title, { color: isDark ? '#F4F4F5' : '#09090B' }]}
              >
                {current.title}
              </Text>
            ) : null}
            <Text
              variant="xs"
              numberOfLines={2}
              style={[
                styles.message,
                {
                  color: isDark
                    ? showTitle
                      ? '#A1A1AA'
                      : '#F4F4F5'
                    : showTitle
                    ? '#71717A'
                    : '#18181B',
                  fontWeight: showTitle ? '400' : '600',
                },
              ]}
            >
              {current.message}
            </Text>
          </View>

          {/* Micro Dismiss Button */}
          <TouchableOpacity
            onPress={() => dismiss(current.id)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={[
              styles.dismissBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.04)',
              },
            ]}
            accessibilityLabel="Dismiss"
          >
            <X size={11} color={isDark ? '#A1A1AA' : '#71717A'} strokeWidth={2.4} />
          </TouchableOpacity>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  portal: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  pillWrapper: {
    maxWidth: 380,
    minWidth: 200,
    alignSelf: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  iconPod: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flexShrink: 1,
    justifyContent: 'center',
    paddingRight: 2,
  },
  title: {
    fontSize: 12.5,
    letterSpacing: -0.2,
    marginBottom: 1,
  },
  message: {
    fontSize: 12,
    lineHeight: 15,
  },
  dismissBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});
