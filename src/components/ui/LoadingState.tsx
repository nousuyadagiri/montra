import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../../store/themeStore';
import { Spacing } from '../../theme/tokens';
import { Text } from './Typography';

interface LoadingStateProps {
  message?: string;
  style?: ViewStyle;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading your financial data...',
  style,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? (
        <Text variant="sm" color="secondary" style={styles.message}>
          {message}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  message: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});

