import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { transactionService } from '../../services/transactionService';
import { Transaction } from '../../types/database';
import {
  Text,
  Heading,
  CurrencyText,
  Card,
  Badge,
  Button,
  Header,
  LoadingState,
} from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import {
  Trash2,
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
  const profile = useAuthStore((s) => s.profile);

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    transactionService
      .getTransactionById(id)
      .then((data) => setTransaction(data))
      .catch((err) => Alert.alert('Error', err?.message || 'Transaction not found'))
      .finally(() => setLoading(false));
  }, [id]);

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
              // Reverse balance impact
              if (transaction.account_id) {
                const reverseType =
                  transaction.type === 'income' ? 'expense' : 'income';
                await transactionService.adjustAccountBalance(
                  transaction.account_id,
                  transaction.amount,
                  reverseType
                );
              }
              await transactionService.deleteTransaction(transaction.id);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete transaction.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !transaction) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Transaction Details" showBack />
        <LoadingState message="Fetching transaction..." />
      </View>
    );
  }

  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Transaction Details"
        showBack
        rightAction={
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Trash2 size={20} color={colors.error} />
          </TouchableOpacity>
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
            currency={profile?.currency || 'INR'}
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

