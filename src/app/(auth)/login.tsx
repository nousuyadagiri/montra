import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';
import { authService } from '../../services/authService';
import { loginSchema } from '../../utils/validation';
import { z } from 'zod';
import { AuthShell } from '../../components/auth/AuthShell';
import { Text, Button, Input } from '../../components/ui';
import { Spacing } from '../../theme/tokens';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCompactHeight = height < 740;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      await authService.signIn({
        email: values.email.trim(),
        password: values.password,
      });
      await refreshProfile();
      toast.success('Signed in to your MONTRA workspace.', 'Welcome Back');
      router.replace('/(tabs)');
    } catch (error: unknown) {
      const msg = getErrorMessage(error, 'Failed to sign in. Please check your credentials.');
      setErrorMessage(msg);
      toast.error(msg, 'Sign In Failed');
    } finally {
      setLoading(false);
    }
  };

  const inputSurface = isDark ? colors.elevatedSurface : '#F4F5FA';

  return (
    <AuthShell
      eyebrow="ACCOUNT ACCESS"
      title="Welcome back"
      subtitle="Access your accounts, budgets & shared splits."
      illustrationSource={require('../../../assets/images/auth/sign_in.png')}
      activeTab="login"
      compactSpacing={isCompactHeight}
      errorMessage={errorMessage}
      footer={
        <View style={styles.footerContainer}>
          <Text variant="xs" style={styles.orText}>
            or
          </Text>
          <View style={styles.trustRow}>
            <ShieldCheck size={14} color="#6B7280" strokeWidth={1.8} />
            <Text variant="xs" style={styles.trustText}>
              End-to-end TLS · Row-level security
            </Text>
          </View>
        </View>
      }
    >
      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email Address"
              labelIcon={<Mail size={13} color={colors.primary} strokeWidth={2} />}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
              compact={isCompactHeight}
              backgroundColor={inputSurface}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              leftIcon={<Mail size={16} color={colors.secondaryText} strokeWidth={1.8} />}
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
              labelRight={
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text variant="xs" weight="bold" style={{ color: colors.primary }}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              }
              placeholder="••••••••"
              isPassword
              compact={isCompactHeight}
              backgroundColor={inputSurface}
              textContentType="password"
              autoComplete="password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              leftIcon={<Lock size={16} color={colors.secondaryText} strokeWidth={1.8} />}
            />
          )}
        />

        <Button
          title="Sign In"
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
  submitButton: {
    marginTop: Spacing.sm,
    backgroundColor: '#5B4DFC',
    borderRadius: 26,
    height: 52,
    shadowColor: '#5B4DFC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  footerContainer: {
    alignItems: 'center',
    gap: 10,
  },
  orText: {
    color: '#9CA3AF',
    fontSize: 12,
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
