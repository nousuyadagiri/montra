import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, X, Check, LogIn } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { Text, Heading } from './Typography';
import { Button } from './Button';
import { BorderRadius, Spacing, Shadows } from '../../theme/tokens';

interface DemoDataBadgeProps {
  compact?: boolean;
}

export const DemoDataBadge: React.FC<DemoDataBadgeProps> = () => {
  const router = useRouter();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const [modalVisible, setModalVisible] = useState(false);

  // Real authenticated sessions never run in Demo Mode
  if (user) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
        style={[
          styles.badge,
          {
            backgroundColor: colors.primaryMuted,
            borderColor: colors.borderLight,
          },
        ]}
        accessibilityLabel="Demo Mode Active. Tap for options."
      >
        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        <Text
          variant="xs"
          weight="bold"
          style={{ color: colors.primary, fontSize: 10, letterSpacing: 0.8 }}
        >
          DEMO
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              Shadows.lg,
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={styles.titleRow}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: colors.primaryMuted },
                  ]}
                >
                  <Sparkles size={18} color={colors.primary} />
                </View>
                <View>
                  <Heading level={3}>Live Demo Preview</Heading>
                  <Text variant="xs" color="secondary">
                    Interactive sample workspace
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text variant="sm" color="secondary" style={styles.descText}>
                You are previewing MONTRA with sample data for{' '}
                <Text variant="sm" weight="bold" color="primary">
                  Alex Morgan
                </Text>
                . All charts, budgets, goals, and splits work interactively.
              </Text>

              <View
                style={[
                  styles.featureCallout,
                  { backgroundColor: colors.elevatedSurface, borderColor: colors.border },
                ]}
              >
                <View style={styles.bulletRow}>
                  <Check size={15} color={colors.positive} />
                  <Text variant="xs" color="main" style={styles.bulletText}>
                    Try adding, editing, or deleting items locally without an account.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Check size={15} color={colors.positive} />
                  <Text variant="xs" color="main" style={styles.bulletText}>
                    Sign in or register anytime to load and sync your real-time cloud data.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Sign In"
                variant="outline"
                size="md"
                leftIcon={<LogIn size={15} color={colors.mainText} />}
                onPress={() => {
                  setModalVisible(false);
                  router.push('/(auth)/login');
                }}
                style={{ flex: 1 }}
              />
              <Button
                title="Keep Exploring"
                variant="primary"
                size="md"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    marginBottom: Spacing.lg,
  },
  descText: {
    lineHeight: 19,
    marginBottom: Spacing.md,
  },
  featureCallout: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletText: {
    flex: 1,
    lineHeight: 17,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
