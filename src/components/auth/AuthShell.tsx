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
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image, ImageProps } from 'expo-image';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { AlertCircle } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { Text } from '../ui';
import { Spacing, BorderRadius } from '../../theme/tokens';

const MONTRA_BRAND_LOGO = require('../../../assets/images/brand-logo.png');

export function MontraMark({ size = 28 }: { size?: number }) {
  const { colors } = useAppTheme();
  const radius = Math.round(size * 0.28);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={MONTRA_BRAND_LOGO}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        transition={100}
      />
    </View>
  );
}

export function AuthAmbientBackground() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const screenDimensions = Dimensions.get('screen');
  const { colors, isDark } = useAppTheme();

  // Full screen coverage including all system insets, navigation bars and physical screen bounds
  const fullWidth = Math.max(windowWidth, screenDimensions.width, 360);
  const fullHeight = Math.max(windowHeight, screenDimensions.height, 900) + 120;

  return (
    <View style={styles.ambientContainer} pointerEvents="none">
      <Svg width={fullWidth} height={fullHeight} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Top-Right Soft Primary / Accent Glow */}
          <RadialGradient id="topRightGlow" cx="95%" cy="6%" r="55%">
            <Stop
              offset="0%"
              stopColor={colors.primary}
              stopOpacity={isDark ? 0.35 : 0.22}
            />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>

          {/* Top-Left Soft Secondary Glow */}
          <RadialGradient id="topLeftGlow" cx="5%" cy="10%" r="45%">
            <Stop
              offset="0%"
              stopColor={colors.accent}
              stopOpacity={isDark ? 0.25 : 0.16}
            />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>

          {/* Bottom Ambient Glow - Radiates smoothly from bottom center across the entire lower screen */}
          <RadialGradient id="bottomSoftGlow" cx="50%" cy="98%" r="65%">
            <Stop
              offset="0%"
              stopColor={colors.primary}
              stopOpacity={isDark ? 0.22 : 0.14}
            />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
          </RadialGradient>

          {/* Bottom-Right Subtle Glow */}
          <RadialGradient id="bottomRightGlow" cx="90%" cy="85%" r="50%">
            <Stop
              offset="0%"
              stopColor={colors.accent}
              stopOpacity={isDark ? 0.20 : 0.12}
            />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Rect x={0} y={0} width="100%" height="100%" fill="url(#topRightGlow)" />
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#topLeftGlow)" />
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#bottomSoftGlow)" />
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#bottomRightGlow)" />
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
          backgroundColor: isDark ? '#1C1C22' : '#EFF1F6',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.8}
            disabled={isActive}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              if (!isActive) {
                router.replace(tab.route);
              }
            }}
            style={[
              styles.segmentBtn,
              isActive && [
                styles.segmentBtnActive,
                {
                  backgroundColor: isDark ? '#2C2C34' : '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.35 : 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                },
              ],
            ]}
          >
            <Text
              variant="sm"
              weight={isActive ? 'bold' : 'medium'}
              style={{
                fontSize: 14,
                color: isActive
                  ? isDark
                    ? '#FFFFFF'
                    : '#141416'
                  : colors.secondaryText,
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

export interface AuthShellProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  errorMessage?: string | null;
  icon?: React.ReactNode;
  imageSource?: ImageProps['source'];
  illustrationSource?: ImageProps['source'];
  activeTab?: 'login' | 'register';
  compactSpacing?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  onSkip?: () => void;
  rightSlot?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  errorMessage,
  imageSource,
  illustrationSource,
  activeTab,
  compactSpacing = false,
  onSkip,
  footer,
  children,
}: AuthShellProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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

  const isCompactHeight = height < 740 || compactSpacing;
  const statusBarHeight = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 0;
  const topInset = Math.max(insets.top, statusBarHeight, Platform.OS === 'android' ? 16 : 10);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 20 : 12);

  const displayImage = illustrationSource || imageSource;
  const illustrationHeight = isCompactHeight ? 135 : 160;
  const illustrationWidth = Math.min(width * 0.72, 240);

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      router.replace('/(tabs)');
    }
  };

  const pageBg = isDark ? colors.background : '#F8F9FD';

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <AuthAmbientBackground />

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: topInset + (Platform.OS === 'android' ? 8 : 4),
              paddingBottom: bottomInset + Spacing.md,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.contentUpper}>
            {/* Top Navigation Row: MONTRA Logo + Brand on Left, Skip on Right */}
            <View style={styles.topBar}>
              <View style={styles.brandRow}>
                <MontraMark size={28} />
                <Text
                  variant="md"
                  weight="extrabold"
                  style={[styles.brandWordmark, { color: isDark ? '#FFFFFF' : '#141416' }]}
                >
                  MONTRA
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleSkip}
                hitSlop={{ top: 12, bottom: 12, left: 14, right: 14 }}
                accessibilityRole="button"
                accessibilityLabel="Skip to app"
                style={styles.skipBtn}
              >
                <Text variant="sm" weight="semibold" style={{ color: colors.secondaryText, fontSize: 14 }}>
                  Skip
                </Text>
              </TouchableOpacity>
            </View>

            {/* Top 3D Character/Object Illustration */}
            {displayImage ? (
              <View style={[styles.illustrationWrapper, { marginVertical: isCompactHeight ? 6 : 12 }]}>
                <Image
                  source={displayImage}
                  style={{
                    width: illustrationWidth,
                    height: illustrationHeight,
                  }}
                  contentFit="contain"
                  transition={150}
                />
              </View>
            ) : null}

            {/* Typography Header Block (Left Aligned matching Reference Image 4) */}
            <View style={styles.copyBlock}>
              {eyebrow ? (
                <Text
                  variant="xs"
                  weight="bold"
                  style={[styles.eyebrow, { color: colors.primary }]}
                >
                  {eyebrow}
                </Text>
              ) : null}

              <Text
                variant="2xl"
                weight="extrabold"
                style={[
                  styles.screenTitle,
                  isCompactHeight && styles.screenTitleCompact,
                  { color: isDark ? '#FFFFFF' : '#141416' },
                ]}
              >
                {title}
              </Text>

              <Text
                variant="sm"
                style={[styles.screenSubtitle, { color: colors.secondaryText }]}
              >
                {subtitle}
              </Text>
            </View>

            {/* Segmented Pill Tabs (Sign In / Create Account) */}
            {activeTab ? (
              <View style={styles.tabsWrapper}>
                <AuthModeTabs activeTab={activeTab} />
              </View>
            ) : null}

            {/* Optional Error Alert Banner */}
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

            {/* Form Content Area */}
            <View style={styles.formContent}>
              {children}
            </View>

            {/* Trust / Security Footer Right Below Button */}
            {footer ? (
              <View style={styles.footerWrapper}>
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
  ambientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  contentUpper: {
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    marginBottom: Spacing.xs,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandWordmark: {
    letterSpacing: 1.5,
    fontSize: 15,
  },
  skipBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBlock: {
    alignItems: 'flex-start',
    marginBottom: Spacing.sm + 2,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.4,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  screenTitle: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  screenTitleCompact: {
    fontSize: 23,
    lineHeight: 28,
  },
  screenSubtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    maxWidth: 330,
  },
  tabsWrapper: {
    width: '100%',
    marginBottom: Spacing.md + 2,
  },
  segmentedTrack: {
    flexDirection: 'row',
    width: '100%',
    height: 46,
    borderRadius: 23,
    padding: 3,
    borderWidth: 1,
    alignItems: 'center',
  },
  segmentBtn: {
    flex: 1,
    height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    // shadow & bg configured inline with theme tokens
  },
  formContent: {
    width: '100%',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs + 2,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.md,
  },
  errorText: {
    flex: 1,
    lineHeight: 17,
  },
  footerWrapper: {
    marginTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
