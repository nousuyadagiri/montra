import React, { useState, useEffect, useMemo } from 'react';
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
import {
  Plus,
  ArrowDownLeft,
  ArrowLeftRight,
  Check,
  CreditCard,
  Wallet,
  ArrowRight,
} from 'lucide-react-native';
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
  LoadingState,
  DatePickerField,
} from '../../components/ui';
import { Spacing, BorderRadius, Shadows } from '../../theme/tokens';
import { CURRENCY_SYMBOLS, parseCurrencyInput, formatCurrency } from '../../utils/currency';
import { deduplicateCategories } from '../../utils/categories';

const TYPE_CONFIG = {
  expense: {
    label: 'Expense',
    color: '#E11D48',
    darkColor: '#FB7185',
    bg: '#FFF1F2',
    darkBg: 'rgba(244, 63, 94, 0.14)',
    border: '#FECDD3',
    darkBorder: 'rgba(244, 63, 94, 0.35)',
    Icon: Plus,
    placeholder: 'e.g. Groceries, Fuel, Dining',
  },
  income: {
    label: 'Income',
    color: '#059669',
    darkColor: '#34D399',
    bg: '#ECFDF5',
    darkBg: 'rgba(16, 185, 129, 0.14)',
    border: '#A7F3D0',
    darkBorder: 'rgba(16, 185, 129, 0.35)',
    Icon: ArrowDownLeft,
    placeholder: 'e.g. Monthly Salary, Freelance, Dividend',
  },
  transfer: {
    label: 'Transfer',
    color: '#4F46E5',
    darkColor: '#818CF8',
    bg: '#EEF2FF',
    darkBg: 'rgba(99, 102, 241, 0.14)',
    border: '#C7D2FE',
    darkBorder: 'rgba(99, 102, 241, 0.35)',
    Icon: ArrowLeftRight,
    placeholder: 'e.g. Savings transfer, Rent payout',
  },
};

const AMOUNT_PRESETS = [100, 500, 1000, 5000];

export default function AddTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: 'income' | 'expense' | 'transfer'; editId?: string }>();
  const editId = params.editId;
  const isEditing = Boolean(editId);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
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

  const activeTypeCfg = TYPE_CONFIG[type];
  const activeColor = isDark ? activeTypeCfg.darkColor : activeTypeCfg.color;
  const activeBg = isDark ? activeTypeCfg.darkBg : activeTypeCfg.bg;
  const activeBorder = isDark ? activeTypeCfg.darkBorder : activeTypeCfg.border;

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
      const filteredCats = deduplicateCategories(
        type === 'transfer'
          ? demoCategories
          : demoCategories.filter((c) => c.type === type),
        demoProfile.id
      );
      setCategories(filteredCats);
      if (filteredCats.length > 0) {
        setSelectedCategoryId((prev) => (prev && filteredCats.some((c) => c.id === prev) ? prev : filteredCats[0].id));
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
        const uniqueCats = deduplicateCategories(cats, user.id);
        setCategories(uniqueCats);
        if (uniqueCats.length > 0) {
          setSelectedCategoryId((prev) => (prev && uniqueCats.some((c) => c.id === prev) ? prev : uniqueCats[0].id));
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
  }, [user, isDemo, type, demoCategories, demoAccounts, demoProfile.id]);

  const displayCategories = useMemo(() => {
    return deduplicateCategories(categories, user?.id);
  }, [categories, user?.id]);

  const handleAddPreset = (increment: number) => {
    const current = parseCurrencyInput(amountStr) || 0;
    setAmountStr(String(current + increment));
  };

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
      <Header title={headerTitle} showBack />

      {initialLoading ? (
        <LoadingState message="Loading accounts & categories..." />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing['3xl'] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 1. SEGMENTED TRANSACTION TYPE SELECTOR */}
          <View
            style={[
              styles.typeSegmentedCard,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : colors.borderLight,
              },
              !isDark ? Shadows.sm : undefined,
            ]}
          >
            {(['expense', 'income', 'transfer'] as const).map((t) => {
              const isSelected = type === t;
              const cfg = TYPE_CONFIG[t];
              const TabIcon = cfg.Icon;
              const tabColor = isDark ? cfg.darkColor : cfg.color;
              const tabBg = isDark ? cfg.darkBg : cfg.bg;

              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  activeOpacity={0.8}
                  style={[
                    styles.typeTab,
                    isSelected && {
                      backgroundColor: tabBg,
                      borderColor: tabColor,
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <TabIcon
                    size={16}
                    color={isSelected ? tabColor : colors.secondaryText}
                    strokeWidth={isSelected ? 2.6 : 2}
                  />
                  <Text
                    variant="xs"
                    weight={isSelected ? 'bold' : 'medium'}
                    style={{
                      color: isSelected ? tabColor : colors.secondaryText,
                      marginLeft: 5,
                      fontSize: 12,
                    }}
                  >
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 2. HERO AMOUNT CARD */}
          <View
            style={[
              styles.heroAmountCard,
              {
                backgroundColor: colors.surface,
                borderColor: activeBorder,
              },
              !isDark ? Shadows.md : undefined,
            ]}
          >
            <View style={styles.amountTopMeta}>
              <View style={[styles.typeBadge, { backgroundColor: activeBg }]}>
                <Text variant="xs" weight="bold" style={{ color: activeColor, fontSize: 10.5 }}>
                  {activeTypeCfg.label.toUpperCase()} AMOUNT
                </Text>
              </View>
              <Text variant="xs" color="tertiary">
                {activeCurrency}
              </Text>
            </View>

            <View style={styles.amountInputRow}>
              <Text variant="3xl" weight="bold" style={{ color: activeColor, marginRight: 6 }}>
                {currencySymbol}
              </Text>
              <Input
                placeholder="0"
                keyboardType="decimal-pad"
                value={amountStr}
                onChangeText={setAmountStr}
                inputStyle={{ ...styles.bigAmountInput, color: colors.mainText }}
                containerStyle={styles.amountContainer}
                autoFocus={!isEditing}
              />
            </View>

            {/* Quick Presets */}
            <View style={styles.presetsRow}>
              {AMOUNT_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => handleAddPreset(p)}
                  activeOpacity={0.7}
                  style={[
                    styles.presetPill,
                    {
                      backgroundColor: colors.elevatedSurface,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  <Text variant="xs" weight="bold" style={{ color: colors.mainText, fontSize: 11 }}>
                    +{currencySymbol}{p >= 1000 ? `${p / 1000}k` : p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 3. TRANSACTION TITLE */}
          <Input
            label="Transaction Title"
            placeholder={activeTypeCfg.placeholder}
            value={title}
            onChangeText={setTitle}
          />

          {/* 4. INTERACTIVE DATE PICKER */}
          <DatePickerField
            label="Date of Transaction"
            value={date}
            onChange={setDate}
            helperText="Tap to pick any date or quick choose Today / Yesterday"
          />

          {/* 5. ACCOUNT SELECTOR */}
          {accounts.length > 0 ? (
            <View style={styles.sectionWrapper}>
              <Text variant="xs" weight="bold" color="secondary" style={styles.sectionHeading}>
                {type === 'transfer' ? 'FROM ACCOUNT' : 'PAY FROM ACCOUNT'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalPillScroll}>
                {accounts.map((acc) => {
                  const isSelected = selectedAccountId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => setSelectedAccountId(acc.id)}
                      activeOpacity={0.75}
                      style={[
                        styles.accountCard,
                        {
                          backgroundColor: isSelected ? activeBg : colors.surface,
                          borderColor: isSelected ? activeColor : colors.borderLight,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.accountIconBox,
                          { backgroundColor: isSelected ? colors.surface : colors.elevatedSurface },
                        ]}
                      >
                        <CreditCard
                          size={15}
                          color={isSelected ? activeColor : colors.secondaryText}
                        />
                      </View>
                      <View>
                        <Text
                          variant="xs"
                          weight="bold"
                          numberOfLines={1}
                          style={{ color: isSelected ? activeColor : colors.mainText }}
                        >
                          {acc.name}
                        </Text>
                        <Text variant="xs" color="tertiary" style={{ fontSize: 10 }}>
                          {formatCurrency(acc.balance || 0, activeCurrency)}
                        </Text>
                      </View>
                      {isSelected ? (
                        <Check size={14} color={activeColor} strokeWidth={2.8} style={{ marginLeft: 6 }} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* 6. TRANSFER DESTINATION ACCOUNT */}
          {type === 'transfer' && accounts.length > 1 ? (
            <View style={styles.sectionWrapper}>
              <Text variant="xs" weight="bold" color="secondary" style={styles.sectionHeading}>
                TO DESTINATION ACCOUNT
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalPillScroll}>
                {accounts
                  .filter((a) => a.id !== selectedAccountId)
                  .map((acc) => {
                    const isSelected = selectedToAccountId === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        onPress={() => setSelectedToAccountId(acc.id)}
                        activeOpacity={0.75}
                        style={[
                          styles.accountCard,
                          {
                            backgroundColor: isSelected ? activeBg : colors.surface,
                            borderColor: isSelected ? activeColor : colors.borderLight,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.accountIconBox,
                            { backgroundColor: isSelected ? colors.surface : colors.elevatedSurface },
                          ]}
                        >
                          <Wallet
                            size={15}
                            color={isSelected ? activeColor : colors.secondaryText}
                          />
                        </View>
                        <View>
                          <Text
                            variant="xs"
                            weight="bold"
                            numberOfLines={1}
                            style={{ color: isSelected ? activeColor : colors.mainText }}
                          >
                            {acc.name}
                          </Text>
                          <Text variant="xs" color="tertiary" style={{ fontSize: 10 }}>
                            {formatCurrency(acc.balance || 0, activeCurrency)}
                          </Text>
                        </View>
                        {isSelected ? (
                          <Check size={14} color={activeColor} strokeWidth={2.8} style={{ marginLeft: 6 }} />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          ) : null}

          {/* 7. CATEGORIES (For Income & Expense) */}
          {type !== 'transfer' && displayCategories.length > 0 ? (
            <View style={styles.sectionWrapper}>
              <Text variant="xs" weight="bold" color="secondary" style={styles.sectionHeading}>
                CATEGORY
              </Text>
              <View style={styles.categoriesGrid}>
                {displayCategories.map((c) => {
                  const isSelected = selectedCategoryId === c.id;
                  const dotColor = c.color || activeColor;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setSelectedCategoryId(c.id)}
                      activeOpacity={0.75}
                      style={[
                        styles.categoryTile,
                        {
                          backgroundColor: isSelected ? activeBg : colors.surface,
                          borderColor: isSelected ? activeColor : colors.borderLight,
                        },
                      ]}
                    >
                      <View style={[styles.catColorDot, { backgroundColor: dotColor }]} />
                      <Text
                        variant="xs"
                        weight={isSelected ? 'bold' : 'medium'}
                        numberOfLines={1}
                        style={{
                          color: isSelected ? activeColor : colors.mainText,
                          fontSize: 11.5,
                        }}
                      >
                        {c.name}
                      </Text>
                      {isSelected ? (
                        <Check size={11} color={activeColor} strokeWidth={2.8} style={{ marginLeft: 4 }} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* 8. PAYMENT METHOD SELECTOR */}
          <View style={styles.sectionWrapper}>
            <Text variant="xs" weight="bold" color="secondary" style={styles.sectionHeading}>
              PAYMENT METHOD
            </Text>
            <View style={styles.paymentMethodsRow}>
              {['UPI', 'Card', 'NetBanking', 'Cash'].map((m) => {
                const isSelected = paymentMethod === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setPaymentMethod(m)}
                    activeOpacity={0.75}
                    style={[
                      styles.methodPill,
                      {
                        backgroundColor: isSelected ? activeBg : colors.surface,
                        borderColor: isSelected ? activeColor : colors.borderLight,
                      },
                    ]}
                  >
                    <Text
                      variant="xs"
                      weight={isSelected ? 'bold' : 'medium'}
                      style={{
                        color: isSelected ? activeColor : colors.mainText,
                        fontSize: 11.5,
                      }}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 9. OPTIONAL NOTES */}
          <Input
            label="Optional Notes"
            placeholder="Additional context or remarks..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
          />

          {/* 10. ACTION SUBMIT BUTTON */}
          <Button
            title={`Save ${activeTypeCfg.label}`}
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleSave}
            rightIcon={<ArrowRight size={18} color={colors.onPrimary} />}
            buttonStyle={{ ...styles.saveBtn, backgroundColor: activeColor }}
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
  typeSegmentedCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    padding: 4,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  heroAmountCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },
  amountTopMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  amountContainer: {
    marginBottom: 0,
    width: 210,
  },
  bigAmountInput: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.sm,
  },
  presetPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  sectionWrapper: {
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    letterSpacing: 0.9,
    marginBottom: 8,
    marginLeft: 2,
    fontSize: 10.5,
  },
  horizontalPillScroll: {
    flexDirection: 'row',
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginRight: Spacing.sm,
    gap: 8,
  },
  accountIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  catColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  methodPill: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  saveBtn: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
});
