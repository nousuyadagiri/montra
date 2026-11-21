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
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';
import { authService } from '../../services/authService';
import { forgotPasswordSchema } from '../../utils/validation';
import { z } from 'zod';
import { AuthShell } from '../../components/auth/AuthShell';
import { Text, Button, Input } from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import {
  Mail,
  Send,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react-native';

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();

  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCompactHeight = height < 740;

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
      setErrorMessage(null);
      const email = values.email.trim();
      await authService.resetPasswordForEmail(email);
      setSubmittedEmail(email);
      toast.success('Recovery link sent. Check your inbox.', 'Email Sent');
    } catch (error: any) {
      let msg = getErrorMessage(error, 'Failed to send password reset email.');
      if (
        msg.toLowerCase().includes('rate limit') ||
        error?.code === 'over_email_send_rate_limit' ||
        error?.status === 429
      ) {
        msg =
          'Email rate limit exceeded. Please wait a few minutes or configure custom SMTP in Supabase Settings.';
      }
      setErrorMessage(msg);
      toast.error(msg, 'Recovery Error');
    } finally {
      setLoading(false);
    }
  };

  const inputSurface = isDark ? colors.elevatedSurface : '#F4F5FA';

  return (
    <AuthShell
      eyebrow={submittedEmail ? 'LINK DISPATCHED' : 'ACCOUNT RECOVERY'}
      title={submittedEmail ? 'Check your inbox' : 'Forgot password?'}
      subtitle={
        submittedEmail
          ? 'Follow the secure link in your email to set a new password.'
          : "Enter your registered email and we'll send recovery steps."
      }
      illustrationSource={require('../../../assets/images/auth/forgot_password.png')}
      compactSpacing={isCompactHeight}
      errorMessage={!submittedEmail ? errorMessage : null}
      footer={
        !submittedEmail ? (
          <View style={styles.footerContainer}>
            <Text variant="xs" style={styles.orText}>
              or
            </Text>
            <View style={styles.trustRow}>
              <ShieldCheck size={14} color="#6B7280" strokeWidth={1.8} />
              <Text variant="xs" style={styles.trustText}>
                Single-use link · Expires automatically for safety
              </Text>
            </View>
            <View style={styles.loginLinkRow}>
              <Text variant="xs" style={{ color: colors.secondaryText }}>
                Remembered your password?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => router.replace('/(auth)/login')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text variant="xs" weight="bold" style={{ color: colors.primary }}>
                  → Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : undefined
      }
    >
      {submittedEmail ? (
        <View style={styles.successBox}>
          <View
            style={[
              styles.successHalo,
              { backgroundColor: colors.successMuted },
            ]}
          >
            <CheckCircle2 size={28} color={colors.success} />
          </View>

          <Text variant="base" weight="bold" align="center">
            Recovery link dispatched
          </Text>

          <View
            style={[
              styles.emailPill,
              {
                backgroundColor: inputSurface,
                borderColor: isDark ? colors.border : '#E5E7EB',
              },
            ]}
          >
            <Mail size={14} color={colors.primary} />
            <Text variant="sm" weight="semibold" numberOfLines={1}>
              {submittedEmail}
            </Text>
          </View>

          <Text variant="xs" color="secondary" align="center" style={styles.helperText}>
            {"Didn't see the message? Check spam or try another email."}
          </Text>

          <View style={styles.successActions}>
            <Button
              title="Back to Sign In"
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight size={17} color={colors.onPrimary} />}
              buttonStyle={[
                styles.submitButton,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                },
              ]}
              textStyle={{ color: colors.onPrimary }}
              onPress={() => router.replace('/(auth)/login')}
            />
            <Button
              title="Use a different email"
              variant="ghost"
              size="sm"
              onPress={() => {
                setSubmittedEmail(null);
                setErrorMessage(null);
              }}
            />
          </View>
        </View>
      ) : (
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

          <Button
            title="Send Recovery Link"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleSubmit(onSubmit)}
            leftIcon={<Send size={16} color={colors.onPrimary} strokeWidth={2.2} />}
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
      )}
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
  loginLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  successHalo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  helperText: {
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  successActions: {
    width: '100%',
    gap: Spacing.sm,
  },
});
