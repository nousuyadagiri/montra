import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { loginSchema } from '../../utils/validation';
import { z } from 'zod';
import { Text, Heading, Button, Input, Header } from '../../components/ui';
import { Spacing } from '../../theme/tokens';
import { Mail, Lock, LogIn } from 'lucide-react-native';

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      router.replace('/(tabs)');
    } catch (error: any) {
      const msg = error?.message || 'Failed to sign in. Please check your credentials.';
      setErrorMessage(msg);
      Alert.alert('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Sign In" showBack />
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
          <Heading level={1}>Welcome Back</Heading>
          <Text variant="sm" color="secondary" style={styles.subtitle}>
            Enter your credentials to securely access your finances.
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
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email Address"
                placeholder="name@example.com"
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
                placeholder="••••••••"
                isPassword
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                leftIcon={<Lock size={18} color={colors.secondaryText} />}
              />
            )}
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text variant="sm" color="primary" weight="medium">
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleSubmit(onSubmit)}
            leftIcon={<LogIn size={20} color="#0B0F14" />}
            buttonStyle={styles.submitButton}
          />
        </View>

        <View style={styles.footerRow}>
          <Text variant="sm" color="secondary">
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text variant="sm" color="primary" weight="bold">
              Sign Up
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
    marginBottom: Spacing.xl,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  errorBanner: {
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  form: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.xl,
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing['3xl'],
  },
});

