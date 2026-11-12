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
  Heading,
  CurrencyText,
  Card,
  Badge,
  Button,
  Header,
  LoadingState,
  ErrorState,
} from '../../components/ui';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';
import { Spacing } from '../../theme/tokens';
import {
  Trash2,
  Pencil,
  Calendar,
  CreditCard,
  Tag,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
} from 'lucide-react-native';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Transaction Details"
        showBack
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/transactions/add', params: { editId: transaction.id } })}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Edit transaction"
            >
              <Pencil size={19} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Delete transaction"
            >
              <Trash2 size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card elevated style={styles.topCard}>
          <View
            style={[
              styles.typeIconLarge,
              {
                backgroundColor: isIncome
                  ? colors.successMuted
                  : isTransfer
                  ? colors.secondaryMuted
                  : colors.errorMuted,
              },
            ]}
          >
            {isIncome ? (
              <ArrowDownLeft size={32} color={colors.success} />
            ) : isTransfer ? (
              <ArrowLeftRight size={32} color={colors.secondary} />
            ) : (
              <ArrowUpRight size={32} color={colors.error} />
            )}
          </View>

          <CurrencyText
            amount={transaction.amount}
            currency={activeCurrency}
            variant="3xl"
            weight="extrabold"
            style={{
              color: isIncome
                ? colors.success
                : isTransfer
                ? colors.secondary
                : colors.mainText,
              marginTop: Spacing.sm,
            }}
          />

          <Heading level={2} style={styles.titleText}>
            {transaction.title}
          </Heading>

          <Badge
            label={isIncome ? 'Income' : isTransfer ? 'Account Transfer' : 'Expense'}
            variant={isIncome ? 'success' : isTransfer ? 'secondary' : 'error'}
            style={{ marginTop: Spacing.xs }}
          />
        </Card>

        {/* Detailed Properties */}
        <Card elevated style={styles.detailsCard}>
          <View style={styles.row}>
            <View style={styles.labelCol}>
              <Calendar size={16} color={colors.secondaryText} />
              <Text variant="sm" color="secondary" style={styles.propLabel}>
                Date
              </Text>
            </View>
            <Text variant="sm" weight="semibold">
              {transaction.date}
            </Text>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View style={styles.labelCol}>
              <Tag size={16} color={colors.secondaryText} />
              <Text variant="sm" color="secondary" style={styles.propLabel}>
                Category
              </Text>
            </View>
            <Text variant="sm" weight="semibold">
              {transaction.category?.name || 'Uncategorized'}
            </Text>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View style={styles.labelCol}>
              <CreditCard size={16} color={colors.secondaryText} />
              <Text variant="sm" color="secondary" style={styles.propLabel}>
                Account
              </Text>
            </View>
            <Text variant="sm" weight="semibold">
              {transaction.account?.name || 'Default Account'}
            </Text>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View style={styles.labelCol}>
              <CreditCard size={16} color={colors.secondaryText} />
              <Text variant="sm" color="secondary" style={styles.propLabel}>
                Payment Method
              </Text>
            </View>
            <Text variant="sm" weight="semibold">
              {transaction.payment_method}
            </Text>
          </View>

          {transaction.notes ? (
            <>
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
              <View style={styles.notesBlock}>
                <Text variant="xs" color="secondary" weight="semibold" style={{ marginBottom: 4 }}>
                  NOTES
                </Text>
                <Text variant="sm">{transaction.notes}</Text>
              </View>
            </>
          ) : null}
        </Card>

        <Button
          title="Delete Transaction"
          variant="danger"
          size="lg"
          loading={deleting}
          onPress={handleDelete}
          buttonStyle={{ marginTop: Spacing.xl }}
        />
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
    paddingTop: Spacing.md,
  },
  topCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  typeIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  detailsCard: {
    padding: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  labelCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propLabel: {
    marginLeft: 8,
  },
  separator: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  notesBlock: {
    paddingTop: Spacing.xs,
  },
});

