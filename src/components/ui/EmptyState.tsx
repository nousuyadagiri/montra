import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../../store/themeStore';
import { Spacing } from '../../theme/tokens';
import { Text } from './Typography';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onAction,
  style,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, style]}>
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      <Text variant="lg" weight="bold" align="center" style={styles.title}>
        {title}
      </Text>
      <Text variant="sm" color="secondary" align="center" style={styles.description}>
        {description}
      </Text>
      {actionTitle && onAction ? (
        <View style={styles.actionWrapper}>
          <Button
            title={actionTitle}
            onPress={onAction}
            size="md"
            fullWidth={false}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.md,
    opacity: 0.9,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  description: {
    maxWidth: 280,
    lineHeight: 20,
  },
  actionWrapper: {
    marginTop: Spacing.lg,
  },
});

