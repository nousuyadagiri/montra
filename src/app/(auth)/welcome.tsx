import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image, ImageProps } from 'expo-image';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import {
  ArrowRight,
  Lock,
  Sun,
  Moon,
  Sparkles,
  LogIn,
} from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { MontraMark } from '../../components/auth/AuthShell';
import { Text } from '../../components/ui';
import { Spacing } from '../../theme/tokens';

interface SlideItem {
  id: string;
  title: string;
  accentWord: string;
  subtitle: string;
  image: ImageProps['source'];
}

const AUTO_SCROLL_INTERVAL_MS = 3200;

const SLIDES: SlideItem[] = [
  {
    id: 'clarity',
    title: 'Your money,\nin',
    accentWord: 'complete control',
    subtitle: 'Track expenses, set budgets, and achieve your financial goals effortlessly.',
    image: require('../../../assets/images/auth/image_one.png'),
  },
  {
    id: 'budgets',
    title: 'Budgets build\nfor',
    accentWord: 'real life',
    subtitle: 'Set monthly limits effortlessly and reach your savings goals faster.',
    image: require('../../../assets/images/auth/image_two.png'),
  },
  {
    id: 'splits',
    title: 'Split bills,\nstay',
    accentWord: 'always even',
    subtitle: 'Share trips and shared costs with automatic settlement math.',
    image: require('../../../assets/images/auth/image_three.png'),
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { colors, isDark, setMode } = useAppTheme();

  const carouselRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const targetIndexRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  const isCompactHeight = height < 720;
  const artWidth = Math.min(width * 0.90, isCompactHeight ? 240 : 385);
  const artHeight = artWidth;

  const statusBarHeight = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 0;
  const topInset = Math.max(insets.top, statusBarHeight, Platform.OS === 'android' ? 16 : 10);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12);

  const screenBg = isDark ? colors.background : '#F7F6FC';

  useEffect(() => {
    if (isUserInteracting || width <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      const nextIndex = (activeIndex + 1) % SLIDES.length;
      targetIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      carouselRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    }, AUTO_SCROLL_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [activeIndex, isUserInteracting, width]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const safeWidth = Math.max(width, 1);

    if (targetIndexRef.current !== null) {
      if (Math.abs(offsetX - targetIndexRef.current * safeWidth) < 4) {
        targetIndexRef.current = null;
      }
      return;
    }

    const nextIndex = Math.round(offsetX / safeWidth);
    if (nextIndex >= 0 && nextIndex < SLIDES.length && nextIndex !== activeIndex) {
      setActiveIndex(nextIndex);
    }
  };

  const scrollToSlide = (idx: number) => {
    targetIndexRef.current = idx;
    setActiveIndex(idx);
    carouselRef.current?.scrollTo({ x: idx * width, animated: true });
  };

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      {/* Subtle decorative upper-right wave blob */}
      <View style={styles.topRightWave} pointerEvents="none">
        <Svg width={180} height={180} viewBox="0 0 180 180">
          <Defs>
            <RadialGradient id="topBlob" cx="100%" cy="0%" r="100%">
              <Stop
                offset="0%"
                stopColor={isDark ? '#312E81' : '#DDD6FE'}
                stopOpacity={isDark ? 0.3 : 0.65}
              />
              <Stop offset="100%" stopColor={isDark ? '#312E81' : '#DDD6FE'} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={180} cy={0} r={180} fill="url(#topBlob)" />
        </Svg>
      </View>

      {/* Top Brand Bar */}
      <View style={[styles.topBar, { paddingTop: topInset + Spacing.xs }]}>
        <View style={styles.brandRow}>
          <MontraMark size={32} />
          <Text variant="md" weight="extrabold" style={styles.brandWordmark}>
            MONTRA
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setMode(isDark ? 'light' : 'dark')}
          accessibilityRole="button"
          accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={[
            styles.themeBtn,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E2E8F0',
            },
          ]}
        >
          {isDark ? (
            <Sun size={17} color="#F59E0B" />
          ) : (
            <Moon size={17} color="#312E81" />
          )}
        </TouchableOpacity>
      </View>

      {/* Fit-to-Screen Horizontal Carousel */}
      <View style={styles.carouselWrapper}>
        <ScrollView
          ref={carouselRef}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => {
            targetIndexRef.current = null;
            setIsUserInteracting(true);
          }}
          onScrollEndDrag={() => setIsUserInteracting(false)}
          onScroll={handleScroll}
          onMomentumScrollEnd={(e) => {
            setIsUserInteracting(false);
            handleScroll(e);
          }}
          scrollEventThrottle={16}
        >
          {SLIDES.map((slide) => (
            <View key={slide.id} style={[styles.slide, { width }]}>
              {/* Free-Standing 3D Character Illustration (Transparent PNG) */}
              <View style={[styles.artworkWrapper, { width: artWidth, height: artHeight }]}>
                <View style={styles.ambientGlow} pointerEvents="none">
                  <Svg width={artWidth} height={artHeight} viewBox="0 0 200 200">
                    <Defs>
                      <RadialGradient id={`glow_${slide.id}`} cx="50%" cy="50%" r="50%">
                        <Stop
                          offset="0%"
                          stopColor="#6366F1"
                          stopOpacity={isDark ? 0.35 : 0.15}
                        />
                        <Stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                      </RadialGradient>
                    </Defs>
                    <Circle cx="100" cy="100" r="100" fill={`url(#glow_${slide.id})`} />
                  </Svg>
                </View>

                <Image
                  source={slide.image}
                  style={{ width: artWidth, height: artHeight }}
                  contentFit="contain"
                  transition={180}
                  accessibilityLabel={slide.accentWord}
                />
              </View>

              {/* Title & Subtitle */}
              <View style={styles.copyWrapper}>
                <Text
                  variant="2xl"
                  weight="extrabold"
                  align="center"
                  style={[
                    styles.slideTitle,
                    { color: colors.mainText },
                    isCompactHeight && styles.slideTitleCompact,
                  ]}
                >
                  {slide.title}{' '}
                  <Text
                    variant="2xl"
                    weight="extrabold"
                    style={[
                      styles.slideTitle,
                      { color: '#4F46E5' },
                      isCompactHeight && styles.slideTitleCompact,
                    ]}
                  >
                    {slide.accentWord}
                  </Text>
                </Text>

                <Text
                  variant="sm"
                  color="secondary"
                  align="center"
                  style={styles.slideSubtitle}
                >
                  {slide.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Exact Reference Pagination Indicators */}
        <View style={styles.dotsRow}>
          {SLIDES.map((slide, idx) => {
            const isActive = activeIndex === idx;
            return (
              <TouchableOpacity
                key={slide.id}
                onPress={() => scrollToSlide(idx)}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel={`Go to slide ${idx + 1}`}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      width: isActive ? 22 : 12,
                      backgroundColor: isActive
                        ? '#4F46E5'
                        : isDark
                        ? '#334155'
                        : '#CBD5E1',
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Bottom Action Dock */}
      <View style={[styles.actionsArea, { paddingBottom: bottomInset + Spacing.xs }]}>
        {/* Primary CTA: Get Started → */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/(auth)/register')}
          style={[
            styles.primaryCtaBtn,
            {
              backgroundColor: '#4F46E5',
              shadowColor: '#4F46E5',
            },
          ]}
        >
          <Text variant="md" weight="bold" style={styles.primaryCtaText}>
            Get Started
          </Text>
          <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        {/* Secondary Row: Sign In & Try Demo */}
        <View style={styles.secondaryRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(auth)/login')}
            style={[
              styles.secondaryBtn,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: isDark ? colors.border : '#E2E8F0',
              },
            ]}
          >
            <LogIn size={16} color={colors.mainText} style={{ marginRight: 6 }} />
            <Text variant="sm" weight="bold" style={{ color: colors.mainText }}>
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.replace('/(tabs)')}
            style={[
              styles.secondaryBtn,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: isDark ? '#6366F1' : '#C7D2FE',
              },
            ]}
          >
            <Sparkles size={16} color="#4F46E5" style={{ marginRight: 6 }} />
            <Text variant="sm" weight="bold" style={{ color: '#4F46E5' }}>
              Try Demo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Private & Encrypted Footer Note */}
        <View style={styles.securityNote}>
          <Lock size={12} color="#94A3B8" style={{ marginRight: 5 }} />
          <Text variant="xs" style={{ color: '#94A3B8', fontSize: 11 }}>
            Private & encrypted personal finance workspace
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    position: 'relative',
  },
  topRightWave: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 180,
    height: 180,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandWordmark: {
    letterSpacing: 2,
    fontSize: 16,
  },
  themeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  carouselWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  artworkWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyWrapper: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  slideTitle: {
    fontSize: 28,
    lineHeight: 35,
    letterSpacing: -0.6,
    marginBottom: Spacing.xs + 2,
    textAlign: 'center',
  },
  slideTitleCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  slideSubtitle: {
    lineHeight: 20,
    maxWidth: 310,
    fontSize: 14,
    color: '#64748B',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
  actionsArea: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm + 2,
  },
  primaryCtaBtn: {
    height: 52,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm + 2,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
});
