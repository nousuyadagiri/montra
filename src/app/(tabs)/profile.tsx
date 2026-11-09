import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import {
  Text,
  Heading,
  Card,
  Button,
  Badge,
} from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import {
  User,
  Moon,
  Sun,
  Smartphone,
  Bell,
  Lock,
  LogOut,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Coins,
  Trash2,
} from 'lucide-react-native';

const THEMES = [
  { label: 'System', value: 'system', icon: Smartphone },
  { label: 'Dark', value: 'dark', icon: Moon },
  { label: 'Light', value: 'light', icon: Sun },
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, mode, setMode } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [budgetAlerts, setBudgetAlerts] = useState(
    profile?.notification_preferences?.budget_alerts ?? true
  );
  const [salaryReminders, setSalaryReminders] = useState(
    profile?.notification_preferences?.salary_reminder ?? true
  );

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Montra?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const handleUpdateCurrency = (newCurrency: 'INR' | 'USD' | 'EUR' | 'GBP') => {
    if (!user) return;
    Alert.alert(
      'Update Currency',
      `Set primary display currency to ${newCurrency}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await authService.updateProfile(user.id, { currency: newCurrency });
              await refreshProfile();
              Alert.alert('Success', `Currency updated to ${newCurrency}`);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to update currency');
            }
          },
        },
      ]
    );
  };

  const initials = (profile?.full_name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: insets.bottom + Spacing['3xl'],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Heading level={1} style={styles.title}>
          Profile & Settings
        </Heading>

        {/* User Card */}
        <Card elevated style={styles.userCard}>
          <View style={styles.userRow}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
              <Text variant="lg" weight="bold" style={{ color: '#0B0F14' }}>
                {initials}
              </Text>
            </View>

            <View style={styles.userInfo}>
              <Text variant="base" weight="bold">
                {profile?.full_name || 'User'}
              </Text>
              <Text variant="sm" color="secondary">
                {profile?.email || user?.email || 'user@example.com'}
              </Text>
              <Badge
                label={`Currency: ${profile?.currency || 'INR'}`}
                variant="primary"
                size="sm"
                style={{ marginTop: 4 }}
              />
            </View>
          </View>
        </Card>

        {/* Salary & Finance Settings */}
        <Text variant="sm" color="secondary" weight="semibold" style={styles.sectionTitle}>
          FINANCES
        </Text>
        <Card elevated style={styles.settingsGroupCard}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/settings')}
          >
            <View style={styles.settingIconRow}>
              <CreditCard size={20} color={colors.primary} />
              <View style={styles.settingTextGroup}>
                <Text variant="base" weight="medium">
                  Salary & Accounts
                </Text>
                <Text variant="xs" color="secondary">
                  Manage salary date, allocations & bank accounts
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.secondaryText} />
          </TouchableOpacity>

          <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />

          <View style={styles.currencyRow}>
            <View style={styles.settingIconRow}>
              <Coins size={20} color={colors.secondary} />
              <Text variant="base" weight="medium" style={{ marginLeft: 8 }}>
                Currency
              </Text>
            </View>

            <View style={styles.currencyOptions}>
              {(['INR', 'USD', 'EUR', 'GBP'] as const).map((curr) => {
                const isSelected = (profile?.currency || 'INR') === curr;
                return (
                  <TouchableOpacity
                    key={curr}
                    onPress={() => handleUpdateCurrency(curr)}
                    style={[
                      styles.currPill,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      variant="xs"
                      weight={isSelected ? 'bold' : 'regular'}
                      style={{ color: isSelected ? '#0B0F14' : colors.mainText }}
                    >
                      {curr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Card>

        {/* Appearance & Theme */}
        <Text variant="sm" color="secondary" weight="semibold" style={styles.sectionTitle}>
          APPEARANCE
        </Text>
        <Card elevated style={styles.settingsGroupCard}>
          <View style={styles.themeRow}>
            {THEMES.map((t) => {
              const isSelected = mode === t.value;
              const IconComp = t.icon;
              return (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setMode(t.value as any)}
                  style={[
                    styles.themeBox,
                    {
                      backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <IconComp
                    size={20}
                    color={isSelected ? colors.primary : colors.secondaryText}
                  />
                  <Text
                    variant="xs"
                    weight={isSelected ? 'bold' : 'medium'}
                    style={{
                      color: isSelected ? colors.primary : colors.mainText,
                      marginTop: 4,
                    }}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Notification Preferences */}
        <Text variant="sm" color="secondary" weight="semibold" style={styles.sectionTitle}>
          NOTIFICATIONS
        </Text>
        <Card elevated style={styles.settingsGroupCard}>
          <View style={styles.switchRow}>
            <View style={styles.switchTextGroup}>
              <Text variant="base" weight="medium">
                Budget Alerts
              </Text>
              <Text variant="xs" color="secondary">
                Receive warnings when spending exceeds 80% of limit
              </Text>
            </View>
            <Switch
              value={budgetAlerts}
              onValueChange={setBudgetAlerts}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.mainText}
            />
          </View>

          <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />

          <View style={styles.switchRow}>
            <View style={styles.switchTextGroup}>
              <Text variant="base" weight="medium">
                Salary Reminders
              </Text>
              <Text variant="xs" color="secondary">
                Remind on monthly salary arrival date
              </Text>
            </View>
            <Switch
              value={salaryReminders}
              onValueChange={setSalaryReminders}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.mainText}
            />
          </View>
        </Card>

        {/* Security & Sign Out */}
        <Text variant="sm" color="secondary" weight="semibold" style={styles.sectionTitle}>
          SECURITY & SESSION
        </Text>
        <Card elevated style={styles.settingsGroupCard}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/(auth)/reset-password')}
          >
            <View style={styles.settingIconRow}>
              <Lock size={20} color={colors.secondaryText} />
              <Text variant="base" weight="medium" style={{ marginLeft: 8 }}>
                Change Password
              </Text>
            </View>
            <ChevronRight size={18} color={colors.secondaryText} />
          </TouchableOpacity>

          <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
            <View style={styles.settingIconRow}>
              <LogOut size={20} color={colors.error} />
              <Text variant="base" weight="semibold" style={{ color: colors.error, marginLeft: 8 }}>
                Sign Out
              </Text>
            </View>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  userCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  settingsGroupCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  settingIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTextGroup: {
    marginLeft: Spacing.md,
    gap: 2,
  },
  itemDivider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  currencyOptions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  currPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  themeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  themeBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  switchTextGroup: {
    flex: 1,
    marginRight: Spacing.md,
    gap: 2,
  },
});

