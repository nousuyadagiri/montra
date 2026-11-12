import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useAuthStore } from '../store/authStore';
import { Text } from '../components/ui';
import { Spacing } from '../theme/tokens';

const SPLASH_GIF = require('../../assets/images/splash-animation.gif');
const SPLASH_BACKGROUND = '#070D19';
const SPLASH_MIN_DURATION_MS = 2100;
const SPLASH_MAX_WAIT_MS = 5000;

export default function RootIndex() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const [minDurationDone, setMinDurationDone] = useState(false);
  const [maxWaitElapsed, setMaxWaitElapsed] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(1));
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    const minTimer = setTimeout(() => setMinDurationDone(true), SPLASH_MIN_DURATION_MS);
    const maxTimer = setTimeout(() => setMaxWaitElapsed(true), SPLASH_MAX_WAIT_MS);
    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    };
  }, []);

  useEffect(() => {
    const readyToRoute = (isInitialized && minDurationDone) || maxWaitElapsed;
    if (!readyToRoute || hasNavigatedRef.current) return;

    hasNavigatedRef.current = true;
    const destination = user ? '/(tabs)' : '/(auth)/welcome';

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      router.replace(destination);
    });
  }, [fadeAnim, isInitialized, maxWaitElapsed, minDurationDone, router, user]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Image
          source={SPLASH_GIF}
          style={styles.gif}
          contentFit="contain"
          autoplay
          accessibilityLabel="Montra animated splash logo"
        />
        <Text variant="sm" align="center" style={styles.tagline}>
          Personal Wealth & Expense Sharing
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  gif: {
    width: 280,
    height: 280,
  },
  tagline: {
    color: '#9BA9F2',
    letterSpacing: 0.6,
    marginTop: Spacing.xs,
    opacity: 0.9,
  },
});
