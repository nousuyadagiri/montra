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
  ArrowRight,
  ShieldCheck,
  Coins,
  ChevronDown,
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
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

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

  const inputSurface = isDark ? colors.elevatedSurface : '#F4F5FA';

  return (
    <AuthShell
      eyebrow="NEW WORKSPACE"
      title="Create account"
      subtitle="Set up your personal wealth & split workspace."
      illustrationSource={require('../../../assets/images/auth/create_account.png')}
      activeTab="register"
      compactSpacing
      errorMessage={errorMessage}
      footer={
        <View style={styles.trustRow}>
          <ShieldCheck size={14} color="#6B7280" strokeWidth={1.8} />
          <Text variant="xs" style={styles.trustText}>
            Private by design · Encrypted Supabase storage
          </Text>
        </View>
      }
    >
      <View style={styles.form}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Full Name"
              labelIcon={<User size={13} color={colors.primary} strokeWidth={2} />}
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
              leftIcon={<User size={15} color={colors.secondaryText} strokeWidth={1.8} />}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email Address"
              labelIcon={<Mail size={13} color={colors.primary} strokeWidth={2} />}
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
              leftIcon={<Mail size={15} color={colors.secondaryText} strokeWidth={1.8} />}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              labelIcon={<Lock size={13} color={colors.primary} strokeWidth={2} />}
              placeholder="Minimum 6 characters"
              isPassword
              compact
              backgroundColor={inputSurface}
              textContentType="newPassword"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              leftIcon={<Lock size={15} color={colors.secondaryText} strokeWidth={1.8} />}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Confirm Password"
              labelIcon={<ShieldCheck size={13} color={colors.primary} strokeWidth={2} />}
              placeholder="Re-enter password"
              isPassword
              compact
              backgroundColor={inputSurface}
              textContentType="newPassword"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
              leftIcon={<ShieldCheck size={15} color={colors.secondaryText} strokeWidth={1.8} />}
            />
          )}
        />

        {/* Primary Currency (Reference Style Pill Selector) */}
        <Controller
          control={control}
          name="currency"
          render={({ field: { value, onChange } }) => {
            const currentCurrency = CURRENCIES.find((c) => c.code === value) ?? CURRENCIES[0];

            return (
              <View style={styles.currencyBlock}>
                <View style={styles.currencyHeader}>
                  <Coins size={13} color={colors.primary} strokeWidth={2} />
                  <Text variant="xs" weight="medium" color="secondary" style={styles.currencyLabel}>
                    Primary currency
                  </Text>
                </View>

                {/* Primary currency pill button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  style={[
                    styles.currencySelectorPill,
                    {
                      backgroundColor: inputSurface,
                      borderColor: showCurrencyDropdown ? colors.primary : isDark ? colors.border : '#E5E7EB',
                    },
                  ]}
                >
                  <Text variant="sm" weight="bold" style={{ color: isDark ? '#FFFFFF' : '#141416' }}>
                    {currentCurrency.symbol} {currentCurrency.code}
                  </Text>
                  <ChevronDown size={15} color={colors.secondaryText} />
                </TouchableOpacity>

                {/* Currency options list when expanded */}
                {showCurrencyDropdown ? (
                  <View
                    style={[
                      styles.currencyOptionsRow,
                      {
                        backgroundColor: inputSurface,
                        borderColor: isDark ? colors.border : '#E5E7EB',
                      },
                    ]}
                  >
                    {CURRENCIES.map((curr) => {
                      const isSelected = value === curr.code;
                      return (
                        <TouchableOpacity
                          key={curr.code}
                          activeOpacity={0.7}
                          onPress={() => {
                            onChange(curr.code);
                            setShowCurrencyDropdown(false);
                          }}
                          style={[
                            styles.currencyOptionTile,
                            {
                              backgroundColor: isSelected
                                ? colors.primary
                                : 'transparent',
                            },
                          ]}
                        >
                          <Text
                            variant="xs"
                            weight="bold"
                            style={{
                              color: isSelected ? colors.onPrimary : colors.secondaryText,
                            }}
                          >
                            {curr.symbol} {curr.code}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          }}
        />

        <Button
          title="Create Account"
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleSubmit(onSubmit)}
          rightIcon={<ArrowRight size={17} color={colors.onPrimary} strokeWidth={2.4} />}
          buttonStyle={[
            styles.submitButton,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
          ]}
          textStyle={{ color: colors.onPrimary }}
        />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
  },
  currencyBlock: {
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  currencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  currencyLabel: {
    fontSize: 12,
  },
  currencySelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    borderRadius: BorderRadius.md + 2,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  currencyOptionsRow: {
    flexDirection: 'row',
    gap: 6,
    padding: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: 6,
  },
  currencyOptionTile: {
    flex: 1,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
  },
  submitButton: {
    marginTop: Spacing.xs,
    backgroundColor: '#5B4DFC',
    borderRadius: 26,
    height: 52,
    shadowColor: '#5B4DFC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 11.5,
    color: '#6B7280',
  },
});
