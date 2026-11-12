import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StatusBar as RNStatusBar,
  useWindowDimensions,
  LayoutChangeEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image, ImageProps } from 'expo-image';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import {
  ChevronLeft,
  AlertCircle,
  LogIn,
  UserPlus,
} from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { Text } from '../ui';
import { Spacing, BorderRadius, Shadows } from '../../theme/tokens';

interface MontraMarkProps {
  size?: number;
  primaryColor?: string;
  onPrimaryColor?: string;
}

const MONTRA_BRAND_LOGO = require('../../../assets/images/brand-logo.png');

export function MontraMark({
  size = 32,
}: MontraMarkProps) {
  const { colors } = useAppTheme();
  const radius = Math.round(size * 0.3);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: '#090F1B',
      }}
    >
      <Image
        source={MONTRA_BRAND_LOGO}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        transition={120}
      />
    </View>
  );
}

export function AuthAmbientBackground() {
  const { width, height } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();
  const glowHeight = Math.min(height, 560);

  return (
    <View style={[styles.ambientLayer, { height: glowHeight }]} pointerEvents="none">
      <Svg width={width} height={glowHeight}>
        <Defs>
          <RadialGradient id="authGlowCenter" cx="50%" cy="22%" r="55%">
            <Stop
              offset="0%"
              stopColor={colors.accent}
              stopOpacity={isDark ? 0.16 : 0.11}
            />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="authGlowSecondary" cx="85%" cy="68%" r="48%">
            <Stop
              offset="0%"
              stopColor={colors.primary}
              stopOpacity={isDark ? 0.1 : 0.06}
            />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={glowHeight} fill="url(#authGlowCenter)" />
        <Rect x={0} y={0} width={width} height={glowHeight} fill="url(#authGlowSecondary)" />
      </Svg>
    </View>
  );
}

interface AuthModeTabsProps {
  activeTab: 'login' | 'register';
}

function AuthModeTabs({ activeTab }: AuthModeTabsProps) {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const trackBg = isDark ? colors.elevatedSurface : colors.background;
  const activeBg = isDark ? colors.primaryMuted : colors.surface;
  const activeBorder = isDark ? colors.accent : colors.border;

  const tabs: {
    id: 'login' | 'register';
    label: string;
    route: '/(auth)/login' | '/(auth)/register';
  }[] = [
    { id: 'login', label: 'Sign In', route: '/(auth)/login' },
    { id: 'register', label: 'Create Account', route: '/(auth)/register' },
  ];

  return (
    <View
      style={[
        styles.segmentedTrack,
        {
          backgroundColor: trackBg,
          borderColor: colors.borderLight,
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const iconColor = isActive ? colors.primary : colors.secondaryText;

        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.85}
            disabled={isActive}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              if (!isActive) {
                router.replace(tab.route);
              }
            }}
            style={[
              styles.segmentedTab,
              isActive
                ? {
                    backgroundColor: activeBg,
                    borderColor: activeBorder,
                    borderWidth: 1,
                    ...(isDark ? {} : Shadows.sm),
                  }
                : styles.segmentedTabInactive,
            ]}
          >
            {tab.id === 'login' ? (
              <LogIn size={14} color={iconColor} />
            ) : (
              <UserPlus size={14} color={iconColor} />
            )}
            <Text
              variant="xs"
              weight={isActive ? 'bold' : 'medium'}
              style={{
                color: isActive ? colors.mainText : colors.secondaryText,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface AuthShellProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  errorMessage?: string | null;
  icon?: React.ReactNode;
  imageSource?: ImageProps['source'];
  activeTab?: 'login' | 'register';
  compactSpacing?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  errorMessage,
  icon,
  imageSource,
  activeTab,
  compactSpacing = false,
  showBack = true,
  onBack,
  rightSlot,
  footer,
  children,
}: AuthShellProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const isCompactHeight = height < 720 || compactSpacing;
  const statusBarHeight = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 0;
  const topInset = Math.max(insets.top, statusBarHeight, Platform.OS === 'android' ? 16 : 10);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 10);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/welcome');
    }
  };

  const handleViewportLayout = (e: LayoutChangeEvent) => {
    setViewportHeight(e.nativeEvent.layout.height);
  };

  const handleContentSizeChange = (_w: number, h: number) => {
    setContentHeight(h);
  };

  // Lock scroll when content fits cleanly; automatically enable scrolling if keyboard or error banners expand height.
  const canScroll = isKeyboardVisible || (viewportHeight > 0 && contentHeight > viewportHeight + 4);
  const artSize = compactSpacing ? 56 : isCompactHeight ? 64 : 74;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AuthAmbientBackground />

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex1}
          onLayout={handleViewportLayout}
          onContentSizeChange={handleContentSizeChange}
          scrollEnabled={canScroll}
          bounces={false}
          overScrollMode="never"
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: topInset + (isCompactHeight ? Spacing.xs : Spacing.sm),
              paddingBottom: bottomInset + (isCompactHeight ? Spacing.xs : Spacing.sm),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Floating Minimal Top Bar */}
          <View style={styles.topBar}>
            {showBack ? (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleBack}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={[
                  styles.backBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <ChevronLeft size={20} color={colors.mainText} />
              </TouchableOpacity>
            ) : (
              <View style={styles.topBarPlaceholder} />
            )}

            {rightSlot !== undefined ? (
              rightSlot
            ) : (
              <View
                style={[
                  styles.brandPill,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <MontraMark size={22} />
                <Text variant="xs" weight="extrabold" style={styles.brandName}>
                  MONTRA
                </Text>
              </View>
            )}
          </View>

          {/* Centered Auth Stage */}
          <View
            style={[
              styles.centerStage,
              {
                paddingVertical: compactSpacing ? Spacing.xs : Spacing.sm,
              },
            ]}
          >
            {/* Unified Centered Hero */}
            <View
              style={[
                styles.heroBlock,
                { marginBottom: compactSpacing ? Spacing.sm + 2 : Spacing.md + 2 },
              ]}
            >
              {imageSource ? (
                <View
                  style={[
                    styles.artWrapper,
                    { marginBottom: compactSpacing ? Spacing.xs + 2 : Spacing.sm + 2 },
                  ]}
                >
                  <View
                    style={[
                      styles.artFrame,
                      {
                        width: artSize,
                        height: artSize,
                        borderRadius: compactSpacing ? 18 : 22,
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                      },
                      !isDark ? Shadows.md : Shadows.sm,
                    ]}
                  >
                    <Image
                      source={imageSource}
                      style={styles.fillImage}
                      contentFit="cover"
                      transition={200}
                    />
                  </View>
                  {icon ? (
                    <View
                      style={[
                        styles.floatingBadge,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                        Shadows.sm,
                      ]}
                    >
                      {icon}
                    </View>
                  ) : null}
                </View>
              ) : icon ? (
                <View
                  style={[
                    styles.heroIconBadge,
                    {
                      backgroundColor: colors.softAccent,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  {icon}
                </View>
              ) : null}

              {eyebrow ? (
                <View
                  style={[
                    styles.eyebrowPill,
                    {
                      backgroundColor: colors.softAccent,
                      borderColor: colors.borderLight,
                      marginBottom: compactSpacing ? 4 : 6,
                    },
                  ]}
                >
                  <Text
                    variant="xs"
                    weight="bold"
                    style={[styles.eyebrowText, { color: colors.accent }]}
                  >
                    {eyebrow}
                  </Text>
                </View>
              ) : null}

              <Text
                variant="2xl"
                weight="extrabold"
                align="center"
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[styles.title, compactSpacing && styles.titleCompact]}
              >
                {title}
              </Text>

              <Text
                variant="sm"
                color="secondary"
                align="center"
                numberOfLines={compactSpacing ? 1 : 2}
                style={styles.subtitle}
              >
                {subtitle}
              </Text>
            </View>

            {/* Elevated Modern Surface Card */}
            <View
              style={[
                styles.authCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  padding: compactSpacing ? Spacing.md + 2 : Spacing.lg + 2,
                },
                isDark ? Shadows.md : Shadows.lg,
              ]}
            >
              {activeTab ? (
                <View style={{ marginBottom: compactSpacing ? Spacing.sm + 2 : Spacing.md }}>
                  <AuthModeTabs activeTab={activeTab} />
                </View>
              ) : null}

              {errorMessage ? (
                <View
                  style={[
                    styles.errorBanner,
                    {
                      backgroundColor: colors.errorMuted,
                      borderColor: colors.error,
                    },
                  ]}
                >
                  <AlertCircle size={15} color={colors.error} style={{ marginTop: 1 }} />
                  <Text variant="xs" color="error" style={styles.errorText}>
                    {errorMessage}
                  </Text>
                </View>
              ) : null}

              <View style={styles.formBody}>{children}</View>
            </View>

            {/* Compact Footer Tucked Naturally Below Card */}
            {footer ? (
              <View
                style={[
                  styles.footerSlot,
                  { marginTop: compactSpacing ? Spacing.sm + 2 : Spacing.md + 2 },
                ]}
              >
                {footer}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  ambientLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg + 2,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 38,
  },
  topBarPlaceholder: {
    width: 38,
    height: 38,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    paddingVertical: 5,
    paddingLeft: 6,
    paddingRight: 11,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  brandName: {
    letterSpacing: 1.6,
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
  },
  heroBlock: {
    alignItems: 'center',
  },
  artWrapper: {
    position: 'relative',
  },
  artFrame: {
    borderWidth: 1.25,
    overflow: 'hidden',
  },
  floatingBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fillImage: {
    width: '100%',
    height: '100%',
  },
  heroIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  eyebrowPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  eyebrowText: {
    fontSize: 10,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.6,
    marginBottom: 2,
  },
  titleCompact: {
    fontSize: 23,
    lineHeight: 28,
  },
  subtitle: {
    lineHeight: 19,
    maxWidth: 300,
  },
  authCard: {
    width: '100%',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
  },
  segmentedTrack: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 4,
  },
  segmentedTab: {
    flex: 1,
    height: 36,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentedTabInactive: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs + 2,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm + 2,
  },
  errorText: {
    flex: 1,
    lineHeight: 17,
  },
  formBody: {
    width: '100%',
  },
  footerSlot: {
    alignItems: 'center',
  },
});
