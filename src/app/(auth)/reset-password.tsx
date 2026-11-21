import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppTheme } from '../../store/themeStore';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';
import { authService } from '../../services/authService';
import { resetPasswordSchema } from '../../utils/validation';
import { z } from 'zod';
import { AuthShell } from '../../components/auth/AuthShell';
import { Button, Input } from '../../components/ui';
import { Spacing } from '../../theme/tokens';
import { Lock, Check, ShieldCheck } from 'lucide-react-native';

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCompactHeight = height < 700;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      await authService.updatePassword(values.password);
      toast.success('Password updated! You are all set.', 'Password Reset');
      router.replace('/(tabs)');
    } catch (error: unknown) {
      const msg = getErrorMessage(error, 'Failed to update password.');
      setErrorMessage(msg);
      toast.error(msg, 'Reset Failed');
    } finally {
      setLoading(false);
    }
  };

  const inputSurface = isDark ? colors.elevatedSurface : '#F4F5FA';

  return (
    <AuthShell
      eyebrow="ACCOUNT SECURITY"
      title="Set new password"
      subtitle="Choose a strong password to protect your Montra account."
      illustrationSource={require('../../../assets/images/auth/forgot_password.png')}
      compactSpacing={isCompactHeight}
      errorMessage={errorMessage}
    >
      <View style={styles.form}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="New Password"
              labelIcon={<Lock size={13} color={colors.primary} strokeWidth={2} />}
              placeholder="Minimum 6 characters"
              isPassword
              compact={isCompactHeight}
              backgroundColor={inputSurface}
              textContentType="newPassword"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              leftIcon={<Lock size={16} color={colors.secondaryText} strokeWidth={1.8} />}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Confirm New Password"
              labelIcon={<ShieldCheck size={13} color={colors.primary} strokeWidth={2} />}
              placeholder="Re-enter new password"
              isPassword
              compact={isCompactHeight}
              backgroundColor={inputSurface}
              textContentType="newPassword"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
              leftIcon={<ShieldCheck size={16} color={colors.secondaryText} strokeWidth={1.8} />}
            />
          )}
        />

        <Button
          title="Update Password"
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleSubmit(onSubmit)}
          leftIcon={<Check size={18} color={colors.onPrimary} strokeWidth={2.4} />}
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
});
