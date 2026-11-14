import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import { transactionService } from '../../services/transactionService';
import { Transaction, SupportedCurrency } from '../../types/database';
import {
  Text,
  Header,
  LoadingState,
  ErrorState,
} from '../../components/ui';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';
import { Spacing, BorderRadius, Shadows } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import {
  Trash2,
  Pencil,
  Calendar,
  CreditCard,
  Tag,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Utensils,
  Coffee,
  Car,
  Fuel,
  Home,
  Zap,
  ShoppingBag,
  Film,
  Wallet,
  Receipt,
  FileText,
  Building,
} from 'lucide-react-native';

const getTransactionVisuals = (transaction: Transaction, isDark: boolean) => {
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const title = (transaction.title || '').toLowerCase();
  const catName = (transaction.category?.name || '').toLowerCase();
  const searchStr = `${title} ${catName}`;

  if (isIncome) {
    return {
      Icon: ArrowDownLeft,
      color: '#10B981',
      bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
      typeLabel: 'Income Inflow',
      pillBg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
      pillColor: '#10B981',
    };
  }

  if (isTransfer) {
    return {
      Icon: ArrowLeftRight,
      color: '#6366F1',
      bg: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
      typeLabel: 'Account Transfer',
      pillBg: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
      pillColor: '#6366F1',
    };
  }

  // Expense categories
  if (
    searchStr.includes('milk') ||
    searchStr.includes('coffee') ||
    searchStr.includes('tea') ||
    searchStr.includes('cafe') ||
    searchStr.includes('chai')
  ) {
    return {
      Icon: Coffee,
      color: '#D97706',
      bg: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FFFBEB',
      typeLabel: 'Expense Outflow',
      pillBg: isDark ? 'rgba(244, 63, 94, 0.15)' : '#FFF1F2',
      pillColor: '#E11D48',
    };
  }

  if (
    searchStr.includes('food') ||
    searchStr.includes('dining') ||
    searchStr.includes('grocer') ||
    searchStr.includes('restaurant') ||
    searchStr.includes('veg') ||
    searchStr.includes('snack')
  ) {
    return {
      Icon: Utensils,
      color: '#10B981',
      bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
      typeLabel: 'Expense Outflow',
      pillBg: isDark ? 'rgba(244, 63, 94, 0.15)' : '#FFF1F2',
      pillColor: '#E11D48',
    };
  }

  if (
    searchStr.includes('fuel') ||
    searchStr.includes('petrol') ||
    searchStr.includes('diesel') ||
    searchStr.includes('travel') ||
    searchStr.includes('cab') ||
    searchStr.includes('uber') ||
    searchStr.includes('ola') ||
    searchStr.includes('auto')
  ) {
    return {
      Icon: Fuel,
      color: '#0284C7',
      bg: isDark ? 'rgba(2, 132, 199, 0.15)' : '#F0F9FF',
      typeLabel: 'Expense Outflow',
      pillBg: isDark ? 'rgba(244, 63, 94, 0.15)' : '#FFF1F2',
      pillColor: '#E11D48',
    };
  }

  if (searchStr.includes('transport') || searchStr.includes('car') || searchStr.includes('bike')) {
    return {
      Icon: Car,
      color: '#0284C7',
      bg: isDark ? 'rgba(2, 132, 199, 0.15)' : '#F0F9FF',
      typeLabel: 'Expense Outflow',
      pillBg: isDark ? 'rgba(244, 63, 94, 0.15)' : '#FFF1F2',
      pillColor: '#E11D48',
    };
  }

  if (
    searchStr.includes('rent') ||
    searchStr.includes('housing') ||
    searchStr.includes('flat') ||
    searchStr.includes('room')
  ) {
    return {
      Icon: Home,
      color: '#8B5CF6',
      bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF',
      typeLabel: 'Expense Outflow',
      pillBg: isDark ? 'rgba(244, 63, 94, 0.15)' : '#FFF1F2',
      pillColor: '#E11D48',
    };
  }

  if (searchStr.includes('electric') || searchStr.includes('power') || searchStr.includes('gas') || searchStr.includes('bill')) {
    return {
      Icon: Zap,
      color: '#F59E0B',
      bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
      typeLabel: 'Expense Outflow',
      pillBg: isDark ? 'rgba(244, 63, 94, 0.15)' : '#FFF1F2',
      pillColor: '#E11D48',
    };
  }

  if (searchStr.includes('shop') || searchStr.includes('cloth') || searchStr.includes('dress') || searchStr.includes('mall')) {
    return {
      Icon: ShoppingBag,
      color: '#EC4899',
      bg: isDark ? 'rgba(236, 72, 153, 0.15)' : '#FDF2F8',
      typeLabel: 'Expense Outflow',
      pillBg: isDark ? 'rgba(244, 63, 94, 0.15)' : '#FFF1F2',
      pillColor: '#E11D48',
    };
  }

  if (searchStr.includes('movie') || searchStr.includes('film') || searchStr.includes('party') || searchStr.includes('theatre')) {
    return {
      Icon: Film,
      color: '#F43F5E',
      bg: isDark ? 'rgba(244, 63, 94, 0.15)' : '#FFF1F2',
      typeLabel: 'Expense Outflow',
      pillBg: isDark ? 'rgba(244, 63, 94, 0.15)' : '#FFF1F2',
      pillColor: '#E11D48',
    };
  }

  return {
    Icon: ArrowUpRight,
    color: '#E11D48',
    bg: isDark ? 'rgba(244, 63, 94, 0.15)' : '#FFF1F2',
    typeLabel: 'Expense Outflow',
    pillBg: isDark ? 'rgba(244, 63, 94, 0.15)' : '#FFF1F2',
    pillColor: '#E11D48',
  };
};

const formatFullDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const demoTransactions = useDemoStore((s) => s.demoTransactions);
  const demoProfile = useDemoStore((s) => s.demoProfile);
  const deleteDemoTransaction = useDemoStore((s) => s.deleteDemoTransaction);

  const isDemo = !user || (id?.startsWith('demo-') ?? false);

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadTransaction = useCallback(() => {
    if (!id) {
      setLoading(false);
      setLoadError('Transaction ID is missing.');
      return;
    }
    setLoadError(null);
    if (isDemo) {
      const found = demoTransactions.find((t) => t.id === id) || null;
      setTransaction(found);
      if (!found) setLoadError('This demo transaction could not be found.');
      setLoading(false);
      return;
    }

    setLoading(true);
    transactionService
      .getTransactionById(id)
      .then((data) => {
        setTransaction(data);
        if (!data) setLoadError('Transaction could not be found.');
      })
      .catch((err) => {
        const msg = getErrorMessage(err, 'Transaction not found.');
        setLoadError(msg);
      })
      .finally(() => setLoading(false));
  }, [id, isDemo, demoTransactions]);

  useFocusEffect(
    useCallback(() => {
      loadTransaction();
    }, [loadTransaction])
  );

  const handleDelete = () => {
    if (!transaction) return;
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete "${transaction.title}"? Your account balance will be adjusted accordingly.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              if (isDemo) {
                deleteDemoTransaction(transaction.id);
                toast.success('Transaction removed.');
                router.back();
                return;
              }
              // Reverse balance impact safely
              if (transaction.type === 'transfer') {
                if (transaction.account_id) {
                  await transactionService.adjustAccountBalance(
                    transaction.account_id,
                    transaction.amount,
                    'income'
                  );
                }
                if (transaction.to_account_id) {
                  await transactionService.adjustAccountBalance(
                    transaction.to_account_id,
                    transaction.amount,
                    'expense'
                  );
                }
              } else if (transaction.account_id) {
                const reverseType =
                  transaction.type === 'income' ? 'expense' : 'income';
                await transactionService.adjustAccountBalance(
                  transaction.account_id,
                  transaction.amount,
                  reverseType
                );
              }
              await transactionService.deleteTransaction(transaction.id);
              toast.success('Transaction deleted and balance updated.');
              router.back();
            } catch (err: unknown) {
              toast.error(getErrorMessage(err, 'Failed to delete transaction.'));
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Transaction Details" showBack />
        <LoadingState message="Fetching transaction..." />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Transaction Details" showBack />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ErrorState
            title="Transaction Unavailable"
            message={loadError || 'This transaction may have been deleted.'}
            onRetry={loadTransaction}
          />
        </View>
      </View>
    );
  }

  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const activeCurrency: SupportedCurrency = ((isDemo ? demoProfile?.currency : profile?.currency) as SupportedCurrency) || 'INR';
  const visuals = getTransactionVisuals(transaction, isDark);
  const VisualIcon = visuals.Icon;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Transaction Details"
        showBack
        rightAction={
          <View style={styles.headerRightRow}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/transactions/add', params: { editId: transaction.id } })}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                styles.headerActionBtn,
                {
                  backgroundColor: isDark ? colors.elevatedSurface : colors.surface,
                  borderColor: isDark ? colors.border : colors.borderLight,
                },
              ]}
              accessibilityLabel="Edit transaction"
            >
              <Pencil size={15} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                styles.headerActionBtn,
                {
                  backgroundColor: isDark ? colors.elevatedSurface : colors.surface,
                  borderColor: isDark ? colors.border : colors.borderLight,
                },
              ]}
              accessibilityLabel="Delete transaction"
            >
              <Trash2 size={15} color={colors.error} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing['3xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero Transaction Receipt Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? colors.border : colors.borderLight,
            },
            !isDark ? Shadows.md : undefined,
          ]}
        >
          {/* Category Icon Squircle */}
          <View style={[styles.heroIconBox, { backgroundColor: visuals.bg }]}>
            <VisualIcon size={28} color={visuals.color} strokeWidth={2.4} />
          </View>

          {/* Amount Display */}
          <Text
            variant="3xl"
            weight="extrabold"
            style={{
              color: isIncome ? colors.positive : isTransfer ? colors.primary : colors.mainText,
              letterSpacing: -0.5,
              marginTop: Spacing.sm,
            }}
          >
            {isIncome ? '+' : isTransfer ? '' : '-'}
            {formatCurrency(transaction.amount, activeCurrency)}
          </Text>

          {/* Title */}
          <Text variant="lg" weight="bold" style={styles.heroTitle} numberOfLines={2}>
            {transaction.title}
          </Text>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: visuals.pillBg }]}>
            <VisualIcon size={12} color={visuals.pillColor} strokeWidth={2.5} />
            <Text
              variant="xs"
              weight="bold"
              style={{ color: visuals.pillColor, marginLeft: 4, fontSize: 11 }}
            >
              {visuals.typeLabel}
            </Text>
          </View>

          {/* Quick Edit Action Bar */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/transactions/add', params: { editId: transaction.id } })}
              activeOpacity={0.8}
              style={[
                styles.quickActionPill,
                {
                  backgroundColor: isDark ? colors.elevatedSurface : colors.background,
                  borderColor: isDark ? colors.border : colors.borderLight,
                },
              ]}
            >
              <Pencil size={13} color={colors.primary} />
              <Text variant="xs" weight="bold" style={{ color: colors.primary, marginLeft: 5 }}>
                Edit Transaction
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Detailed Receipt Breakdown Card */}
        <View style={styles.sectionHeaderRow}>
          <Text variant="xs" weight="bold" color="secondary" style={styles.sectionTitle}>
            TRANSACTION BREAKDOWN
          </Text>
        </View>

        <View
          style={[
            styles.detailsCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? colors.border : colors.borderLight,
            },
            !isDark ? Shadows.sm : undefined,
          ]}
        >
          {/* Date Row */}
          <View style={styles.receiptRow}>
            <View style={styles.rowLabelCol}>
              <View style={[styles.rowIconCircle, { backgroundColor: isDark ? colors.elevatedSurface : colors.background }]}>
                <Calendar size={14} color={colors.secondaryText} />
              </View>
              <Text variant="sm" color="secondary" style={styles.rowLabelText}>
                Date
              </Text>
            </View>
            <Text variant="sm" weight="bold" style={{ color: colors.mainText }}>
              {formatFullDate(transaction.date)}
            </Text>
          </View>

          <View style={[styles.separator, { backgroundColor: isDark ? colors.border : colors.borderLight }]} />

          {/* Category Row (if not transfer) */}
          {!isTransfer ? (
            <>
              <View style={styles.receiptRow}>
                <View style={styles.rowLabelCol}>
                  <View style={[styles.rowIconCircle, { backgroundColor: isDark ? colors.elevatedSurface : colors.background }]}>
                    <Tag size={14} color={colors.secondaryText} />
                  </View>
                  <Text variant="sm" color="secondary" style={styles.rowLabelText}>
                    Category
                  </Text>
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: visuals.bg }]}>
                  <Text variant="xs" weight="bold" style={{ color: visuals.color }}>
                    {transaction.category?.name || 'General Expense'}
                  </Text>
                </View>
              </View>

              <View style={[styles.separator, { backgroundColor: isDark ? colors.border : colors.borderLight }]} />
            </>
          ) : null}

          {/* Source Account Row */}
          <View style={styles.receiptRow}>
            <View style={styles.rowLabelCol}>
              <View style={[styles.rowIconCircle, { backgroundColor: isDark ? colors.elevatedSurface : colors.background }]}>
                <Building size={14} color={colors.secondaryText} />
              </View>
              <Text variant="sm" color="secondary" style={styles.rowLabelText}>
                {isTransfer ? 'From Account' : isIncome ? 'Credited To' : 'Paid From'}
              </Text>
            </View>
            <Text variant="sm" weight="bold" style={{ color: colors.mainText }}>
              {transaction.account?.name || 'Primary Bank'}
            </Text>
          </View>

          {/* Destination Account (if transfer) */}
          {isTransfer && transaction.to_account_id ? (
            <>
              <View style={[styles.separator, { backgroundColor: isDark ? colors.border : colors.borderLight }]} />
              <View style={styles.receiptRow}>
                <View style={styles.rowLabelCol}>
                  <View style={[styles.rowIconCircle, { backgroundColor: isDark ? colors.elevatedSurface : colors.background }]}>
                    <Wallet size={14} color={colors.secondaryText} />
                  </View>
                  <Text variant="sm" color="secondary" style={styles.rowLabelText}>
                    To Account
                  </Text>
                </View>
                <Text variant="sm" weight="bold" style={{ color: colors.mainText }}>
                  {transaction.account?.name || 'Destination Account'}
                </Text>
              </View>
            </>
          ) : null}

          <View style={[styles.separator, { backgroundColor: isDark ? colors.border : colors.borderLight }]} />

          {/* Payment Method */}
          <View style={styles.receiptRow}>
            <View style={styles.rowLabelCol}>
              <View style={[styles.rowIconCircle, { backgroundColor: isDark ? colors.elevatedSurface : colors.background }]}>
                <CreditCard size={14} color={colors.secondaryText} />
              </View>
              <Text variant="sm" color="secondary" style={styles.rowLabelText}>
                Payment Mode
              </Text>
            </View>
            <View style={[styles.paymentMethodPill, { backgroundColor: isDark ? colors.elevatedSurface : colors.background }]}>
              <Text variant="xs" weight="bold" style={{ color: colors.mainText }}>
                {transaction.payment_method || 'UPI'}
              </Text>
            </View>
          </View>

          {/* Notes Section (if available) */}
          {transaction.notes ? (
            <>
              <View style={[styles.separator, { backgroundColor: isDark ? colors.border : colors.borderLight }]} />
              <View style={styles.notesContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <FileText size={13} color={colors.secondaryText} />
                  <Text variant="xs" color="secondary" weight="semibold" style={{ marginLeft: 5 }}>
                    NOTES
                  </Text>
                </View>
                <Text variant="sm" style={{ color: colors.mainText, lineHeight: 20 }}>
                  {`"${transaction.notes}"`}
                </Text>
              </View>
            </>
          ) : null}
        </View>

        {/* 3. Elegant Bottom Delete Button */}
        <TouchableOpacity
          onPress={handleDelete}
          disabled={deleting}
          activeOpacity={0.75}
          style={[
            styles.deleteGhostBtn,
            {
              borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.25)',
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2',
            },
          ]}
        >
          <Trash2 size={16} color={colors.error} />
          <Text variant="sm" weight="bold" style={{ color: colors.error, marginLeft: 6 }}>
            {deleting ? 'Deleting...' : 'Delete Transaction'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  heroCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  heroIconBox: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    marginTop: 4,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  quickActionsRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    width: '100%',
    justifyContent: 'center',
  },
  quickActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  sectionHeaderRow: {
    marginBottom: Spacing.xs,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    letterSpacing: 0.5,
  },
  detailsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rowLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rowLabelText: {
    fontSize: 13,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  paymentMethodPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  separator: {
    height: 1,
    marginVertical: Spacing.md,
  },
  notesContainer: {
    paddingTop: 2,
  },
  deleteGhostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
});
