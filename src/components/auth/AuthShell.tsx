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
import { ChevronLeft, AlertCircle } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { Text } from '../ui';
import { Spacing, BorderRadius, Shadows } from '../../theme/tokens';

interface MontraMarkProps {
  size?: number;
}

const MONTRA_BRAND_LOGO = require('../../../assets/images/brand-logo.png');

export function MontraMark({ size = 32 }: MontraMarkProps) {
  const { colors } = useAppTheme();
  const radius = Math.round(size * 0.3);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
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
  const glowHeight = Math.min(height, 520);

  return (
    <View style={[styles.ambientLayer, { height: glowHeight }]} pointerEvents="none">
      <Svg width={width} height={glowHeight}>
        <Defs>
          <RadialGradient id="authGlowCenter" cx="50%" cy="18%" r="58%">
            <Stop
              offset="0%"
              stopColor={colors.accent}
              stopOpacity={isDark ? 0.11 : 0.07}
            />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="authGlowSecondary" cx="88%" cy="54%" r="45%">
            <Stop
              offset="0%"
              stopColor={colors.primary}
              stopOpacity={isDark ? 0.07 : 0.04}
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
  const { colors } = useAppTheme();

  const tabs: {
    id: 'login' | 'register';
    label: string;
    route: '/(auth)/login' | '/(auth)/register';
  }[] = [
    { id: 'login', label: 'Sign In', route: '/(auth)/login' },
    { id: 'register', label: 'Create Account', route: '/(auth)/register' },
  ];

  return (
    <View style={[styles.underlineTabsRow, { borderBottomColor: colors.borderLight }]}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.75}
            disabled={isActive}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              if (!isActive) {
                router.replace(tab.route);
              }
            }}
            style={styles.underlineTab}
          >
            <Text
              variant="sm"
              weight={isActive ? 'bold' : 'medium'}
              style={{
                color: isActive ? colors.mainText : colors.secondaryText,
              }}
            >
              {tab.label}
            </Text>
            <View
              style={[
                styles.underlineIndicator,
                {
                  backgroundColor: isActive ? colors.primary : 'transparent',
                },
              ]}
            />
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

  // Keep layout locked to viewport when content fits; allow scrolling if keyboard or errors expand height
  const canScroll = isKeyboardVisible || (viewportHeight > 0 && contentHeight > viewportHeight + 4);
  const artSize = compactSpacing ? 46 : isCompactHeight ? 50 : 54;

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
          {/* Minimal Top Navigation Row */}
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
                    borderColor: isDark ? colors.border : colors.borderLight,
                  },
                ]}
              >
                <ChevronLeft size={19} color={colors.mainText} strokeWidth={2.2} />
              </TouchableOpacity>
            ) : (
              <View style={styles.topBarPlaceholder} />
            )}

            {rightSlot !== undefined ? (
              rightSlot
            ) : (
              <View style={styles.brandInline}>
                <MontraMark size={22} />
                <Text variant="xs" weight="bold" color="secondary" style={styles.brandName}>
                  MONTRA
                </Text>
              </View>
            )}
          </View>

          {/* Balanced Centered Stage */}
          <View
            style={[
              styles.centerStage,
              {
                paddingVertical: compactSpacing ? Spacing.xs : Spacing.sm,
              },
            ]}
          >
            {/* Editorial Split Hero Header */}
            <View
              style={[
                styles.heroRow,
                { marginBottom: compactSpacing ? Spacing.sm + 4 : Spacing.lg },
              ]}
            >
              <View style={styles.heroCopy}>
                {eyebrow ? (
                  <Text
                    variant="xs"
                    weight="bold"
                    style={[styles.eyebrowText, { color: colors.primary }]}
                  >
                    {eyebrow}
                  </Text>
                ) : null}

                <Text
                  variant="2xl"
                  weight="extrabold"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[styles.title, compactSpacing && styles.titleCompact]}
                >
                  {title}
                </Text>

                <Text
                  variant="sm"
                  color="secondary"
                  numberOfLines={2}
                  style={styles.subtitle}
                >
                  {subtitle}
                </Text>
              </View>

              {imageSource ? (
                <View
                  style={[
                    styles.artFrame,
                    {
                      width: artSize,
                      height: artSize,
                      borderRadius: compactSpacing ? 14 : 16,
                      borderColor: isDark ? colors.border : colors.borderLight,
                      backgroundColor: colors.surface,
                    },
                    !isDark ? Shadows.sm : undefined,
                  ]}
                >
                  <Image
                    source={imageSource}
                    style={styles.fillImage}
                    contentFit="cover"
                    transition={180}
                  />
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
            </View>

            {/* Clean Architectural Form Surface */}
            <View
              style={[
                styles.authCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDark ? colors.border : colors.borderLight,
                  paddingHorizontal: compactSpacing ? Spacing.md + 4 : Spacing.lg + 2,
                  paddingTop: activeTab
                    ? compactSpacing
                      ? Spacing.sm
                      : Spacing.sm + 4
                    : compactSpacing
                    ? Spacing.md + 2
                    : Spacing.lg + 2,
                  paddingBottom: compactSpacing ? Spacing.md + 2 : Spacing.lg + 2,
                },
                !isDark ? Shadows.sm : undefined,
              ]}
            >
              {activeTab ? (
                <View style={{ marginBottom: compactSpacing ? Spacing.sm + 4 : Spacing.md + 2 }}>
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

            {footer ? (
              <View
                style={[
                  styles.footerSlot,
                  { marginTop: compactSpacing ? Spacing.sm + 4 : Spacing.md + 4 },
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
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  brandName: {
    letterSpacing: 1.8,
    fontSize: 11,
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: 2,
  },
  heroCopy: {
    flex: 1,
  },
  eyebrowText: {
    fontSize: 10.5,
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    lineHeight: 33,
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  titleCompact: {
    fontSize: 24,
    lineHeight: 29,
    marginBottom: 2,
  },
  subtitle: {
    lineHeight: 19,
  },
  artFrame: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  fillImage: {
    width: '100%',
    height: '100%',
  },
  heroIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authCard: {
    width: '100%',
    borderRadius: BorderRadius['2xl'],
    borderWidth: StyleSheet.hairlineWidth,
  },
  underlineTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  underlineTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 2,
    position: 'relative',
  },
  underlineIndicator: {
    position: 'absolute',
    bottom: -0.5,
    left: Spacing.md,
    right: Spacing.md,
    height: 2,
    borderRadius: 2,
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
