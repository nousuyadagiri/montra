import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { salaryService, SalaryAllocation } from '../../services/salaryService';
import { transactionService } from '../../services/transactionService';
import { Account } from '../../types/database';
import {
  Text,
  Heading,
  CurrencyText,
  Input,
  Button,
  Header,
  Card,
  Badge,
} from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { parseCurrencyInput, formatCurrency, CURRENCY_SYMBOLS } from '../../utils/currency';
import {
  CreditCard,
  Wallet,
  Check,
  Plus,
  Coins,
  Calendar,
  Sparkles,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [salaryStr, setSalaryStr] = useState(
    profile?.monthly_salary ? profile.monthly_salary.toString() : ''
  );
  const [salaryDateStr, setSalaryDateStr] = useState(
    profile?.salary_date ? profile.salary_date.toString() : '1'
  );
  const [allocations, setAllocations] = useState<SalaryAllocation[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [savingSalary, setSavingSalary] = useState(false);

  // New Account state
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<
    'bank' | 'cash' | 'credit' | 'investment' | 'wallet' | 'other'
  >('bank');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [addingAccount, setAddingAccount] = useState(false);

  useEffect(() => {
    if (!user) return;
    const salaryVal = parseCurrencyInput(salaryStr);
    const allocs = salaryService.calculateAllocations(salaryVal);
    setAllocations(allocs);

    transactionService.getAccounts(user.id).then(setAccounts);
  }, [user, salaryStr]);

  const handleSaveSalary = async () => {
    if (!user) return;
    const salary = parseCurrencyInput(salaryStr);
    const dateNum = parseInt(salaryDateStr, 10);

    if (isNaN(dateNum) || dateNum < 1 || dateNum > 31) {
      Alert.alert('Invalid Date', 'Salary payment date must be between 1 and 31.');
      return;
    }

    try {
      setSavingSalary(true);
      await salaryService.updateSalarySettings(user.id, salary, dateNum);
      await refreshProfile();
      Alert.alert('Saved', 'Monthly salary settings updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update salary settings.');
    } finally {
      setSavingSalary(false);
    }
  };

  const handleRecordSalaryCredit = async () => {
    if (!user) return;
    const salary = parseCurrencyInput(salaryStr);
    if (salary <= 0) {
      Alert.alert('Error', 'Please set a monthly salary amount first.');
      return;
    }
    const targetAcc = accounts[0];
    if (!targetAcc) {
      Alert.alert('Error', 'Please create a bank account first.');
      return;
    }

    Alert.alert(
      'Credit Monthly Salary',
      `Record ₹${salary} salary credit into "${targetAcc.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Credit',
          onPress: async () => {
            try {
              await salaryService.recordSalaryReceived(user.id, targetAcc.id, salary);
              const updatedAccs = await transactionService.getAccounts(user.id);
              setAccounts(updatedAccs);
              Alert.alert('Success', 'Monthly salary credited to your account!');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to record salary.');
            }
          },
        },
      ]
    );
  };

  const handleCreateAccount = async () => {
    if (!user) return;
    if (!newAccName.trim()) {
      Alert.alert('Required', 'Please enter account name.');
      return;
    }

    try {
      setAddingAccount(true);
      const acc = await transactionService.createAccount(user.id, {
        name: newAccName.trim(),
        type: newAccType,
        balance: parseCurrencyInput(newAccBalance),
        balance_minor: Math.round(parseCurrencyInput(newAccBalance) * 100),
        is_default: accounts.length === 0,
      });

      setAccounts([...accounts, acc]);
      setNewAccName('');
      setNewAccBalance('');
      setShowAddAccount(false);
      Alert.alert('Account Created', `"${acc.name}" added successfully.`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create account.');
    } finally {
      setAddingAccount(false);
    }
  };

  const currencySymbol = CURRENCY_SYMBOLS[profile?.currency || 'INR'] || '₹';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Salary & Accounts" showBack />
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
                    currency={profile?.currency || 'INR'}
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
          <TouchableOpacity onPress={() => setShowAddAccount(!showAddAccount)}>
            <Text variant="xs" color="primary" weight="bold">
              {showAddAccount ? 'Cancel' : '+ Add Account'}
            </Text>
          </TouchableOpacity>
        </View>

        {showAddAccount ? (
          <Card elevated style={styles.newAccountCard}>
            <Text variant="base" weight="bold" style={{ marginBottom: Spacing.sm }}>
              New Account
            </Text>

            <Input
              label="Account Name"
              placeholder="e.g. HDFC Salary A/c, Cash Wallet"
              value={newAccName}
              onChangeText={setNewAccName}
            />

            <Input
              label="Opening Balance"
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
              title="Add Account"
              variant="primary"
              size="md"
              loading={addingAccount}
              onPress={handleCreateAccount}
              buttonStyle={{ marginTop: Spacing.md }}
            />
          </Card>
        ) : null}

        <View style={styles.accountsList}>
          {accounts.map((acc) => (
            <Card key={acc.id} style={styles.accountCard}>
              <View style={styles.accountCardRow}>
                <View style={[styles.accIconBg, { backgroundColor: colors.surface }]}>
                  <CreditCard size={20} color={colors.primary} />
                </View>
                <View style={styles.accInfo}>
                  <View style={styles.accNameRow}>
                    <Text variant="base" weight="bold">
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
                <CurrencyText
                  amount={acc.balance}
                  currency={profile?.currency || 'INR'}
                  variant="base"
                  weight="bold"
                />
              </View>
            </Card>
          ))}
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
});

