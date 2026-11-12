import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';
import { transactionService } from '../../services/transactionService';
import { Account, TransactionCategory, SupportedCurrency } from '../../types/database';
import {
  Text,
  Input,
  Button,
  Header,
  Card,
  LoadingState,
} from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { CURRENCY_SYMBOLS, parseCurrencyInput } from '../../utils/currency';
import { Check, CreditCard, Calendar } from 'lucide-react-native';

export default function AddTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: 'income' | 'expense' | 'transfer'; editId?: string }>();
  const editId = params.editId;
  const isEditing = Boolean(editId);
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const demoCategories = useDemoStore((s) => s.demoCategories);
  const demoAccounts = useDemoStore((s) => s.demoAccounts);
  const demoTransactions = useDemoStore((s) => s.demoTransactions);
  const demoProfile = useDemoStore((s) => s.demoProfile);
  const addDemoTransaction = useDemoStore((s) => s.addDemoTransaction);
  const updateDemoTransaction = useDemoStore((s) => s.updateDemoTransaction);

  const isDemo = !user;

  const [type, setType] = useState<'income' | 'expense' | 'transfer'>(
    params.type || 'expense'
  );
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedToAccountId, setSelectedToAccountId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!isDemo);

  // Prefill existing transaction in Edit mode
  useEffect(() => {
    if (!editId) return;
    if (isDemo) {
      const existing = demoTransactions.find((t) => t.id === editId);
      if (existing) {
        setType(existing.type);
        setTitle(existing.title);
        setAmountStr(String(existing.amount));
        setSelectedCategoryId(existing.category_id || null);
        setSelectedAccountId(existing.account_id || null);
        setSelectedToAccountId(existing.to_account_id || null);
        setPaymentMethod(existing.payment_method || 'UPI');
        setNotes(existing.notes || '');
        setDate(existing.date);
      }
      return;
    }

    transactionService
      .getTransactionById(editId)
      .then((existing) => {
        if (!existing) return;
        setType(existing.type);
        setTitle(existing.title);
        setAmountStr(String(existing.amount));
        setSelectedCategoryId(existing.category_id || null);
        setSelectedAccountId(existing.account_id || null);
        setSelectedToAccountId(existing.to_account_id || null);
        setPaymentMethod(existing.payment_method || 'UPI');
        setNotes(existing.notes || '');
        setDate(existing.date);
      })
      .catch((err) => toast.error(getErrorMessage(err, 'Failed to load transaction details.')));
  }, [editId, isDemo, demoTransactions]);

  // Load categories & accounts for either Demo or Real mode
  useEffect(() => {
    if (isDemo) {
      const filteredCats =
        type === 'transfer'
          ? demoCategories
          : demoCategories.filter((c) => c.type === type);
      setCategories(filteredCats);
      if (filteredCats.length > 0 && !filteredCats.some((c) => c.id === selectedCategoryId)) {
        setSelectedCategoryId(filteredCats[0].id);
      }
      setAccounts(demoAccounts);
      const defaultAcc = demoAccounts.find((a) => a.is_default) || demoAccounts[0];
      if (defaultAcc) {
        setSelectedAccountId((prev) => prev || defaultAcc.id);
      }
      if (demoAccounts.length > 1) {
        setSelectedToAccountId((prev) => prev || demoAccounts[1].id);
      }
      setInitialLoading(false);
      return;
    }

    if (!user) {
      setInitialLoading(false);
      return;
    }
    Promise.all([
      transactionService.getCategories(user.id, type === 'transfer' ? undefined : type),
      transactionService.getAccounts(user.id),
    ])
      .then(([cats, accs]) => {
        setCategories(cats);
        if (cats.length > 0 && !cats.some((c) => c.id === selectedCategoryId)) {
          setSelectedCategoryId(cats[0].id);
        }
        setAccounts(accs);
        const defaultAcc = accs.find((a) => a.is_default) || accs[0];
        if (defaultAcc) {
          setSelectedAccountId((prev) => prev || defaultAcc.id);
        }
        if (accs.length > 1) {
          setSelectedToAccountId((prev) => prev || accs[1].id);
        }
      })
      .catch((err) => toast.error(getErrorMessage(err, 'Unable to load categories and accounts.')))
      .finally(() => setInitialLoading(false));
  }, [user, isDemo, type, demoCategories, demoAccounts, selectedCategoryId]);

  const handleSave = async () => {
    const amount = parseCurrencyInput(amountStr);

    if (!title.trim()) {
      toast.warning('Please provide a title for this transaction.', 'Title Required');
      return;
    }
    if (amount <= 0) {
      toast.warning('Please enter a valid amount greater than zero.', 'Invalid Amount');
      return;
    }
    if (type !== 'transfer' && !selectedCategoryId) {
      toast.warning('Please select a category.', 'Category Required');
      return;
    }
    if (type === 'transfer' && selectedAccountId && selectedAccountId === selectedToAccountId) {
      toast.warning('Source and destination accounts must be different.', 'Invalid Transfer');
      return;
    }

    const payload = {
      title: title.trim(),
      amount,
      type,
      categoryId: type === 'transfer' ? null : selectedCategoryId,
      accountId: selectedAccountId,
      toAccountId: type === 'transfer' ? selectedToAccountId : null,
      date,
      paymentMethod,
      notes: notes.trim() || undefined,
    };

    try {
      setLoading(true);
      if (isDemo) {
        if (editId) {
          updateDemoTransaction(editId, payload);
        } else {
          addDemoTransaction(payload);
        }
      } else if (user) {
        if (editId) {
          await transactionService.updateTransaction(editId, payload);
        } else {
          await transactionService.createTransaction(user.id, payload);
        }
      }

      toast.success(
        editId
          ? 'Transaction updated.'
          : `${type === 'income' ? 'Income' : type === 'transfer' ? 'Transfer' : 'Expense'} saved!`
      );
      router.back();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to save transaction.'));
    } finally {
      setLoading(false);
    }
  };

  const activeCurrency: SupportedCurrency = ((isDemo ? demoProfile?.currency : profile?.currency) as SupportedCurrency) || 'INR';
  const currencySymbol = CURRENCY_SYMBOLS[activeCurrency] || '₹';

  const headerTitle = isEditing
    ? 'Edit Transaction'
    : type === 'income'
    ? 'Add Income'
    : type === 'transfer'
    ? 'Add Transfer'
    : 'Add Expense';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header
        title={headerTitle}
        showBack
      />

      {initialLoading ? (
        <LoadingState message="Loading accounts & categories..." />
      ) : (
        <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Type Toggle Tabs */}
        <View style={[styles.typeToggleRow, { backgroundColor: colors.surface }]}>
          {(['expense', 'income', 'transfer'] as const).map((t) => {
            const isSelected = type === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                style={[
                  styles.typeTab,
                  {
                    backgroundColor: isSelected ? colors.primary : 'transparent',
                  },
                ]}
              >
                <Text
                  variant="sm"
                  weight={isSelected ? 'bold' : 'medium'}
                  style={{
                    color: isSelected ? colors.onPrimary : colors.secondaryText,
                    textTransform: 'capitalize',
                  }}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Big Amount Card */}
        <Card elevated style={styles.amountCard}>
          <Text variant="xs" color="secondary" weight="semibold">
            AMOUNT
          </Text>
          <View style={styles.amountInputRow}>
            <Text variant="3xl" weight="bold" color="primary">
              {currencySymbol}
            </Text>
            <Input
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amountStr}
              onChangeText={setAmountStr}
              inputStyle={styles.bigAmountInput}
              containerStyle={styles.amountContainer}
            />
          </View>
        </Card>

        {/* Details Form */}
        <Input
          label="Transaction Title"
          placeholder="e.g. Grocery Store, Client Payment"
          value={title}
          onChangeText={setTitle}
        />

        <Input
          label="Date (YYYY-MM-DD)"
          placeholder="2026-11-09"
          value={date}
          onChangeText={setDate}
          leftIcon={<Calendar size={18} color={colors.secondaryText} />}
        />

        {/* Account Selector */}
        {accounts.length > 0 ? (
          <View style={styles.sectionWrapper}>
            <Text variant="sm" weight="medium" color="secondary" style={styles.sectionLabel}>
              {type === 'transfer' ? 'From Account' : 'Account'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              {accounts.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => setSelectedAccountId(acc.id)}
                    style={[
                      styles.choicePill,
                      {
                        backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <CreditCard
                      size={16}
                      color={isSelected ? colors.primary : colors.secondaryText}
                    />
                    <Text
                      variant="xs"
                      weight={isSelected ? 'bold' : 'regular'}
                      style={{
                        color: isSelected ? colors.primary : colors.mainText,
                        marginLeft: 6,
                      }}
                    >
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Transfer Destination Account */}
        {type === 'transfer' && accounts.length > 1 ? (
          <View style={styles.sectionWrapper}>
            <Text variant="sm" weight="medium" color="secondary" style={styles.sectionLabel}>
              To Account
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              {accounts
                .filter((a) => a.id !== selectedAccountId)
                .map((acc) => {
                  const isSelected = selectedToAccountId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => setSelectedToAccountId(acc.id)}
                      style={[
                        styles.choicePill,
                        {
                          backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <CreditCard
                        size={16}
                        color={isSelected ? colors.primary : colors.secondaryText}
                      />
                      <Text
                        variant="xs"
                        weight={isSelected ? 'bold' : 'regular'}
                        style={{
                          color: isSelected ? colors.primary : colors.mainText,
                          marginLeft: 6,
                        }}
                      >
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        ) : null}

        {/* Categories (for Income & Expense) */}
        {type !== 'transfer' && categories.length > 0 ? (
          <View style={styles.sectionWrapper}>
            <Text variant="sm" weight="medium" color="secondary" style={styles.sectionLabel}>
              Category
            </Text>
            <View style={styles.categoriesGrid}>
              {categories.map((c) => {
                const isSelected = selectedCategoryId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setSelectedCategoryId(c.id)}
                    style={[
                      styles.categoryTile,
                      {
                        backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.catColorDot,
                        { backgroundColor: c.color || colors.primary },
                      ]}
                    />
                    <Text
                      variant="xs"
                      weight={isSelected ? 'bold' : 'regular'}
                      style={{ color: isSelected ? colors.primary : colors.mainText }}
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Payment Method Selector */}
        <View style={styles.sectionWrapper}>
          <Text variant="sm" weight="medium" color="secondary" style={styles.sectionLabel}>
            Payment Method
          </Text>
          <View style={styles.paymentMethodsRow}>
            {['UPI', 'Card', 'NetBanking', 'Cash'].map((m) => {
              const isSelected = paymentMethod === m;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setPaymentMethod(m)}
                  style={[
                    styles.methodPill,
                    {
                      backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    variant="xs"
                    weight={isSelected ? 'bold' : 'regular'}
                    style={{ color: isSelected ? colors.primary : colors.mainText }}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Input
          label="Optional Notes"
          placeholder="Additional context or remarks..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        <Button
          title="Save Transaction"
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleSave}
          leftIcon={<Check size={20} color={colors.onPrimary} />}
          buttonStyle={{ marginTop: Spacing.lg }}
        />
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
  typeToggleRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  amountContainer: {
    marginBottom: 0,
    width: 200,
  },
  bigAmountInput: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionWrapper: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    marginBottom: Spacing.xs,
  },
  pillScroll: {
    flexDirection: 'row',
  },
  choicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  categoryTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  catColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  methodPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
});

