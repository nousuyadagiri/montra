import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../../store/themeStore';
import { Spacing } from '../../theme/tokens';
import { Text } from './Typography';
import { Button } from './Button';

interface EmptyStateProps {
  illustration?: React.ReactNode;
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionTitle?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  illustration,
  icon,
  title,
  description,
  actionTitle,
  actionIcon,
  onAction,
  style,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, style]}>
      {illustration ? (
        <View style={styles.illustrationWrapper}>{illustration}</View>
      ) : icon ? (
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: colors.softAccent,
              borderColor: colors.borderLight,
            },
          ]}
        >
          {icon}
        </View>
      ) : null}

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
            leftIcon={actionIcon}
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
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationWrapper: {
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  description: {
    maxWidth: 290,
    lineHeight: 20,
  },
  actionWrapper: {
    marginTop: Spacing.lg,
  },
});
