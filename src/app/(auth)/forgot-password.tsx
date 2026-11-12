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
  KeyRound,
  MailCheck,
  ArrowRight,
  Lock,
  LogIn,
} from 'lucide-react-native';

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();

  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCompactHeight = height < 700;

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

  const inputSurface = isDark ? colors.elevatedSurface : colors.background;

  return (
    <AuthShell
      eyebrow={submittedEmail ? 'EMAIL SENT' : 'ACCOUNT RECOVERY'}
      title={submittedEmail ? 'Check your inbox' : 'Forgot password?'}
      subtitle={
        submittedEmail
          ? 'Follow the secure link in your email to create a new password.'
          : "Enter your registered email and we'll send recovery steps."
      }
      icon={
        submittedEmail ? (
          <MailCheck size={14} color={colors.success} />
        ) : (
          <KeyRound size={14} color={colors.accent} />
        )
      }
      imageSource={require('../../../assets/images/auth/auth-security.jpg')}
      compactSpacing={isCompactHeight}
      errorMessage={!submittedEmail ? errorMessage : null}
      footer={
        !submittedEmail ? (
          <View style={styles.inlineFooter}>
            <Text variant="sm" color="secondary">
              Remembered your password?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.footerLinkRow}
            >
              <LogIn size={14} color={colors.accent} />
              <Text variant="sm" color={colors.accent} weight="bold">
                Sign In
              </Text>
            </TouchableOpacity>
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
            <CheckCircle2 size={32} color={colors.success} />
          </View>

          <Text variant="base" weight="bold" align="center">
            Recovery link dispatched
          </Text>

          <View
            style={[
              styles.emailPill,
              {
                backgroundColor: inputSurface,
                borderColor: colors.borderLight,
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
              size={isCompactHeight ? 'md' : 'lg'}
              rightIcon={<ArrowRight size={18} color={colors.onPrimary} />}
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
                label="Registered Email"
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

          <Button
            title="Send Recovery Link"
            variant="primary"
            size={isCompactHeight ? 'md' : 'lg'}
            loading={loading}
            onPress={handleSubmit(onSubmit)}
            leftIcon={<Send size={17} color={colors.onPrimary} />}
            buttonStyle={styles.submitButton}
          />

          <View style={styles.securityTip}>
            <Lock size={12} color={colors.tertiaryText} />
            <Text variant="xs" color="tertiary" style={styles.securityTipText}>
              Recovery links are single-use and time-limited for safety
            </Text>
          </View>
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
    marginTop: Spacing.xs + 2,
  },
  securityTip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: Spacing.md,
  },
  securityTipText: {
    fontSize: 11,
  },
  successBox: {
    alignItems: 'center',
    gap: Spacing.xs + 2,
    paddingVertical: Spacing.xs,
  },
  successHalo: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '100%',
  },
  helperText: {
    lineHeight: 17,
    marginBottom: Spacing.sm,
    maxWidth: 250,
  },
  successActions: {
    width: '100%',
    gap: Spacing.xs,
  },
  inlineFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
