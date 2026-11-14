import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Pencil,
  Sun,
  Moon,
  Smartphone,
  Wallet,
  BarChart3,
  PieChart,
  Lock,
  LogOut,
  LogIn,
  UserPlus,
  RotateCcw,
  ChevronRight,
  Check,
  X,
  Calendar,
} from 'lucide-react-native';
import { useAppTheme, ThemeMode } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import { authService } from '../../services/authService';
import { THEME_OPTIONS } from '../../theme/colors';
import {
  Text,
  Heading,
  Input,
  Button,
  DemoDataBadge,
} from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { formatCurrency, CURRENCY_SYMBOLS } from '../../utils/currency';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';
import { SupportedCurrency } from '../../types/database';

const CURRENCIES: SupportedCurrency[] = ['INR', 'USD', 'EUR', 'GBP'];

const APPEARANCE_MODES: { label: string; value: ThemeMode; Icon: typeof Sun }[] = [
  { label: 'Light', value: 'light', Icon: Sun },
  { label: 'Dark', value: 'dark', Icon: Moon },
  { label: 'System', value: 'system', Icon: Smartphone },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, mode, themePalette, setMode, setThemePalette } = useAppTheme();
  const activeThemeOption = THEME_OPTIONS.find((t) => t.id === themePalette) ?? THEME_OPTIONS[0];

  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const demoProfile = useDemoStore((s) => s.demoProfile);
  const updateDemoProfile = useDemoStore((s) => s.updateDemoProfile);
  const resetDemoData = useDemoStore((s) => s.resetDemoData);

  const isDemo = !user;
  const activeProfile = isDemo ? demoProfile : profile;
  const currency: SupportedCurrency = (activeProfile?.currency as SupportedCurrency) || 'INR';

  const displayName = isDemo
    ? demoProfile.full_name
    : (profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User');

  const displayEmail = isDemo
    ? 'Interactive Demo Workspace'
    : (profile?.email || user?.email || '');

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase() || '')
    .join('') || 'M';

  // Edit Profile Modal state
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState(displayName);
  const [editCurrency, setEditCurrency] = useState<SupportedCurrency>(currency);
  const [editSalary, setEditSalary] = useState(String(activeProfile?.monthly_salary || ''));
  const [editSalaryDay, setEditSalaryDay] = useState(String(activeProfile?.salary_date || 1));
  const [savingProfile, setSavingProfile] = useState(false);

  const openEditModal = () => {
    setEditName(displayName);
    setEditCurrency(currency);
    setEditSalary(activeProfile?.monthly_salary ? String(activeProfile.monthly_salary) : '');
    setEditSalaryDay(String(activeProfile?.salary_date || 1));
    setEditVisible(true);
  };

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      toast.warning('Please enter your display name.', 'Name Required');
      return;
    }

    const parsedSalary = Math.max(0, Number(editSalary.replace(/[^0-9.]/g, '')) || 0);
    const parsedDay = Math.min(31, Math.max(1, parseInt(editSalaryDay, 10) || 1));

    try {
      setSavingProfile(true);
      if (isDemo) {
        updateDemoProfile({
          full_name: trimmedName,
          currency: editCurrency,
          monthly_salary: parsedSalary,
          salary_date: parsedDay,
        });
      } else if (user) {
        await authService.updateProfile(user.id, {
          full_name: trimmedName,
          currency: editCurrency,
          monthly_salary: parsedSalary,
          salary_date: parsedDay,
        });
        await refreshProfile();
      }
      setEditVisible(false);
      toast.success('Profile preferences updated.', 'Profile Saved');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Could not update your profile.'), 'Update Failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            toast.info('Signed out safely. Switched back to welcome.', 'Signed Out');
            router.replace('/(auth)/welcome');
          } catch (err: unknown) {
            toast.error(getErrorMessage(err, 'Unable to sign out right now.'));
          }
        },
      },
    ]);
  };

  const handleResetDemo = () => {
    Alert.alert(
      'Reset Demo Data',
      'Restore all sample transactions, budgets, goals, and split groups back to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetDemoData();
            toast.success('Sample transactions, budgets, and groups restored.', 'Demo Reset');
          },
        },
      ]
    );
  };

  const statusBarHeight = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 0;
  const topInset = Math.max(insets.top, statusBarHeight, Platform.OS === 'android' ? 28 : 16);
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 24 : 10);
  const tabHeight = 62 + bottomInset;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + (Platform.OS === 'android' ? 14 : 10),
            paddingBottom: tabHeight + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. HEADER */}
        <View style={styles.headerRow}>
          <Heading level={2} style={styles.screenTitle}>
            Profile
          </Heading>
          {isDemo ? <DemoDataBadge compact /> : null}
        </View>

        {/* 2. HERO IDENTITY CARD */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: colors.background === '#FFFFFF' ? 0.05 : 0.22,
              shadowRadius: 10,
              elevation: 2,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={[styles.avatarOuterRing, { borderColor: colors.primaryMuted, backgroundColor: colors.elevatedSurface }]}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}>
                <Text variant="lg" weight="extrabold" style={{ color: colors.primary, fontSize: 18 }}>
                  {initials}
                </Text>
              </View>
            </View>

            <View style={styles.heroMeta}>
              <Text variant="lg" weight="bold" numberOfLines={1}>
                {displayName}
              </Text>
              <Text variant="xs" color="secondary" numberOfLines={1} style={{ marginTop: 2 }}>
                {displayEmail}
              </Text>
              <View style={styles.badgeRow}>
                <View style={[styles.metaChip, { backgroundColor: colors.elevatedSurface }]}>
                  <Text variant="xs" weight="semibold" style={{ fontSize: 11 }}>
                    {CURRENCY_SYMBOLS[currency]} {currency}
                  </Text>
                </View>
                <View
                  style={[
                    styles.metaChip,
                    { backgroundColor: isDemo ? colors.warningMuted : colors.successMuted },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isDemo ? colors.warning : colors.positive },
                    ]}
                  />
                  <Text
                    variant="xs"
                    weight="bold"
                    style={{
                      fontSize: 10.5,
                      color: isDemo ? colors.warning : colors.positive,
                    }}
                  >
                    {isDemo ? 'DEMO SESSION' : 'CLOUD SYNCED'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={openEditModal}
              style={[styles.editPillBtn, { backgroundColor: colors.primaryMuted }]}
              accessibilityLabel="Edit profile"
            >
              <Pencil size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Compact 2-Col Financial Snapshot */}
          <View style={styles.snapshotGrid}>
            <TouchableOpacity
              style={[
                styles.snapshotCard,
                {
                  backgroundColor: isDark ? colors.elevatedSurface : colors.background,
                  borderColor: isDark ? colors.border : colors.borderLight,
                },
              ]}
              onPress={openEditModal}
              activeOpacity={0.75}
            >
              <View style={styles.snapshotLabelRow}>
                <View style={[styles.microIconCircle, { backgroundColor: colors.primaryMuted }]}>
                  <Wallet size={12} color={colors.primary} />
                </View>
                <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
                  Monthly Salary
                </Text>
              </View>
              <Text variant="sm" weight="extrabold" style={{ marginTop: 4, color: colors.mainText }}>
                {formatCurrency(Number(activeProfile?.monthly_salary || 0), currency)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.snapshotCard,
                {
                  backgroundColor: isDark ? colors.elevatedSurface : colors.background,
                  borderColor: isDark ? colors.border : colors.borderLight,
                },
              ]}
              onPress={openEditModal}
              activeOpacity={0.75}
            >
              <View style={styles.snapshotLabelRow}>
                <View style={[styles.microIconCircle, { backgroundColor: colors.secondaryMuted }]}>
                  <Calendar size={12} color={colors.secondary} />
                </View>
                <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
                  Salary Credit Day
                </Text>
              </View>
              <Text variant="sm" weight="extrabold" style={{ marginTop: 4, color: colors.mainText }}>
                Day {activeProfile?.salary_date || 1} of month
              </Text>
            </TouchableOpacity>
          </View>

          {/* Unauthenticated Auth CTA inside Hero */}
          {isDemo ? (
            <View style={styles.demoAuthRow}>
              <Button
                title="Sign In"
                size="sm"
                leftIcon={<LogIn size={15} color={colors.onPrimary} />}
                onPress={() => router.push('/(auth)/login')}
                buttonStyle={{ flex: 1 }}
              />
              <Button
                title="Create Account"
                variant="outline"
                size="sm"
                leftIcon={<UserPlus size={15} color={colors.primary} />}
                onPress={() => router.push('/(auth)/register')}
                buttonStyle={{ flex: 1 }}
              />
            </View>
          ) : null}
        </View>

        {/* 3. APPEARANCE & PALETTE */}
        <Text variant="xs" weight="bold" color="secondary" style={styles.sectionHeading}>
          APPEARANCE
        </Text>
        <View
          style={[
            styles.groupCard,
            { backgroundColor: colors.surface, borderColor: colors.borderLight },
          ]}
        >
          <View style={[styles.modeSegmented, { backgroundColor: colors.elevatedSurface }]}>
            {APPEARANCE_MODES.map(({ label, value, Icon }) => {
              const active = mode === value;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => setMode(value)}
                  activeOpacity={0.8}
                  style={[
                    styles.modeOption,
                    active && { backgroundColor: colors.surface },
                  ]}
                >
                  <Icon size={14} color={active ? colors.primary : colors.secondaryText} />
                  <Text
                    variant="xs"
                    weight={active ? 'bold' : 'medium'}
                    style={{ color: active ? colors.mainText : colors.secondaryText }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.paletteHeaderRow}>
            <Text variant="xs" weight="semibold" color="secondary" style={styles.paletteSubLabel}>
              MINIMALIST PALETTES
            </Text>
            <Text variant="xs" color="tertiary" numberOfLines={1} style={styles.paletteDescText}>
              {activeThemeOption.description}
            </Text>
          </View>

          <View style={styles.paletteGrid}>
            {THEME_OPTIONS.map((opt) => {
              const selected = themePalette === opt.id;
              const surfaceHint = isDark ? opt.previewBgDark : opt.previewBgLight;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setThemePalette(opt.id)}
                  activeOpacity={0.8}
                  style={[
                    styles.paletteCard,
                    {
                      backgroundColor: selected ? colors.primaryMuted : colors.elevatedSurface,
                      borderColor: selected ? colors.primary : colors.borderLight,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.swatchRing,
                      { backgroundColor: surfaceHint, borderColor: opt.previewColor },
                    ]}
                  >
                    <View style={[styles.swatchDot, { backgroundColor: opt.previewColor }]}>
                      <View style={[styles.swatchInner, { backgroundColor: opt.accentColor }]} />
                    </View>
                  </View>
                  <View style={styles.paletteLabelBox}>
                    <Text
                      variant="xs"
                      weight={selected ? 'bold' : 'medium'}
                      numberOfLines={1}
                      style={{ color: selected ? colors.primary : colors.mainText, fontSize: 11.5 }}
                    >
                      {opt.name}
                    </Text>
                  </View>
                  {selected ? (
                    <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                      <Check size={9} color={colors.onPrimary} strokeWidth={3} />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. WORKSPACE & FINANCES */}
        <Text variant="xs" weight="bold" color="secondary" style={styles.sectionHeading}>
          WORKSPACE & FINANCES
        </Text>
        <View
          style={[
            styles.groupCard,
            { backgroundColor: colors.surface, borderColor: colors.borderLight },
          ]}
        >
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: colors.primaryMuted }]}>
              <Wallet size={16} color={colors.primary} />
            </View>
            <View style={styles.menuTextCol}>
              <Text variant="sm" weight="semibold">
                Salary & Bank Accounts
              </Text>
              <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
                Manage accounts, balances & payday
              </Text>
            </View>
            <ChevronRight size={17} color={colors.tertiaryText} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/analytics')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: colors.successMuted }]}>
              <BarChart3 size={16} color={colors.positive} />
            </View>
            <View style={styles.menuTextCol}>
              <Text variant="sm" weight="semibold">
                Analytics & Reports
              </Text>
              <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
                Trends, breakdowns & CSV export
              </Text>
            </View>
            <ChevronRight size={17} color={colors.tertiaryText} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/(tabs)/budgets')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: colors.warningMuted }]}>
              <PieChart size={16} color={colors.warning} />
            </View>
            <View style={styles.menuTextCol}>
              <Text variant="sm" weight="semibold">
                Budgets & Savings Goals
              </Text>
              <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
                Track limits & financial milestones
              </Text>
            </View>
            <ChevronRight size={17} color={colors.tertiaryText} />
          </TouchableOpacity>
        </View>

        {/* 5. ACCOUNT & SECURITY */}
        <Text variant="xs" weight="bold" color="secondary" style={styles.sectionHeading}>
          ACCOUNT & SECURITY
        </Text>
        <View
          style={[
            styles.groupCard,
            { backgroundColor: colors.surface, borderColor: colors.borderLight },
          ]}
        >
          {isDemo ? (
            <>
              <TouchableOpacity
                style={styles.menuRow}
                onPress={handleResetDemo}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: colors.warningMuted }]}>
                  <RotateCcw size={16} color={colors.warning} />
                </View>
                <View style={styles.menuTextCol}>
                  <Text variant="sm" weight="semibold">
                    Reset Demo Data
                  </Text>
                  <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
                    Restore original sample entries & balances
                  </Text>
                </View>
                <ChevronRight size={17} color={colors.tertiaryText} />
              </TouchableOpacity>

              <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => router.push('/(auth)/login')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: colors.primaryMuted }]}>
                  <LogIn size={16} color={colors.primary} />
                </View>
                <View style={styles.menuTextCol}>
                  <Text variant="sm" weight="semibold" style={{ color: colors.primary }}>
                    Sign In to Sync Cloud Data
                  </Text>
                  <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
                    Switch from Demo to your personal ledger
                  </Text>
                </View>
                <ChevronRight size={17} color={colors.primary} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => router.push('/(auth)/forgot-password')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: colors.secondaryMuted }]}>
                  <Lock size={16} color={colors.secondary} />
                </View>
                <View style={styles.menuTextCol}>
                  <Text variant="sm" weight="semibold">
                    Reset Password
                  </Text>
                  <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
                    Send recovery link to {profile?.email || user?.email}
                  </Text>
                </View>
                <ChevronRight size={17} color={colors.tertiaryText} />
              </TouchableOpacity>

              <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

              <TouchableOpacity
                style={styles.menuRow}
                onPress={handleSignOut}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBox, { backgroundColor: colors.errorMuted }]}>
                  <LogOut size={16} color={colors.error} />
                </View>
                <View style={styles.menuTextCol}>
                  <Text variant="sm" weight="semibold" style={{ color: colors.error }}>
                    Sign Out
                  </Text>
                  <Text variant="xs" color="secondary" style={{ fontSize: 11 }}>
                    Log out and return to welcome or demo
                  </Text>
                </View>
                <ChevronRight size={17} color={colors.error} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
                paddingBottom: Math.max(insets.bottom, Spacing.lg),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Heading level={3}>Edit Profile</Heading>
              <TouchableOpacity
                onPress={() => setEditVisible(false)}
                style={[styles.closeBtn, { backgroundColor: colors.elevatedSurface }]}
              >
                <X size={18} color={colors.mainText} />
              </TouchableOpacity>
            </View>

            <Input
              label="Full Name"
              placeholder="Your name"
              value={editName}
              onChangeText={setEditName}
            />

            <Text variant="xs" weight="semibold" color="secondary" style={{ marginBottom: 6 }}>
              DEFAULT CURRENCY
            </Text>
            <View style={styles.currencyRow}>
              {CURRENCIES.map((curr) => {
                const selected = editCurrency === curr;
                return (
                  <TouchableOpacity
                    key={curr}
                    onPress={() => setEditCurrency(curr)}
                    style={[
                      styles.currencyPill,
                      {
                        backgroundColor: selected ? colors.primaryMuted : colors.elevatedSurface,
                        borderColor: selected ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      variant="xs"
                      weight={selected ? 'bold' : 'medium'}
                      style={{ color: selected ? colors.primary : colors.mainText }}
                    >
                      {CURRENCY_SYMBOLS[curr]} {curr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.twoColInputs}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Monthly Salary"
                  placeholder="0"
                  keyboardType="decimal-pad"
                  value={editSalary}
                  onChangeText={setEditSalary}
                />
              </View>
              <View style={{ width: 110 }}>
                <Input
                  label="Pay Day (1-31)"
                  placeholder="1"
                  keyboardType="number-pad"
                  value={editSalaryDay}
                  onChangeText={setEditSalaryDay}
                />
              </View>
            </View>

            <Button
              title="Save Changes"
              size="lg"
              loading={savingProfile}
              onPress={handleSaveProfile}
              leftIcon={<Check size={18} color={colors.onPrimary} />}
              buttonStyle={{ marginTop: Spacing.xs }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  screenTitle: {
    fontSize: 22,
    letterSpacing: -0.4,
  },
  heroCard: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: Spacing.md + 2,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarOuterRing: {
    padding: 3,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMeta: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  editPillBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  snapshotCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  snapshotLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  microIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoAuthRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sectionHeading: {
    fontSize: 10.5,
    letterSpacing: 1.1,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  groupCard: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modeSegmented: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  paletteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  paletteSubLabel: {
    fontSize: 10,
    letterSpacing: 0.9,
  },
  paletteDescText: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 4,
  },
  paletteCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    gap: 7,
  },
  paletteLabelBox: {
    flex: 1,
  },
  checkCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.xs,
    gap: Spacing.sm,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextCol: {
    flex: 1,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 48,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  currencyPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  twoColInputs: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
