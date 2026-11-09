import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useAppTheme } from '../store/themeStore';
import { Text, Heading } from '../components/ui';
import { Wallet } from 'lucide-react-native';
import { Spacing } from '../theme/tokens';

export default function RootIndex() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isInitialized) return;

    if (user) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/welcome');
    }
  }, [user, isInitialized]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.logoBadge, { backgroundColor: colors.primaryMuted }]}>
        <Wallet size={48} color={colors.primary} />
      </View>
      <Heading level={1} align="center" style={styles.title}>
        MONTRA
      </Heading>
      <Text variant="sm" color="secondary" align="center" style={styles.subtitle}>
        Personal Finance & Expense Sharing
      </Text>
      <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    maxWidth: 260,
  },
  spinner: {
    marginTop: Spacing.xl,
  },
});
