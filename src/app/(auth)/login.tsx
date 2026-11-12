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
  KeyRound,
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

  const isCompactHeight = height < 700;

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

  const inputSurface = isDark ? colors.elevatedSurface : colors.background;

  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title="Welcome back"
      subtitle="Sign in to manage your wealth & shared splits."
      icon={<KeyRound size={14} color={colors.accent} />}
      imageSource={require('../../../assets/images/auth/auth-security.jpg')}
      activeTab="login"
      compactSpacing={isCompactHeight}
      errorMessage={errorMessage}
      footer={
        <View style={styles.trustRow}>
          <ShieldCheck size={13} color={colors.tertiaryText} />
          <Text variant="xs" color="tertiary" style={styles.trustText}>
            Protected by end-to-end TLS & Row-Level Security
          </Text>
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
              leftIcon={<Mail size={17} color={colors.secondaryText} />}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              labelRight={
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text variant="xs" color={colors.accent} weight="semibold">
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
              leftIcon={<Lock size={17} color={colors.secondaryText} />}
            />
          )}
        />

        <Button
          title="Sign In"
          variant="primary"
          size={isCompactHeight ? 'md' : 'lg'}
          loading={loading}
          onPress={handleSubmit(onSubmit)}
          rightIcon={<ArrowRight size={18} color={colors.onPrimary} />}
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
  submitButton: {
    marginTop: Spacing.xs + 2,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  trustText: {
    fontSize: 11,
  },
});
