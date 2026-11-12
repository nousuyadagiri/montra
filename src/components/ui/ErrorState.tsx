import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { Text, Heading } from './Typography';
import { Button } from './Button';
import { Spacing, BorderRadius } from '../../theme/tokens';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an issue fetching your financial data. Please try again.',
  onRetry,
}) => {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: isDark ? 'rgba(248, 113, 113, 0.12)' : 'rgba(220, 38, 38, 0.10)',
          },
        ]}
      >
        <AlertCircle size={32} color={colors.negative} />
      </View>

      <Heading level={3} style={styles.title}>
        {title}
      </Heading>

      <Text variant="sm" color="secondary" align="center" style={styles.message}>
        {message}
      </Text>

      {onRetry ? (
        <Button
          title="Try Again"
          onPress={onRetry}
          variant="outline"
          size="md"
          icon={<RefreshCw size={16} color={colors.mainText} />}
          style={styles.retryBtn}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  message: {
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  retryBtn: {
    minWidth: 140,
  },
});

