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

  const inputSurface = isDark ? colors.elevatedSurface : colors.background;

  return (
    <AuthShell
      eyebrow="ACCOUNT SECURITY"
      title="Set new password"
      subtitle="Choose a strong password to protect your Montra account."
      icon={<ShieldCheck size={14} color={colors.accent} />}
      imageSource={require('../../../assets/images/auth/auth-security.jpg')}
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
              placeholder="Minimum 6 characters"
              isPassword
              compact={isCompactHeight}
              backgroundColor={inputSurface}
              textContentType="newPassword"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              leftIcon={<Lock size={17} color={colors.secondaryText} />}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Confirm New Password"
              placeholder="Re-enter new password"
              isPassword
              compact={isCompactHeight}
              backgroundColor={inputSurface}
              textContentType="newPassword"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
              leftIcon={<ShieldCheck size={17} color={colors.secondaryText} />}
            />
          )}
        />

        <Button
          title="Update Password"
          variant="primary"
          size={isCompactHeight ? 'md' : 'lg'}
          loading={loading}
          onPress={handleSubmit(onSubmit)}
          leftIcon={<Check size={18} color={colors.onPrimary} />}
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
});
