import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { Text, Heading, Button, Card } from '../../components/ui';
import { Spacing } from '../../theme/tokens';
import { ShieldCheck, TrendingUp, Users, Wallet } from 'lucide-react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={[styles.logoBadge, { backgroundColor: colors.primaryMuted }]}>
            <Wallet size={36} color={colors.primary} />
          </View>
          <Heading level={1} align="center" style={styles.title}>
            MONTRA
          </Heading>
          <Text variant="base" color="secondary" align="center" style={styles.tagline}>
            Smart personal finance, salary management, and group expense splitting.
          </Text>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresContainer}>
          <Card elevated style={styles.featureCard}>
            <View style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primaryMuted }]}>
                <TrendingUp size={20} color={colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text variant="base" weight="semibold">
                  Intelligent Budgeting
                </Text>
                <Text variant="xs" color="secondary">
                  Track salary, daily expenses, and allocations effortlessly.
                </Text>
              </View>
            </View>
          </Card>

          <Card elevated style={styles.featureCard}>
            <View style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.secondaryMuted }]}>
                <Users size={20} color={colors.secondary} />
              </View>
              <View style={styles.featureText}>
                <Text variant="base" weight="semibold">
                  Splitwise-Style Sharing
                </Text>
                <Text variant="xs" color="secondary">
                  Split trips, household bills, and settle balances accurately.
                </Text>
              </View>
            </View>
          </Card>

          <Card elevated style={styles.featureCard}>
            <View style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.successMuted }]}>
                <ShieldCheck size={20} color={colors.success} />
              </View>
              <View style={styles.featureText}>
                <Text variant="base" weight="semibold">
                  Bank-Grade Privacy
                </Text>
                <Text variant="xs" color="secondary">
                  Your financial data is protected with PostgreSQL Row Level Security.
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Create an Account"
            variant="primary"
            size="lg"
            onPress={() => router.push('/(auth)/register')}
          />
          <View style={styles.secondaryButtonWrapper}>
            <Button
              title="I already have an account"
              variant="outline"
              size="lg"
              onPress={() => router.push('/(auth)/login')}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  tagline: {
    maxWidth: 290,
    lineHeight: 22,
  },
  featuresContainer: {
    gap: Spacing.md,
    marginVertical: Spacing.lg,
  },
  featureCard: {
    padding: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  featureText: {
    flex: 1,
  },
  buttonContainer: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  secondaryButtonWrapper: {
    marginTop: Spacing.xs,
  },
});

