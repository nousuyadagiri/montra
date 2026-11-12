import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';
import { authService } from '../../services/authService';
import { registerSchema } from '../../utils/validation';
import { z } from 'zod';
import { AuthShell } from '../../components/auth/AuthShell';
import { Text, Button, Input } from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import {
  Mail,
  Lock,
  User,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Coins,
} from 'lucide-react-native';

type RegisterFormValues = z.infer<typeof registerSchema>;

const CURRENCIES = [
  { code: 'INR', symbol: '₹' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
] as const;

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
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
        toast.success('Your MONTRA account is ready!', 'Welcome');
        router.replace('/(tabs)');
      } else {
        toast.info('Please check your email link to verify your account.', 'Account Created');
        router.push('/(auth)/login');
      }
    } catch (error: any) {
      let msg = getErrorMessage(error, 'Failed to create account. Please try again.');
      if (
        msg.toLowerCase().includes('rate limit') ||
        error?.code === 'over_email_send_rate_limit' ||
        error?.status === 429
      ) {
        msg =
          'Email rate limit exceeded. Please wait a few minutes or disable email confirmation in Supabase Authentication settings for testing.';
      }
      setErrorMessage(msg);
      toast.error(msg, 'Registration Failed');
    } finally {
      setLoading(false);
    }
  };

  const inputSurface = isDark ? colors.elevatedSurface : colors.background;

  return (
    <AuthShell
      eyebrow="GET STARTED"
      title="Create account"
      subtitle="Set up your personal wealth and split workspace."
      icon={<UserPlus size={14} color={colors.accent} />}
      imageSource={require('../../../assets/images/auth/welcome-clarity.jpg')}
      activeTab="register"
      compactSpacing
      errorMessage={errorMessage}
    >
      <View style={styles.form}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Full Name"
              placeholder="Alex Morgan"
              autoCapitalize="words"
              textContentType="name"
              autoComplete="name"
              compact
              backgroundColor={inputSurface}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.fullName?.message}
              leftIcon={<User size={16} color={colors.secondaryText} />}
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
              textContentType="emailAddress"
              autoComplete="email"
              compact
              backgroundColor={inputSurface}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              leftIcon={<Mail size={16} color={colors.secondaryText} />}
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
              compact
              backgroundColor={inputSurface}
              textContentType="newPassword"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              leftIcon={<Lock size={16} color={colors.secondaryText} />}
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
              compact
              backgroundColor={inputSurface}
              textContentType="newPassword"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
              leftIcon={<ShieldCheck size={16} color={colors.secondaryText} />}
            />
          )}
        />

        {/* Compact Single-Row Currency Selector */}
        <Controller
          control={control}
          name="currency"
          render={({ field: { value, onChange } }) => (
            <View style={styles.currencyRowWrapper}>
              <View style={styles.currencyLabelGroup}>
                <Coins size={14} color={colors.secondaryText} />
                <Text variant="xs" weight="medium" color="secondary">
                  Currency
                </Text>
              </View>
              <View style={styles.currencyPills}>
                {CURRENCIES.map((curr) => {
                  const isSelected = value === curr.code;
                  return (
                    <TouchableOpacity
                      key={curr.code}
                      activeOpacity={0.75}
                      onPress={() => onChange(curr.code)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      style={[
                        styles.currencyTile,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? colors.primaryMuted
                              : colors.softAccent
                            : inputSurface,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderWidth: isSelected ? 1.5 : 1,
                        },
                      ]}
                    >
                      <Text
                        variant="xs"
                        weight={isSelected ? 'bold' : 'medium'}
                        style={{
                          color: isSelected ? colors.primary : colors.mainText,
                        }}
                      >
                        {curr.symbol} {curr.code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        />

        <Button
          title="Create Account"
          variant="primary"
          size="md"
          loading={loading}
          onPress={handleSubmit(onSubmit)}
          rightIcon={<ArrowRight size={17} color={colors.onPrimary} />}
          buttonStyle={styles.submitButton}
        />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
  },
  currencyRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
    marginBottom: Spacing.sm + 4,
  },
  currencyLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  currencyPills: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  currencyTile: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  submitButton: {
    marginTop: 2,
  },
});
