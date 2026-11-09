import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppTheme } from '../../store/themeStore';
import { authService } from '../../services/authService';
import { resetPasswordSchema } from '../../utils/validation';
import { z } from 'zod';
import { Text, Heading, Button, Input, Header } from '../../components/ui';
import { Spacing } from '../../theme/tokens';
import { Lock, Check } from 'lucide-react-native';

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const [loading, setLoading] = useState(false);

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
      await authService.updatePassword(values.password);
      Alert.alert(
        'Password Reset Successful',
        'Your password has been updated. You can now use your new password.',
        [{ text: 'Proceed', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Set New Password" showBack />
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
          <Heading level={1}>Create New Password</Heading>
          <Text variant="sm" color="secondary" style={styles.subtitle}>
            Enter and confirm your new secure password.
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="New Password"
                placeholder="Minimum 6 characters"
                isPassword
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                leftIcon={<Lock size={18} color={colors.secondaryText} />}
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
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                leftIcon={<Lock size={18} color={colors.secondaryText} />}
              />
            )}
          />

          <Button
            title="Update Password"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleSubmit(onSubmit)}
            leftIcon={<Check size={20} color="#0B0F14" />}
            buttonStyle={styles.submitButton}
          />
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
  form: {
    width: '100%',
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
});

