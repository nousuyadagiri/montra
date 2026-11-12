import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import { useSyncStore } from '../../store/syncStore';
import { splitService, GroupDetailsData } from '../../services/splitService';
import {
  Text,
  CurrencyText,
  Card,
  Button,
  Input,
  Header,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../../components/ui';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';
import { Spacing } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import {
  ArrowRight,
  HandCoins,
  Receipt,
  Trash2,
  Pencil,
  UserPlus,
  Check,
  X,
} from 'lucide-react-native';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const syncTick = useSyncStore((s) => s.syncTick);

  const demoGroups = useDemoStore((s) => s.demoGroups);
  const demoGroupExpenses = useDemoStore((s) => s.demoGroupExpenses);
  const demoGroupSettlements = useDemoStore((s) => s.demoGroupSettlements);
  const getDemoGroupDetails = useDemoStore((s) => s.getDemoGroupDetails);
  const addDemoGroupMember = useDemoStore((s) => s.addDemoGroupMember);
  const deleteDemoGroup = useDemoStore((s) => s.deleteDemoGroup);
  const deleteDemoGroupExpense = useDemoStore((s) => s.deleteDemoGroupExpense);
  const deleteDemoSettlement = useDemoStore((s) => s.deleteDemoSettlement);

  const isDemo = !user || (id?.startsWith('demo-') ?? false);

  const [data, setData] = useState<GroupDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  // Inline Add Member state
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setLoadError('Group ID is missing.');
      return;
    }
    setLoadError(null);
    if (isDemo) {
      const res = getDemoGroupDetails(id);
      hasLoadedRef.current = Boolean(res);
      setData(res);
      if (!res) setLoadError('This demo group could not be found.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await splitService.getGroupDetails(id, user.id);
      hasLoadedRef.current = true;
      setData(res);
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Failed to load group details.');
      setLoadError(msg);
      if (hasLoadedRef.current) toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, user, isDemo, getDemoGroupDetails]);

  useFocusEffect(
    useCallback(() => {
      fetchDetails();
    }, [fetchDetails])
  );

  useEffect(() => {
    if (syncTick > 0 || isDemo) {
      fetchDetails();
    }
  }, [syncTick, isDemo, demoGroups, demoGroupExpenses, demoGroupSettlements, fetchDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetails();
  };

  const handleAddMember = async () => {
    if (!id || !newMemberName.trim()) {
      toast.warning('Please enter a member name.', 'Name Required');
      return;
    }
    try {
      setAddingMember(true);
      if (isDemo) {
        addDemoGroupMember(id, newMemberName.trim());
      } else {
        await splitService.addMember(id, newMemberName.trim());
      }
      toast.success(`Added ${newMemberName.trim()} to group.`);
      setNewMemberName('');
      setShowAddMember(false);
      await fetchDetails();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to add member.'));
    } finally {
      setAddingMember(false);
    }
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
              if (isDemo) {
                deleteDemoGroup(id);
              } else {
                await splitService.deleteGroup(id);
              }
              toast.success('Group deleted.');
              router.back();
            } catch (err: unknown) {
              toast.error(getErrorMessage(err, 'Failed to delete group.'));
            }
          },
        },
      ]
    );
  };

  const handleDeleteExpense = (expenseId: string, title: string) => {
    if (!id) return;
    Alert.alert('Delete Expense', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (isDemo) {
              deleteDemoGroupExpense(id, expenseId);
            } else {
              await splitService.deleteGroupExpense(expenseId);
            }
            toast.success(`Expense "${title}" removed.`);
            await fetchDetails();
          } catch (err: unknown) {
            toast.error(getErrorMessage(err, 'Failed to delete expense.'));
          }
        },
      },
    ]);
  };

  const handleDeleteSettlement = (settlementId: string) => {
    if (!id) return;
    Alert.alert('Delete Settlement', 'Remove this settlement record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (isDemo) {
              deleteDemoSettlement(id, settlementId);
            } else {
              await splitService.deleteSettlement(settlementId);
            }
            toast.success('Settlement record removed.');
            await fetchDetails();
          } catch (err: unknown) {
            toast.error(getErrorMessage(err, 'Failed to remove settlement.'));
          }
        },
      },
    ]);
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Group Details" showBack />
        <LoadingState message="Loading group balances and debts..." />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Group Details" showBack />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ErrorState
            title="Group Unavailable"
            message={loadError || 'Unable to load this group right now.'}
            onRetry={() => {
              setLoading(true);
              fetchDetails();
            }}
          />
        </View>
      </View>
    );
  }

  const { group, totalExpenses, yourNetBalance, memberBalances, simplifiedDebts, expenses, settlements, members } = data;
  const isOwed = yourNetBalance > 0;
  const isOwing = yourNetBalance < 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={group.name}
        subtitle={`${group.category} • ${members.length} members`}
        showBack
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/split/create-group', params: { editGroupId: group.id } })}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Edit group"
            >
              <Pencil size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteGroup}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Delete group"
            >
              <Trash2 size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
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

        {/* Member Balances & Add Member */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text variant="sm" weight="semibold" color="secondary" style={styles.sectionTitle}>
              MEMBER BALANCES
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddMember(!showAddMember)}
              style={styles.addMemberLink}
            >
              <UserPlus size={14} color={colors.primary} />
              <Text variant="xs" color="primary" weight="bold">
                {showAddMember ? 'Cancel' : 'Add Member'}
              </Text>
            </TouchableOpacity>
          </View>

          {showAddMember ? (
            <Card elevated style={styles.addMemberCard}>
              <View style={styles.addMemberInputRow}>
                <Input
                  placeholder="Member name (e.g. Kiran)"
                  value={newMemberName}
                  onChangeText={setNewMemberName}
                  containerStyle={{ flex: 1, marginBottom: 0 }}
                />
                <TouchableOpacity
                  onPress={handleAddMember}
                  disabled={addingMember}
                  style={[styles.confirmMemBtn, { backgroundColor: colors.primary }]}
                >
                  <Check size={16} color={colors.onPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddMember(false);
                    setNewMemberName('');
                  }}
                  style={[styles.confirmMemBtn, { backgroundColor: colors.elevatedSurface }]}
                >
                  <X size={16} color={colors.secondaryText} />
                </TouchableOpacity>
              </View>
            </Card>
          ) : null}

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
                  <View style={styles.expenseRightCol}>
                    <CurrencyText
                      amount={exp.amount}
                      currency={group.currency}
                      variant="sm"
                      weight="bold"
                    />
                    <View style={styles.expenseActions}>
                      <TouchableOpacity
                        onPress={() =>
                          router.push({
                            pathname: '/split/add-expense',
                            params: { groupId: group.id, editExpenseId: exp.id },
                          })
                        }
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Pencil size={14} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteExpense(exp.id, exp.title)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Trash2 size={14} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Settlement History */}
        {settlements.length > 0 ? (
          <View style={styles.section}>
            <Text variant="sm" weight="semibold" color="secondary" style={styles.sectionTitle}>
              SETTLEMENT HISTORY
            </Text>
            {settlements.map((s) => {
              const payerName =
                members.find((m) => m.id === s.payer_id)?.member_name || 'Member';
              const payeeName =
                members.find((m) => m.id === s.payee_id)?.member_name || 'Member';
              return (
                <Card key={s.id} style={styles.expenseCard}>
                  <View style={styles.expenseRow}>
                    <View style={[styles.expenseIcon, { backgroundColor: colors.successMuted }]}>
                      <HandCoins size={18} color={colors.positive} />
                    </View>
                    <View style={styles.expenseDetails}>
                      <Text variant="sm" weight="bold">
                        {payerName} → {payeeName}
                      </Text>
                      <Text variant="xs" color="secondary">
                        {s.payment_method || 'UPI'} {s.notes ? `• ${s.notes}` : ''}
                      </Text>
                    </View>
                    <CurrencyText
                      amount={s.amount}
                      currency={group.currency}
                      variant="sm"
                      weight="bold"
                      style={{ color: colors.positive, marginRight: Spacing.sm }}
                    />
                    <TouchableOpacity
                      onPress={() => handleDeleteSettlement(s.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={15} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}
          </View>
        ) : null}
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addMemberLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
    paddingHorizontal: 4,
  },
  addMemberCard: {
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  addMemberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  confirmMemBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseRightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  expenseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

