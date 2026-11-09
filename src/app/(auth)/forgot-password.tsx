import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppTheme } from '../../store/themeStore';
import { authService } from '../../services/authService';
import { forgotPasswordSchema } from '../../utils/validation';
import { z } from 'zod';
import { Text, Heading, Button, Input, Header, Card } from '../../components/ui';
import { Spacing } from '../../theme/tokens';
import { Mail, Send, CheckCircle2 } from 'lucide-react-native';

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    try {
      setLoading(true);
      await authService.resetPasswordForEmail(values.email.trim());
      setSubmittedEmail(values.email.trim());
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Password Recovery" showBack />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Heading level={1}>Forgot Password</Heading>
          <Text variant="sm" color="secondary" style={styles.subtitle}>
            Enter the email address registered with your Montra account.
          </Text>
        </View>

        {submittedEmail ? (
          <Card elevated style={styles.successCard}>
            <View style={styles.successIconWrapper}>
              <CheckCircle2 size={48} color={colors.success} />
            </View>
            <Heading level={2} align="center" style={styles.successTitle}>
              Reset Link Dispatched
            </Heading>
            <Text variant="sm" color="secondary" align="center" style={styles.successDescription}>
              We sent instructions to recover your password to {submittedEmail}. Check your inbox.
            </Text>
            <View style={styles.successButton}>
              <Button
                title="Return to Sign In"
                variant="primary"
                onPress={() => router.replace('/(auth)/login')}
              />
            </View>
          </Card>
        ) : (
          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Registered Email"
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  leftIcon={<Mail size={18} color={colors.secondaryText} />}
                />
              )}
            />

            <Button
              title="Send Recovery Email"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleSubmit(onSubmit)}
              leftIcon={<Send size={20} color="#0B0F14" />}
              buttonStyle={styles.submitButton}
            />
          </View>
        )}
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
  form: {
    width: '100%',
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  successCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  successIconWrapper: {
    marginBottom: Spacing.md,
  },
  successTitle: {
    marginBottom: Spacing.xs,
  },
  successDescription: {
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  successButton: {
    width: '100%',
  },
});

