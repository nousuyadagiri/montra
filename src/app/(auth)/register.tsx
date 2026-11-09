import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { registerSchema } from '../../utils/validation';
import { z } from 'zod';
import { Text, Heading, Button, Input, Header } from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { Mail, Lock, User, UserPlus } from 'lucide-react-native';

type RegisterFormValues = z.infer<typeof registerSchema>;

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
] as const;

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      currency: 'INR',
    },
  });

  const selectedCurrency = watch('currency');

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await authService.signUp({
        email: values.email.trim(),
        password: values.password,
        fullName: values.fullName.trim(),
        currency: values.currency,
      });

      if (res.session) {
        await refreshProfile();
        router.replace('/(tabs)');
      } else {
        Alert.alert(
          'Account Created',
          'A confirmation link has been sent to your email. Please verify to log in.',
          [{ text: 'OK', onPress: () => router.push('/(auth)/login') }]
        );
      }
    } catch (error: any) {
      const msg = error?.message || 'Failed to create account. Please try again.';
      setErrorMessage(msg);
      Alert.alert('Registration Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Create Account" showBack />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Heading level={1}>Get Started</Heading>
          <Text variant="sm" color="secondary" style={styles.subtitle}>
            Create your Montra account to take control of your wealth.
          </Text>
        </View>

        {errorMessage ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
            <Text variant="sm" color="error">
              {errorMessage}
            </Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                placeholder="Alex Johnson"
                autoCapitalize="words"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.fullName?.message}
                leftIcon={<User size={18} color={colors.secondaryText} />}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email Address"
                placeholder="alex@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                leftIcon={<Mail size={18} color={colors.secondaryText} />}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Minimum 6 characters"
                isPassword
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                leftIcon={<Lock size={18} color={colors.secondaryText} />}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm Password"
                placeholder="Re-enter password"
                isPassword
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                leftIcon={<Lock size={18} color={colors.secondaryText} />}
              />
            )}
          />

          {/* Preferred Currency Selector */}
          <View style={styles.currencySection}>
            <Text variant="sm" weight="medium" color="secondary" style={styles.currencyLabel}>
              Primary Currency
            </Text>
            <View style={styles.currencyRow}>
              {CURRENCIES.map((curr) => {
                const isSelected = selectedCurrency === curr.code;
                return (
                  <TouchableOpacity
                    key={curr.code}
                    onPress={() => setValue('currency', curr.code)}
                    style={[
                      styles.currencyPill,
                      {
                        backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      variant="sm"
                      weight={isSelected ? 'bold' : 'medium'}
                      style={{ color: isSelected ? colors.primary : colors.mainText }}
                    >
                      {curr.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Button
            title="Create Account"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleSubmit(onSubmit)}
            leftIcon={<UserPlus size={20} color="#0B0F14" />}
            buttonStyle={styles.submitButton}
          />
        </View>

        <View style={styles.footerRow}>
          <Text variant="sm" color="secondary">
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text variant="sm" color="primary" weight="bold">
              Sign In
            </Text>
          </TouchableOpacity>
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  headerBlock: {
    marginBottom: Spacing.lg,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  errorBanner: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  form: {
    width: '100%',
  },
  currencySection: {
    marginBottom: Spacing.lg,
  },
  currencyLabel: {
    marginBottom: Spacing.xs,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  currencyPill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
});

