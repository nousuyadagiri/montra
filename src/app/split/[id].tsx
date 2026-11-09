import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { splitService, GroupDetailsData } from '../../services/splitService';
import {
  Text,
  Heading,
  CurrencyText,
  Card,
  Badge,
  Button,
  Header,
  LoadingState,
  EmptyState,
} from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import {
  Users,
  Plus,
  ArrowRight,
  HandCoins,
  Receipt,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react-native';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const [data, setData] = useState<GroupDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!id || !user) return;
    try {
      const res = await splitService.getGroupDetails(id, user.id);
      setData(res);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load group details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetails();
  };

  const handleDeleteGroup = () => {
    if (!id) return;
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group and all its expenses? This action is irreversible.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await splitService.deleteGroup(id);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete group.');
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Group Details" showBack />
        <LoadingState message="Loading group balances and debts..." />
      </View>
    );
  }

  if (!data) return null;

  const { group, totalExpenses, yourNetBalance, memberBalances, simplifiedDebts, expenses } = data;
  const isOwed = yourNetBalance > 0;
  const isOwing = yourNetBalance < 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={group.name}
        subtitle={`${group.category} • ${data.members.length} members`}
        showBack
        rightAction={
          <TouchableOpacity onPress={handleDeleteGroup} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Trash2 size={20} color={colors.error} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing['3xl'] },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <Card elevated style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View>
              <Text variant="xs" color="secondary" weight="semibold">
                YOUR GROUP BALANCE
              </Text>
              <CurrencyText
                amount={Math.abs(yourNetBalance)}
                currency={group.currency}
                variant="2xl"
                weight="extrabold"
                style={{
                  color: isOwed ? colors.success : isOwing ? colors.error : colors.secondaryText,
                  marginTop: 2,
                }}
              />
              <Text
                variant="xs"
                weight="medium"
                style={{
                  color: isOwed ? colors.success : isOwing ? colors.error : colors.secondaryText,
                }}
              >
                {isOwed ? 'You are owed' : isOwing ? 'You owe' : 'All settled up'}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="xs" color="secondary" weight="semibold">
                TOTAL EXPENSES
              </Text>
              <CurrencyText
                amount={totalExpenses}
                currency={group.currency}
                variant="xl"
                weight="bold"
                style={{ marginTop: 2 }}
              />
            </View>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <Button
              title="+ Add Expense"
              variant="primary"
              size="sm"
              onPress={() => router.push({ pathname: '/split/add-expense', params: { groupId: group.id } })}
              buttonStyle={{ flex: 1 }}
            />
            <Button
              title="Settle Up"
              variant="outline"
              size="sm"
              onPress={() => router.push({ pathname: '/split/settle', params: { groupId: group.id } })}
              buttonStyle={{ flex: 1 }}
            />
          </View>
        </Card>

        {/* Simplified Debt Settlements */}
        {simplifiedDebts.length > 0 ? (
          <View style={styles.section}>
            <Text variant="sm" weight="semibold" color="secondary" style={styles.sectionTitle}>
              HOW TO SETTLE (MINIMAL TRANSFERS)
            </Text>
            <Card elevated style={styles.debtCard}>
              {simplifiedDebts.map((debt, idx) => (
                <View key={idx} style={styles.debtRow}>
                  <View style={styles.debtPayerPayee}>
                    <Text variant="sm" weight="bold">
                      {debt.payerName}
                    </Text>
                    <ArrowRight size={14} color={colors.secondaryText} style={{ marginHorizontal: 6 }} />
                    <Text variant="sm" weight="bold">
                      {debt.payeeName}
                    </Text>
                  </View>
                  <CurrencyText
                    amount={debt.amount}
                    currency={group.currency}
                    variant="sm"
                    weight="bold"
                    style={{ color: colors.primary }}
                  />
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        {/* Member Balances */}
        <View style={styles.section}>
          <Text variant="sm" weight="semibold" color="secondary" style={styles.sectionTitle}>
            MEMBER BALANCES
          </Text>
          <Card elevated style={styles.membersCard}>
            {memberBalances.map((mb) => {
              const memOwed = mb.netBalance > 0;
              const memOwing = mb.netBalance < 0;

              return (
                <View key={mb.memberId} style={styles.memberRow}>
                  <Text variant="sm" weight={mb.isCurrentUser ? 'bold' : 'medium'}>
                    {mb.memberName} {mb.isCurrentUser ? '(You)' : ''}
                  </Text>
                  <Text
                    variant="sm"
                    weight="bold"
                    style={{
                      color: memOwed
                        ? colors.success
                        : memOwing
                        ? colors.error
                        : colors.secondaryText,
                    }}
                  >
                    {memOwed
                      ? `+${formatCurrency(mb.netBalance, group.currency)}`
                      : memOwing
                      ? `-${formatCurrency(Math.abs(mb.netBalance), group.currency)}`
                      : 'Settled'}
                  </Text>
                </View>
              );
            })}
          </Card>
        </View>

        {/* Group Expenses List */}
        <View style={styles.section}>
          <Text variant="sm" weight="semibold" color="secondary" style={styles.sectionTitle}>
            EXPENSE HISTORY
          </Text>
          {expenses.length === 0 ? (
            <EmptyState
              title="No Shared Expenses"
              description="Tap '+ Add Expense' above to log dinner, rentals, or tickets."
            />
          ) : (
            expenses.map((exp) => (
              <Card key={exp.id} style={styles.expenseCard}>
                <View style={styles.expenseRow}>
                  <View style={[styles.expenseIcon, { backgroundColor: colors.primaryMuted }]}>
                    <Receipt size={18} color={colors.primary} />
                  </View>
                  <View style={styles.expenseDetails}>
                    <Text variant="sm" weight="bold">
                      {exp.title}
                    </Text>
                    <Text variant="xs" color="secondary">
                      Paid by {exp.payer?.member_name || 'Member'} • {exp.date} •{' '}
                      {exp.split_type.toUpperCase()}
                    </Text>
                  </View>
                  <CurrencyText
                    amount={exp.amount}
                    currency={group.currency}
                    variant="sm"
                    weight="bold"
                  />
                </View>
              </Card>
            ))
          )}
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
  summaryCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  debtCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  debtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debtPayerPayee: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseCard: {
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  expenseDetails: {
    flex: 1,
    gap: 2,
  },
});

