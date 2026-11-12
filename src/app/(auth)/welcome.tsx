import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar as RNStatusBar,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image, ImageProps } from 'expo-image';
import {
  ArrowRight,
  Lock,
  Sun,
  Moon,
  TrendingUp,
  PieChart,
  Users,
  Sparkles,
  LogIn,
} from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { MontraMark, AuthAmbientBackground } from '../../components/auth/AuthShell';
import { Text, Button } from '../../components/ui';
import { Spacing, BorderRadius, Shadows } from '../../theme/tokens';

interface SlideItem {
  id: string;
  tag: string;
  title: string;
  accentWord: string;
  subtitle: string;
  image: ImageProps['source'];
}

const AUTO_SCROLL_INTERVAL_MS = 3000;

const SLIDES: SlideItem[] = [
  {
    id: 'clarity',
    tag: 'WEALTH CLARITY',
    title: 'Your money,\nin',
    accentWord: 'crystal focus',
    subtitle: 'Track income, accounts, and monthly cashflow in one calm space.',
    image: require('../../../assets/images/auth/welcome-clarity.jpg'),
  },
  {
    id: 'budgets',
    tag: 'SMART BUDGETS',
    title: 'Budgets built\nfor',
    accentWord: 'real life',
    subtitle: 'Set monthly limits effortlessly and reach your savings goals faster.',
    image: require('../../../assets/images/auth/welcome-budgets.jpg'),
  },
  {
    id: 'splits',
    tag: 'GROUP SPLITS',
    title: 'Split bills,\nstay',
    accentWord: 'always even',
    subtitle: 'Share trips and shared costs with automatic settlement math.',
    image: require('../../../assets/images/auth/welcome-split.jpg'),
  },
];

function renderSlideBadgeIcon(slideId: string, accentColor: string, primaryColor: string, successColor: string) {
  switch (slideId) {
    case 'clarity':
      return <TrendingUp size={18} color={successColor} strokeWidth={2.4} />;
    case 'budgets':
      return <PieChart size={18} color={accentColor} strokeWidth={2.4} />;
    default:
      return <Users size={18} color={primaryColor} strokeWidth={2.4} />;
  }
}

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { colors, isDark, setMode } = useAppTheme();

  const carouselRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const targetIndexRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  const isCompactHeight = height < 700;
  const artSize = height >= 780 ? 196 : isCompactHeight ? 136 : 168;

  const statusBarHeight = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 0;
  const topInset = Math.max(insets.top, statusBarHeight, Platform.OS === 'android' ? 16 : 10);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12);

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AuthAmbientBackground />

      {/* Minimal Top Brand Bar */}
      <View style={[styles.topBar, { paddingTop: topInset + Spacing.xs }]}>
        <View style={styles.brandRow}>
          <MontraMark size={30} />
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
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {isDark ? (
            <Sun size={16} color={colors.accent} />
          ) : (
            <Moon size={16} color={colors.primary} />
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
              <View style={[styles.artworkWrapper, { marginBottom: isCompactHeight ? Spacing.md : Spacing.xl }]}>
                <View
                  style={[
                    styles.artworkFrame,
                    {
                      width: artSize,
                      height: artSize,
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                    },
                    !isDark ? Shadows.lg : Shadows.md,
                  ]}
                >
                  <Image
                    source={slide.image}
                    style={styles.artworkImage}
                    contentFit="cover"
                    transition={220}
                  />
                </View>

                <View
                  style={[
                    styles.floatingIconBadge,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    Shadows.md,
                  ]}
                >
                  {renderSlideBadgeIcon(slide.id, colors.accent, colors.primary, colors.success)}
                </View>
              </View>

              <View
                style={[
                  styles.tagPill,
                  {
                    backgroundColor: colors.softAccent,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <Sparkles size={11} color={colors.accent} />
                <Text
                  variant="xs"
                  weight="bold"
                  style={[styles.slideTag, { color: colors.accent }]}
                >
                  {slide.tag}
                </Text>
              </View>

              <Text
                variant="2xl"
                weight="extrabold"
                align="center"
                style={[
                  styles.slideTitle,
                  isCompactHeight && styles.slideTitleCompact,
                ]}
              >
                {slide.title}{' '}
                <Text
                  variant="2xl"
                  weight="extrabold"
                  style={[
                    styles.slideTitle,
                    isCompactHeight && styles.slideTitleCompact,
                    { color: colors.accent },
                  ]}
                >
                  {slide.accentWord}
                </Text>
              </Text>

              <Text
                variant={isCompactHeight ? 'sm' : 'base'}
                color="secondary"
                align="center"
                style={styles.slideSubtitle}
              >
                {slide.subtitle}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Interactive Pagination Dots */}
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
                      width: isActive ? 22 : 7,
                      backgroundColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Fit-to-Screen Bottom Action Dock */}
      <View style={[styles.actionsArea, { paddingBottom: bottomInset + Spacing.xs }]}>
        <Button
          title="Get Started"
          variant="primary"
          size={isCompactHeight ? 'md' : 'lg'}
          rightIcon={<ArrowRight size={18} color={colors.onPrimary} />}
          onPress={() => router.push('/(auth)/register')}
        />

        <View style={styles.secondaryRow}>
          <Button
            title="Sign In"
            variant="outline"
            size={isCompactHeight ? 'md' : 'lg'}
            leftIcon={<LogIn size={15} color={colors.mainText} />}
            buttonStyle={{
              flex: 1,
              backgroundColor: isDark ? colors.elevatedSurface : colors.surface,
              borderColor: colors.border,
            }}
            onPress={() => router.push('/(auth)/login')}
          />

          <Button
            title="Try Demo"
            variant="outline"
            size={isCompactHeight ? 'md' : 'lg'}
            leftIcon={<Sparkles size={15} color={colors.primary} />}
            buttonStyle={{
              flex: 1,
              backgroundColor: colors.primaryMuted,
              borderColor: colors.primary,
            }}
            textStyle={{ color: colors.primary }}
            onPress={() => router.replace('/(tabs)')}
          />
        </View>

        <View style={styles.securityNote}>
          <Lock size={11} color={colors.tertiaryText} />
          <Text variant="xs" color="tertiary" style={{ fontSize: 11 }}>
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
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandWordmark: {
    letterSpacing: 2.2,
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkFrame: {
    borderRadius: 30,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  floatingIconBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm,
  },
  slideTag: {
    fontSize: 10,
    letterSpacing: 1.1,
  },
  slideTitle: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
    marginBottom: Spacing.xs + 2,
  },
  slideTitleCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  slideSubtitle: {
    lineHeight: 21,
    maxWidth: 295,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: Spacing.sm,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  actionsArea: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    gap: Spacing.sm,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  secondaryBtn: {
    flex: 1,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 2,
  },
});
