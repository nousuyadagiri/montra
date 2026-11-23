import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';
import { salaryService, SalaryAllocation } from '../../services/salaryService';
import { transactionService } from '../../services/transactionService';
import { Account, SupportedCurrency } from '../../types/database';
import {
  Text,
  Input,
  Header,
  Card,
  Badge,
  LoadingState,
} from '../../components/ui';
import { Spacing, BorderRadius, Shadows } from '../../theme/tokens';
import { parseCurrencyInput, CURRENCY_SYMBOLS, formatCurrency } from '../../utils/currency';
import {
  CreditCard,
  Calendar,
  Sparkles,
  Pencil,
  Trash2,
  Star,
  Building,
  Banknote,
  Wallet,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
  Home,
  Utensils,
  Car,
  ShoppingBag,
  Check,
  Plus,
  ArrowDownLeft,
} from 'lucide-react-native';

const QUICK_SALARY_PRESETS = [5000, 10000, 25000];
const QUICK_PAYDAYS = [1, 5, 10, 25, 30];

const ALLOCATION_PALETTES = {
  needs: {
    accent: '#38BDF8', // Soft Sky Blue
    bg: 'rgba(56, 189, 248, 0.12)',
    pillBg: 'rgba(56, 189, 248, 0.16)',
    groupName: 'Needs (50%)',
    label: 'Needs',
  },
  savings: {
    accent: '#34D399', // Soft Mint
    bg: 'rgba(52, 211, 153, 0.12)',
    pillBg: 'rgba(52, 211, 153, 0.16)',
    groupName: 'Savings (30%)',
    label: 'Savings',
  },
  wants: {
    accent: '#A78BFA', // Soft Iris/Lavender
    bg: 'rgba(167, 139, 250, 0.12)',
    pillBg: 'rgba(167, 139, 250, 0.16)',
    groupName: 'Wants (20%)',
    label: 'Wants',
  },
};

const getAllocationIcon = (category: string) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('rent') || cat.includes('housing')) {
    return { Icon: Home, ...ALLOCATION_PALETTES.needs };
  }
  if (cat.includes('food') || cat.includes('grocer')) {
    return { Icon: Utensils, ...ALLOCATION_PALETTES.needs };
  }
  if (cat.includes('transport')) {
    return { Icon: Car, ...ALLOCATION_PALETTES.needs };
  }
  if (cat.includes('saving')) {
    return { Icon: PiggyBank, ...ALLOCATION_PALETTES.savings };
  }
  if (cat.includes('invest')) {
    return { Icon: TrendingUp, ...ALLOCATION_PALETTES.savings };
  }
  if (cat.includes('shop') || cat.includes('leisure')) {
    return { Icon: ShoppingBag, ...ALLOCATION_PALETTES.wants };
  }
  return { Icon: ShieldCheck, ...ALLOCATION_PALETTES.savings };
};

const getAccountIcon = (type: string) => {
  switch (type) {
    case 'cash':
      return { Icon: Banknote, color: '#34D399', bg: 'rgba(52, 211, 153, 0.12)' };
    case 'credit':
      return { Icon: CreditCard, color: '#F472B6', bg: 'rgba(244, 114, 182, 0.12)' };
    case 'wallet':
      return { Icon: Wallet, color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.12)' };
    case 'bank':
    default:
      return { Icon: Building, color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)' };
  }
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const demoProfile = useDemoStore((s) => s.demoProfile);
  const demoAccounts = useDemoStore((s) => s.demoAccounts);
  const updateDemoProfile = useDemoStore((s) => s.updateDemoProfile);
  const createDemoAccount = useDemoStore((s) => s.createDemoAccount);
  const updateDemoAccount = useDemoStore((s) => s.updateDemoAccount);
  const deleteDemoAccount = useDemoStore((s) => s.deleteDemoAccount);
  const addDemoTransaction = useDemoStore((s) => s.addDemoTransaction);

  const isDemo = !user;
  const activeProfile = isDemo ? demoProfile : profile;
  const activeCurrency: SupportedCurrency = (activeProfile?.currency as SupportedCurrency) || 'INR';

  const [salaryStr, setSalaryStr] = useState(
    activeProfile?.monthly_salary ? activeProfile.monthly_salary.toString() : ''
  );
  const [salaryDateStr, setSalaryDateStr] = useState(
    activeProfile?.salary_date ? activeProfile.salary_date.toString() : '1'
  );
  const [allocations, setAllocations] = useState<SalaryAllocation[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [initialLoading, setInitialLoading] = useState(!isDemo);
  const [savingSalary, setSavingSalary] = useState(false);

  // Add / Edit Account state
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<
    'bank' | 'cash' | 'credit' | 'investment' | 'wallet' | 'other'
  >('bank');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [addingAccount, setAddingAccount] = useState(false);

  const currencySymbol = CURRENCY_SYMBOLS[activeCurrency] || '₹';

  const loadAccounts = useCallback(async () => {
    if (isDemo) {
      setAccounts(demoAccounts);
      setInitialLoading(false);
      return;
    }
    if (!user) {
      setInitialLoading(false);
      return;
    }
    try {
      const accs = await transactionService.getAccounts(user.id);
      setAccounts(accs);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load bank accounts.'));
    } finally {
      setInitialLoading(false);
    }
  }, [isDemo, user, demoAccounts]);

  useEffect(() => {
    const salaryVal = parseCurrencyInput(salaryStr);
    setAllocations(salaryService.calculateAllocations(salaryVal));
  }, [salaryStr]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleAddSalaryPreset = (increment: number) => {
    const current = parseCurrencyInput(salaryStr) || 0;
    setSalaryStr(String(current + increment));
  };

  const handleSaveSalary = async () => {
    const salary = parseCurrencyInput(salaryStr);
    const dateNum = parseInt(salaryDateStr, 10);

    if (isNaN(dateNum) || dateNum < 1 || dateNum > 31) {
      toast.warning('Salary payment date must be between 1 and 31.', 'Invalid Date');
      return;
    }

    try {
      setSavingSalary(true);
      if (isDemo) {
        updateDemoProfile({ monthly_salary: salary, salary_date: dateNum });
      } else if (user) {
        await salaryService.updateSalarySettings(user.id, salary, dateNum);
        await refreshProfile();
      }
      toast.success('Monthly salary settings updated.', 'Saved');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update salary settings.'));
    } finally {
      setSavingSalary(false);
    }
  };

  const handleRecordSalaryCredit = async () => {
    const salary = parseCurrencyInput(salaryStr);
    if (salary <= 0) {
      toast.warning('Please set a monthly salary amount first.');
      return;
    }
    const targetAcc = accounts.find((a) => a.is_default) || accounts[0];
    if (!targetAcc) {
      toast.warning('Please create a bank account first.');
      return;
    }

    Alert.alert(
      'Credit Monthly Salary',
      `Record ${currencySymbol}${salary} salary credit into "${targetAcc.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Credit',
          onPress: async () => {
            try {
              if (isDemo) {
                addDemoTransaction({
                  title: 'Monthly Salary Credit',
                  amount: salary,
                  type: 'income',
                  accountId: targetAcc.id,
                  categoryId: 'demo-cat-salary',
                  date: new Date().toISOString().split('T')[0],
                  paymentMethod: 'NetBanking',
                });
              } else if (user) {
                await salaryService.recordSalaryReceived(user.id, targetAcc.id, salary);
              }
              await loadAccounts();
              toast.success(`Credited to "${targetAcc.name}"!`, 'Salary Recorded');
            } catch (err: unknown) {
              toast.error(getErrorMessage(err, 'Failed to record salary.'));
            }
          },
        },
      ]
    );
  };

  const resetAccountForm = () => {
    setEditingAccountId(null);
    setNewAccName('');
    setNewAccBalance('');
    setNewAccType('bank');
    setShowAddAccount(false);
  };

  const startEditAccount = (acc: Account) => {
    setEditingAccountId(acc.id);
    setNewAccName(acc.name);
    setNewAccBalance(String(acc.balance));
    setNewAccType(acc.type);
    setShowAddAccount(true);
  };

  const handleCreateOrUpdateAccount = async () => {
    if (!newAccName.trim()) {
      toast.warning('Please enter an account name.', 'Name Required');
      return;
    }

    const parsedBal = parseCurrencyInput(newAccBalance);

    try {
      setAddingAccount(true);
      if (isDemo) {
        if (editingAccountId) {
          updateDemoAccount(editingAccountId, {
            name: newAccName.trim(),
            type: newAccType,
            balance: parsedBal,
          });
        } else {
          createDemoAccount({
            name: newAccName.trim(),
            type: newAccType,
            balance: parsedBal,
            balance_minor: Math.round(parsedBal * 100),
            is_default: accounts.length === 0,
          });
        }
      } else if (user) {
        if (editingAccountId) {
          await transactionService.updateAccount(editingAccountId, {
            name: newAccName.trim(),
            type: newAccType,
            balance: parsedBal,
          });
        } else {
          await transactionService.createAccount(user.id, {
            name: newAccName.trim(),
            type: newAccType,
            balance: parsedBal,
            balance_minor: Math.round(parsedBal * 100),
            is_default: accounts.length === 0,
          });
        }
      }

      toast.success(editingAccountId ? 'Account updated.' : `Account "${newAccName.trim()}" added!`);
      await loadAccounts();
      resetAccountForm();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to save account.'));
    } finally {
      setAddingAccount(false);
    }
  };

  const handleSetPrimary = async (acc: Account) => {
    if (acc.is_default) return;
    try {
      if (isDemo) {
        updateDemoAccount(acc.id, { is_default: true });
      } else if (user) {
        await transactionService.setDefaultAccount(user.id, acc.id);
      }
      toast.success(`"${acc.name}" set as primary account.`);
      await loadAccounts();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update primary account.'));
    }
  };

  const handleDeleteAccount = (acc: Account) => {
    if (accounts.length <= 1) {
      toast.warning('You need at least one active account.');
      return;
    }
    Alert.alert('Delete Account', `Delete "${acc.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (isDemo) {
              deleteDemoAccount(acc.id);
            } else {
              await transactionService.deleteAccount(acc.id);
            }
            toast.success(`Account "${acc.name}" deleted.`);
            await loadAccounts();
          } catch (err: unknown) {
            toast.error(getErrorMessage(err, 'Failed to delete account.'));
          }
        },
      },
    ]);
  };

  const currentSalaryNum = parseCurrencyInput(salaryStr) || 0;
  const needsTotal = Math.round(currentSalaryNum * 0.5);
  const wantsTotal = Math.round(currentSalaryNum * 0.2);
  const savingsTotal = Math.round(currentSalaryNum * 0.3);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header title="Salary & Accounts" showBack />
      {initialLoading ? (
        <LoadingState message="Loading accounts & salary settings..." />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing['3xl'] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Executive Salary Setup Hero Card */}
          <View style={styles.sectionHeaderRow}>
            <Text variant="xs" weight="bold" color="secondary" style={styles.sectionTitle}>
              MONTHLY SALARY SETUP
            </Text>
          </View>

          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
              !isDark ? Shadows.sm : undefined,
            ]}
          >
            {/* Take-Home Salary Input with Presets */}
            <View style={styles.salaryInputGroup}>
              <Text variant="xs" weight="semibold" color="secondary" style={{ marginBottom: 6 }}>
                Monthly Take-Home Salary
              </Text>
              <Input
                placeholder="50000"
                prefix={currencySymbol}
                keyboardType="decimal-pad"
                value={salaryStr}
                onChangeText={setSalaryStr}
                inputStyle={{ fontSize: 22, fontWeight: '700', color: colors.mainText }}
                containerStyle={{ marginBottom: Spacing.xs }}
              />

              {/* Quick Increment Chips */}
              <View style={styles.presetsRow}>
                {QUICK_SALARY_PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => handleAddSalaryPreset(p)}
                    activeOpacity={0.7}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: colors.primaryMuted,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    <Text variant="xs" weight="bold" style={{ color: colors.primary, fontSize: 11 }}>
                      +{currencySymbol}{p >= 1000 ? `${p / 1000}k` : p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Payday Selection Strip */}
            <View style={styles.paydaySection}>
              <View style={styles.paydayLabelRow}>
                <Calendar size={13} color={colors.primary} />
                <Text variant="xs" weight="semibold" color="secondary" style={{ marginLeft: 6 }}>
                  Salary Credit Day of Month (1 - 31)
                </Text>
              </View>

              <View style={styles.paydayChipsRow}>
                {QUICK_PAYDAYS.map((day) => {
                  const isSelected = salaryDateStr === String(day);
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => setSalaryDateStr(String(day))}
                      activeOpacity={0.75}
                      style={[
                        styles.paydayChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : '#F4F5F7',
                          borderColor: isSelected ? colors.primary : 'transparent',
                        },
                      ]}
                    >
                      <Text
                        variant="xs"
                        weight="bold"
                        style={{ color: isSelected ? colors.onPrimary : colors.mainText }}
                      >
                        Day {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.salaryActionRow}>
              <TouchableOpacity
                onPress={handleSaveSalary}
                disabled={savingSalary}
                activeOpacity={0.8}
                style={[styles.saveSalaryBtn, { backgroundColor: colors.primary }]}
              >
                <Check size={15} color={colors.onPrimary} strokeWidth={2.5} />
                <Text variant="xs" weight="bold" style={{ color: colors.onPrimary, marginLeft: 6 }}>
                  {savingSalary ? 'Saving...' : 'Save Salary'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRecordSalaryCredit}
                activeOpacity={0.8}
                style={[
                  styles.recordCreditBtn,
                  {
                    backgroundColor: isDark ? colors.elevatedSurface : '#F4F5F7',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                <ArrowDownLeft size={15} color={colors.primary} strokeWidth={2.2} />
                <Text variant="xs" weight="bold" style={{ color: colors.primary, marginLeft: 6 }}>
                  Record Credit Now
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section 2: Smart Salary Allocation (50/30/20 Blueprint) */}
          {allocations.length > 0 && currentSalaryNum > 0 ? (
            <View style={styles.sectionWrapper}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={15} color={colors.primary} />
                  <Text variant="xs" weight="bold" color="secondary" style={styles.sectionTitle}>
                    SMART ALLOCATION (50/30/20 BLUEPRINT)
                  </Text>
                </View>
              </View>

              {/* 50/30/20 Summary Pillar Card */}
              <View
                style={[
                  styles.allocationCard,
                  {
                    backgroundColor: isDark ? colors.surface : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  },
                  !isDark ? Shadows.sm : undefined,
                ]}
              >
                {/* Visual Ratio Progress Bar */}
                <View
                  style={[
                    styles.ratioBarContainer,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' },
                  ]}
                >
                  <View style={[styles.ratioBarSegment, { flex: 5, backgroundColor: ALLOCATION_PALETTES.needs.accent }]} />
                  <View style={[styles.ratioBarSegment, { flex: 3, backgroundColor: ALLOCATION_PALETTES.savings.accent }]} />
                  <View style={[styles.ratioBarSegment, { flex: 2, backgroundColor: ALLOCATION_PALETTES.wants.accent }]} />
                </View>

                {/* Ratio Pillar Badges */}
                <View style={styles.ratioPillarsRow}>
                  <View
                    style={[
                      styles.pillarCard,
                      {
                        backgroundColor: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(56, 189, 248, 0.06)',
                        borderColor: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(56, 189, 248, 0.14)',
                      },
                    ]}
                  >
                    <View style={styles.pillarHeader}>
                      <View style={[styles.ratioDot, { backgroundColor: ALLOCATION_PALETTES.needs.accent }]} />
                      <Text style={[styles.pillarBadgeText, { color: ALLOCATION_PALETTES.needs.accent }]}>
                        50%
                      </Text>
                    </View>
                    <Text variant="xs" weight="semibold" style={{ color: colors.secondaryText, marginTop: 4 }}>
                      Needs
                    </Text>
                    <Text variant="xs" weight="bold" style={{ color: colors.mainText, marginTop: 2 }}>
                      {formatCurrency(needsTotal, activeCurrency)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.pillarCard,
                      {
                        backgroundColor: isDark ? 'rgba(52, 211, 153, 0.08)' : 'rgba(52, 211, 153, 0.06)',
                        borderColor: isDark ? 'rgba(52, 211, 153, 0.18)' : 'rgba(52, 211, 153, 0.14)',
                      },
                    ]}
                  >
                    <View style={styles.pillarHeader}>
                      <View style={[styles.ratioDot, { backgroundColor: ALLOCATION_PALETTES.savings.accent }]} />
                      <Text style={[styles.pillarBadgeText, { color: ALLOCATION_PALETTES.savings.accent }]}>
                        30%
                      </Text>
                    </View>
                    <Text variant="xs" weight="semibold" style={{ color: colors.secondaryText, marginTop: 4 }}>
                      Savings
                    </Text>
                    <Text variant="xs" weight="bold" style={{ color: colors.mainText, marginTop: 2 }}>
                      {formatCurrency(savingsTotal, activeCurrency)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.pillarCard,
                      {
                        backgroundColor: isDark ? 'rgba(167, 139, 250, 0.08)' : 'rgba(167, 139, 250, 0.06)',
                        borderColor: isDark ? 'rgba(167, 139, 250, 0.18)' : 'rgba(167, 139, 250, 0.14)',
                      },
                    ]}
                  >
                    <View style={styles.pillarHeader}>
                      <View style={[styles.ratioDot, { backgroundColor: ALLOCATION_PALETTES.wants.accent }]} />
                      <Text style={[styles.pillarBadgeText, { color: ALLOCATION_PALETTES.wants.accent }]}>
                        20%
                      </Text>
                    </View>
                    <Text variant="xs" weight="semibold" style={{ color: colors.secondaryText, marginTop: 4 }}>
                      Wants
                    </Text>
                    <Text variant="xs" weight="bold" style={{ color: colors.mainText, marginTop: 2 }}>
                      {formatCurrency(wantsTotal, activeCurrency)}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                      marginVertical: Spacing.md,
                    },
                  ]}
                />

                {/* Category Allocations List */}
                <View style={styles.allocationsList}>
                  {allocations.map((a, idx) => {
                    const cfg = getAllocationIcon(a.category);
                    const IconComp = cfg.Icon;
                    return (
                      <View
                        key={idx}
                        style={[
                          styles.allocRow,
                          idx !== allocations.length - 1 && [
                            styles.allocRowBorder,
                            { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)' },
                          ],
                        ]}
                      >
                        <View style={[styles.allocIconCircle, { backgroundColor: cfg.bg }]}>
                          <IconComp size={16} color={cfg.accent} strokeWidth={2.2} />
                        </View>

                        <View style={styles.allocDetailsCol}>
                          <View style={styles.allocTextRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text variant="sm" weight="semibold" numberOfLines={1} style={{ color: colors.mainText }}>
                                {a.category}
                              </Text>
                              <View style={[styles.allocPillarPill, { backgroundColor: cfg.pillBg }]}>
                                <Text style={[styles.allocPillarPillText, { color: cfg.accent }]}>
                                  {cfg.label}
                                </Text>
                              </View>
                            </View>
                            <Text variant="sm" weight="bold" style={{ color: colors.mainText }}>
                              {formatCurrency(a.suggestedAmount, activeCurrency)}
                            </Text>
                          </View>

                          {/* Progress bar + percentage */}
                          <View style={styles.allocProgressRow}>
                            <View
                              style={[
                                styles.allocProgressBarTrack,
                                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' },
                              ]}
                            >
                              <View
                                style={[
                                  styles.allocProgressBarFill,
                                  {
                                    width: `${Math.min(100, a.percentage * 3.5)}%`,
                                    backgroundColor: cfg.accent,
                                  },
                                ]}
                              />
                            </View>
                            <Text variant="xs" color="secondary" style={styles.allocPctText}>
                              {a.percentage}%
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          ) : null}

          {/* Section 3: Financial Connected Accounts */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeaderRow}>
              <Text variant="xs" weight="bold" color="secondary" style={styles.sectionTitle}>
                CONNECTED ACCOUNTS ({accounts.length})
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (showAddAccount) {
                    resetAccountForm();
                  } else {
                    setEditingAccountId(null);
                    setShowAddAccount(true);
                  }
                }}
                style={[
                  styles.addAccountPillBtn,
                  { backgroundColor: showAddAccount ? colors.expenseMuted : colors.primaryMuted },
                ]}
              >
                <Plus size={13} color={showAddAccount ? colors.negative : colors.primary} />
                <Text
                  variant="xs"
                  weight="bold"
                  style={{ color: showAddAccount ? colors.negative : colors.primary, marginLeft: 4 }}
                >
                  {showAddAccount ? 'Cancel' : 'Add Account'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Inline Add / Edit Account Form */}
            {showAddAccount ? (
              <Card elevated style={styles.newAccountCard}>
                <Text variant="sm" weight="bold" style={{ marginBottom: Spacing.sm }}>
                  {editingAccountId ? 'Edit Account' : 'Connect New Account'}
                </Text>

                <Input
                  label="Account Name"
                  placeholder="e.g. HDFC Salary A/c, Cash Wallet"
                  value={newAccName}
                  onChangeText={setNewAccName}
                />

                <Input
                  label={editingAccountId ? 'Current Balance' : 'Opening Balance'}
                  placeholder="0.00"
                  prefix={currencySymbol}
                  keyboardType="decimal-pad"
                  value={newAccBalance}
                  onChangeText={setNewAccBalance}
                />

                <Text variant="xs" weight="semibold" color="secondary" style={{ marginBottom: 6 }}>
                  ACCOUNT TYPE
                </Text>
                <View style={styles.accountTypeRow}>
                  {(['bank', 'cash', 'credit', 'wallet'] as const).map((t) => {
                    const isSelected = newAccType === t;
                    const typeIcon = getAccountIcon(t);
                    const TypeIconComp = typeIcon.Icon;
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setNewAccType(t)}
                        style={[
                          styles.typePill,
                          {
                            backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                            borderColor: isSelected ? colors.primary : colors.borderLight,
                          },
                        ]}
                      >
                        <TypeIconComp
                          size={14}
                          color={isSelected ? colors.primary : colors.secondaryText}
                          style={{ marginRight: 5 }}
                        />
                        <Text
                          variant="xs"
                          weight={isSelected ? 'bold' : 'medium'}
                          style={{
                            color: isSelected ? colors.primary : colors.mainText,
                            textTransform: 'capitalize',
                          }}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  onPress={handleCreateOrUpdateAccount}
                  disabled={addingAccount}
                  activeOpacity={0.8}
                  style={[styles.saveAccountBtn, { backgroundColor: colors.primary }]}
                >
                  <Check size={16} color={colors.onPrimary} />
                  <Text variant="sm" weight="bold" style={{ color: colors.onPrimary, marginLeft: 6 }}>
                    {addingAccount ? 'Saving...' : editingAccountId ? 'Update Account' : 'Save Account'}
                  </Text>
                </TouchableOpacity>
              </Card>
            ) : null}

            {/* Accounts List */}
            <View style={styles.accountsList}>
              {accounts.map((acc) => {
                const accIcon = getAccountIcon(acc.type);
                const AccIconComp = accIcon.Icon;

                return (
                  <View
                    key={acc.id}
                    style={[
                      styles.accountCard,
                      {
                        backgroundColor: isDark ? colors.surface : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                      },
                      !isDark ? Shadows.sm : undefined,
                    ]}
                  >
                    <View style={styles.accountCardRow}>
                      <View style={[styles.accIconBg, { backgroundColor: accIcon.bg }]}>
                        <AccIconComp size={18} color={accIcon.color} strokeWidth={2.2} />
                      </View>

                      <View style={styles.accInfo}>
                        <View style={styles.accNameRow}>
                          <Text variant="sm" weight="bold" numberOfLines={1} style={{ color: colors.mainText }}>
                            {acc.name}
                          </Text>
                          {acc.is_default ? (
                            <Badge label="Primary" variant="primary" size="sm" />
                          ) : null}
                        </View>
                        <Text variant="xs" color="secondary" style={{ textTransform: 'capitalize', marginTop: 2, fontSize: 11 }}>
                          {acc.type} Account
                        </Text>
                      </View>

                      <View style={styles.accRightCol}>
                        <Text variant="base" weight="extrabold" style={{ color: colors.mainText }}>
                          {formatCurrency(acc.balance, activeCurrency)}
                        </Text>

                        <View style={styles.accActionRow}>
                          {!acc.is_default ? (
                            <TouchableOpacity
                              onPress={() => handleSetPrimary(acc)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={[
                                styles.actionPillBtn,
                                {
                                  backgroundColor: isDark ? colors.elevatedSurface : '#F4F5F7',
                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                },
                              ]}
                              accessibilityLabel="Set as primary"
                            >
                              <Star size={12} color={colors.secondaryText} />
                            </TouchableOpacity>
                          ) : null}

                          <TouchableOpacity
                            onPress={() => startEditAccount(acc)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={[
                              styles.actionPillBtn,
                              {
                                backgroundColor: isDark ? colors.elevatedSurface : '#F4F5F7',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                              },
                            ]}
                            accessibilityLabel="Edit account"
                          >
                            <Pencil size={12} color={colors.primary} />
                          </TouchableOpacity>

                          {accounts.length > 1 ? (
                            <TouchableOpacity
                              onPress={() => handleDeleteAccount(acc)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={[
                                styles.actionPillBtn,
                                {
                                  backgroundColor: isDark ? colors.elevatedSurface : '#F4F5F7',
                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                },
                              ]}
                              accessibilityLabel="Delete account"
                            >
                              <Trash2 size={12} color={colors.error} />
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    letterSpacing: 0.5,
  },
  heroCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  salaryInputGroup: {
    marginBottom: Spacing.md,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  paydaySection: {
    marginBottom: Spacing.lg,
  },
  paydayLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  paydayChipsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  paydayChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  salaryActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  saveSalaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  recordCreditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  sectionWrapper: {
    marginBottom: Spacing.lg,
  },
  allocationCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
  },
  ratioBarContainer: {
    height: 6,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    overflow: 'hidden',
    gap: 3,
    marginBottom: Spacing.md,
  },
  ratioBarSegment: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  ratioPillarsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  pillarCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillarBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ratioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  divider: {
    height: 1,
  },
  allocationsList: {
    gap: 0,
  },
  allocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  allocRowBorder: {
    borderBottomWidth: 1,
  },
  allocIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  allocDetailsCol: {
    flex: 1,
  },
  allocTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  allocPillarPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: BorderRadius.full,
  },
  allocPillarPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  allocProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  allocProgressBarTrack: {
    flex: 1,
    height: 4,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  allocProgressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  allocPctText: {
    fontSize: 10.5,
    marginLeft: 8,
    fontWeight: '500',
    width: 28,
    textAlign: 'right',
  },
  addAccountPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  newAccountCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
  },
  accountTypeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  typePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  saveAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  accountsList: {
    gap: Spacing.sm,
  },
  accountCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  accountCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  accInfo: {
    flex: 1,
  },
  accNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accRightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  accActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPillBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
