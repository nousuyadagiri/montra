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
  CurrencyText,
  Input,
  Button,
  Header,
  Card,
  Badge,
  LoadingState,
} from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { parseCurrencyInput, CURRENCY_SYMBOLS } from '../../utils/currency';
import {
  CreditCard,
  Calendar,
  Sparkles,
  Pencil,
  Trash2,
  Star,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
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

  const currencySymbol = CURRENCY_SYMBOLS[activeCurrency] || '₹';

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
        {/* Section 1: Monthly Salary Settings */}
        <Text variant="sm" weight="semibold" color="secondary" style={styles.sectionHeader}>
          MONTHLY SALARY SETUP
        </Text>
        <Card elevated style={styles.sectionCard}>
          <Input
            label="Monthly Take-Home Salary"
            placeholder="50000"
            prefix={currencySymbol}
            keyboardType="decimal-pad"
            value={salaryStr}
            onChangeText={setSalaryStr}
          />

          <Input
            label="Salary Credit Day of Month (1 - 31)"
            placeholder="1"
            keyboardType="number-pad"
            value={salaryDateStr}
            onChangeText={setSalaryDateStr}
            leftIcon={<Calendar size={18} color={colors.secondaryText} />}
          />

          <View style={styles.salaryActionRow}>
            <Button
              title="Save Salary"
              variant="primary"
              size="md"
              loading={savingSalary}
              onPress={handleSaveSalary}
              buttonStyle={{ flex: 1 }}
            />
            <Button
              title="Record Credit Now"
              variant="outline"
              size="md"
              onPress={handleRecordSalaryCredit}
              buttonStyle={{ flex: 1 }}
            />
          </View>
        </Card>

        {/* Section 2: Smart Suggested Salary Allocations */}
        {allocations.length > 0 && parseCurrencyInput(salaryStr) > 0 ? (
          <>
            <View style={styles.allocHeaderRow}>
              <View style={styles.allocTitleRow}>
                <Sparkles size={16} color={colors.primary} />
                <Text variant="sm" weight="semibold" color="secondary" style={{ marginLeft: 6 }}>
                  SMART SALARY ALLOCATION (50/30/20 BLUEPRINT)
                </Text>
              </View>
            </View>
            <Card elevated style={styles.sectionCard}>
              {allocations.map((a, idx) => (
                <View key={idx} style={styles.allocRow}>
                  <View style={styles.allocInfo}>
                    <Text variant="sm" weight="medium">
                      {a.category}
                    </Text>
                    <Text variant="xs" color="secondary">
                      {a.percentage}% of salary
                    </Text>
                  </View>
                  <CurrencyText
                    amount={a.suggestedAmount}
                    currency={activeCurrency}
                    variant="sm"
                    weight="bold"
                    style={{ color: colors.primary }}
                  />
                </View>
              ))}
            </Card>
          </>
        ) : null}

        {/* Section 3: Financial Accounts */}
        <View style={styles.accountsHeader}>
          <Text variant="sm" weight="semibold" color="secondary">
            CONNECTED ACCOUNTS
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
          >
            <Text variant="xs" color="primary" weight="bold">
              {showAddAccount ? 'Cancel' : '+ Add Account'}
            </Text>
          </TouchableOpacity>
        </View>

        {showAddAccount ? (
          <Card elevated style={styles.newAccountCard}>
            <Text variant="base" weight="bold" style={{ marginBottom: Spacing.sm }}>
              {editingAccountId ? 'Edit Account' : 'New Account'}
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

            <View style={styles.accountTypeRow}>
              {(['bank', 'cash', 'credit', 'wallet'] as const).map((t) => {
                const isSelected = newAccType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setNewAccType(t)}
                    style={[
                      styles.typePill,
                      {
                        backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      variant="xs"
                      weight={isSelected ? 'bold' : 'regular'}
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

            <Button
              title={editingAccountId ? 'Update Account' : 'Add Account'}
              variant="primary"
              size="md"
              loading={addingAccount}
              onPress={handleCreateOrUpdateAccount}
              buttonStyle={{ marginTop: Spacing.md }}
            />
          </Card>
        ) : null}

        <View style={styles.accountsList}>
          {accounts.map((acc) => (
            <Card key={acc.id} style={styles.accountCard}>
              <View style={styles.accountCardRow}>
                <View style={[styles.accIconBg, { backgroundColor: colors.primaryMuted }]}>
                  <CreditCard size={20} color={colors.primary} />
                </View>
                <View style={styles.accInfo}>
                  <View style={styles.accNameRow}>
                    <Text variant="base" weight="bold" numberOfLines={1}>
                      {acc.name}
                    </Text>
                    {acc.is_default ? (
                      <Badge label="Primary" variant="primary" size="sm" />
                    ) : null}
                  </View>
                  <Text variant="xs" color="secondary" style={{ textTransform: 'capitalize' }}>
                    {acc.type} Account
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <CurrencyText
                    amount={acc.balance}
                    currency={activeCurrency}
                    variant="base"
                    weight="bold"
                  />
                  <View style={styles.accActionRow}>
                    {!acc.is_default ? (
                      <TouchableOpacity
                        onPress={() => handleSetPrimary(acc)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        accessibilityLabel="Set as primary account"
                      >
                        <Star size={14} color={colors.warning} />
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      onPress={() => startEditAccount(acc)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      accessibilityLabel="Edit account"
                    >
                      <Pencil size={14} color={colors.primary} />
                    </TouchableOpacity>
                    {accounts.length > 1 ? (
                      <TouchableOpacity
                        onPress={() => handleDeleteAccount(acc)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        accessibilityLabel="Delete account"
                      >
                        <Trash2 size={14} color={colors.error} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            </Card>
          ))}
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
  sectionHeader: {
    marginBottom: Spacing.xs,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  sectionCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  salaryActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  allocHeaderRow: {
    marginBottom: Spacing.xs,
  },
  allocTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  allocRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  allocInfo: {
    gap: 2,
  },
  accountsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  newAccountCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  accountTypeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  typePill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  accountsList: {
    gap: Spacing.xs,
  },
  accountCard: {
    padding: Spacing.md,
  },
  accountCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  accInfo: {
    flex: 1,
    gap: 2,
  },
  accNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

