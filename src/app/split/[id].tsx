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
  Card,
  Input,
  Header,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../../components/ui';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';
import { Spacing, BorderRadius, Shadows } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  HandCoins,
  Receipt,
  Trash2,
  Pencil,
  UserPlus,
  Check,
  X,
  Plus,
  Wallet,
  Utensils,
  ShoppingBag,
  Zap,
  Coffee,
  Film,
  Fuel,
} from 'lucide-react-native';

const AVATAR_PALETTES = [
  { bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE' }, // Indigo
  { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' }, // Emerald
  { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' }, // Amber
  { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' }, // Purple
  { bg: '#FFF1F2', text: '#E11D48', border: '#FECDD3' }, // Rose
  { bg: '#F0F9FF', text: '#0284C7', border: '#BAE6FD' }, // Sky
  { bg: '#F0FDFA', text: '#0D9488', border: '#99F6E4' }, // Teal
];

const getAvatarStyle = (name: string, isDark: boolean) => {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  const p = AVATAR_PALETTES[index];
  if (isDark) {
    return {
      bg: `${p.text}22`,
      text: p.text,
      border: `${p.text}44`,
    };
  }
  return p;
};

const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const today = new Date();
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    if (isToday) return 'Today';

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();
    if (isYesterday) return 'Yesterday';

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return dateStr;
  }
};

const getExpenseCategoryConfig = (title: string, isDark: boolean) => {
  const t = (title || '').toLowerCase();

  if (
    t.includes('veg') ||
    t.includes('fruit') ||
    t.includes('rice') ||
    t.includes('food') ||
    t.includes('dinner') ||
    t.includes('lunch') ||
    t.includes('breakfast') ||
    t.includes('meal') ||
    t.includes('snack') ||
    t.includes('hotel') ||
    t.includes('swiggy') ||
    t.includes('zomato') ||
    t.includes('restaurant') ||
    t.includes('curry') ||
    t.includes('ration')
  ) {
    return {
      Icon: Utensils,
      color: '#10B981',
      bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
      category: 'Food & Groceries',
    };
  }

  if (
    t.includes('induction') ||
    t.includes('rent') ||
    t.includes('flat') ||
    t.includes('room') ||
    t.includes('house') ||
    t.includes('electric') ||
    t.includes('wifi') ||
    t.includes('power') ||
    t.includes('gas') ||
    t.includes('cylinder') ||
    t.includes('appliance') ||
    t.includes('maintenance')
  ) {
    return {
      Icon: Zap,
      color: '#8B5CF6',
      bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF',
      category: 'Utilities & Home',
    };
  }

  if (
    t.includes('fuel') ||
    t.includes('petrol') ||
    t.includes('diesel') ||
    t.includes('uber') ||
    t.includes('ola') ||
    t.includes('auto') ||
    t.includes('cab') ||
    t.includes('travel') ||
    t.includes('flight') ||
    t.includes('train') ||
    t.includes('bus') ||
    t.includes('toll') ||
    t.includes('car') ||
    t.includes('bike')
  ) {
    return {
      Icon: Fuel,
      color: '#0284C7',
      bg: isDark ? 'rgba(2, 132, 199, 0.15)' : '#F0F9FF',
      category: 'Travel & Fuel',
    };
  }

  if (
    t.includes('tea') ||
    t.includes('coffee') ||
    t.includes('cafe') ||
    t.includes('chai')
  ) {
    return {
      Icon: Coffee,
      color: '#D97706',
      bg: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FFFBEB',
      category: 'Drinks & Snacks',
    };
  }

  if (
    t.includes('movie') ||
    t.includes('film') ||
    t.includes('party') ||
    t.includes('drinks') ||
    t.includes('cinema') ||
    t.includes('show')
  ) {
    return {
      Icon: Film,
      color: '#F43F5E',
      bg: isDark ? 'rgba(244, 63, 94, 0.15)' : '#FFF1F2',
      category: 'Entertainment',
    };
  }

  if (
    t.includes('shop') ||
    t.includes('dress') ||
    t.includes('cloth') ||
    t.includes('amazon') ||
    t.includes('flipkart') ||
    t.includes('market') ||
    t.includes('mall')
  ) {
    return {
      Icon: ShoppingBag,
      color: '#EC4899',
      bg: isDark ? 'rgba(236, 72, 153, 0.15)' : '#FDF2F8',
      category: 'Shopping',
    };
  }

  return {
    Icon: Receipt,
    color: '#6366F1',
    bg: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
    category: 'General Expense',
  };
};

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
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

  // Filter tabs for activity
  const [activityTab, setActivityTab] = useState<'all' | 'expenses' | 'settlements'>('all');

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

  // Find current user's member object to detect if user is involved in debts
  const currentMember = memberBalances.find((m) => m.isCurrentUser);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={group.name}
        subtitle={`${group.category || 'Shared Group'} • ${members.length} members`}
        showBack
        rightAction={
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/split/create-group', params: { editGroupId: group.id } })}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                styles.headerActionBtn,
                {
                  backgroundColor: isDark ? colors.elevatedSurface : colors.surface,
                  borderColor: isDark ? colors.border : colors.borderLight,
                },
              ]}
              accessibilityLabel="Edit group"
            >
              <Pencil size={15} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteGroup}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                styles.headerActionBtn,
                {
                  backgroundColor: isDark ? colors.elevatedSurface : colors.surface,
                  borderColor: isDark ? colors.border : colors.borderLight,
                },
              ]}
              accessibilityLabel="Delete group"
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Fintech Hero Balance Card */}
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
          <View style={styles.heroTopRow}>
            <View style={styles.heroBalanceCol}>
              <View style={styles.heroOverlineRow}>
                <Wallet size={13} color={colors.secondaryText} />
                <Text variant="xs" color="secondary" weight="semibold" style={styles.heroOverline}>
                  YOUR GROUP BALANCE
                </Text>
              </View>
              <Text
                variant="2xl"
                weight="extrabold"
                style={{
                  color: isOwed ? colors.positive : isOwing ? colors.negative : colors.mainText,
                  letterSpacing: -0.5,
                  marginTop: 2,
                }}
              >
                {isOwed
                  ? `+${formatCurrency(yourNetBalance, group.currency)}`
                  : isOwing
                  ? `-${formatCurrency(Math.abs(yourNetBalance), group.currency)}`
                  : formatCurrency(0, group.currency)}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isOwed
                      ? colors.successMuted
                      : isOwing
                      ? colors.expenseMuted
                      : isDark
                      ? colors.elevatedSurface
                      : colors.background,
                  },
                ]}
              >
                {isOwed && <ArrowUpRight size={12} color={colors.positive} />}
                {isOwing && <ArrowDownLeft size={12} color={colors.negative} />}
                {!(isOwed || isOwing) && <Check size={12} color={colors.secondaryText} />}
                <Text
                  variant="xs"
                  weight="bold"
                  style={{
                    color: isOwed ? colors.positive : isOwing ? colors.negative : colors.secondaryText,
                    marginLeft: 3,
                  }}
                >
                  {isOwed ? 'You are owed' : isOwing ? 'You owe money' : 'All settled up'}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.heroTotalBox,
                {
                  backgroundColor: isDark ? colors.elevatedSurface : colors.background,
                  borderColor: isDark ? colors.border : colors.borderLight,
                },
              ]}
            >
              <Text variant="xs" color="secondary" weight="semibold">
                TOTAL SPENT
              </Text>
              <Text variant="md" weight="bold" style={{ color: colors.mainText, marginTop: 2 }}>
                {formatCurrency(totalExpenses, group.currency)}
              </Text>
              <Text variant="xs" color="tertiary" style={{ marginTop: 2 }}>
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </Text>
            </View>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.heroActionsRow}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/split/add-expense', params: { groupId: group.id } })}
              activeOpacity={0.8}
              style={[styles.heroPrimaryBtn, { backgroundColor: colors.primary }]}
            >
              <Plus size={16} color={colors.onPrimary} strokeWidth={2.5} />
              <Text variant="sm" weight="bold" style={{ color: colors.onPrimary, marginLeft: 6 }}>
                Add Expense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push({ pathname: '/split/settle', params: { groupId: group.id } })}
              activeOpacity={0.8}
              style={[
                styles.heroSecondaryBtn,
                {
                  backgroundColor: isDark ? colors.elevatedSurface : colors.background,
                  borderColor: isDark ? colors.border : colors.borderLight,
                },
              ]}
            >
              <HandCoins size={16} color={colors.primary} strokeWidth={2.2} />
              <Text variant="sm" weight="bold" style={{ color: colors.primary, marginLeft: 6 }}>
                Settle Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Simplified Debt Settlements (P2P Smart Settlement Plan) */}
        {simplifiedDebts.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ArrowRightLeft size={14} color={colors.primary} />
                <Text variant="sm" weight="bold" color="secondary" style={styles.sectionTitleText}>
                  HOW TO SETTLE
                </Text>
              </View>
              <View style={[styles.minimalBadge, { backgroundColor: colors.primaryMuted }]}>
                <Text variant="xs" weight="bold" style={{ color: colors.primary, fontSize: 10 }}>
                  MINIMAL TRANSFERS
                </Text>
              </View>
            </View>

            {simplifiedDebts.map((debt, idx) => {
              const payerStyle = getAvatarStyle(debt.payerName, isDark);
              const payeeStyle = getAvatarStyle(debt.payeeName, isDark);
              const isUserInvolved =
                currentMember &&
                (debt.payerId === currentMember.memberId || debt.payeeId === currentMember.memberId);

              return (
                <View
                  key={idx}
                  style={[
                    styles.debtCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isUserInvolved ? colors.primary : isDark ? colors.border : colors.borderLight,
                      borderWidth: isUserInvolved ? 1.5 : 1,
                    },
                    !isDark ? Shadows.sm : undefined,
                  ]}
                >
                  <View style={styles.debtHeaderRow}>
                    {/* Payer */}
                    <View style={styles.debtPartyCol}>
                      <View
                        style={[
                          styles.avatarSm,
                          { backgroundColor: payerStyle.bg, borderColor: payerStyle.border },
                        ]}
                      >
                        <Text style={[styles.avatarSmText, { color: payerStyle.text }]}>
                          {getInitials(debt.payerName)}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text variant="xs" color="secondary" weight="medium">
                          From (Payer)
                        </Text>
                        <Text variant="sm" weight="bold" numberOfLines={1}>
                          {debt.payerName}
                        </Text>
                      </View>
                    </View>

                    {/* Flow arrow */}
                    <View style={styles.debtArrowContainer}>
                      <View
                        style={[
                          styles.arrowPill,
                          { backgroundColor: isDark ? colors.elevatedSurface : colors.borderLight },
                        ]}
                      >
                        <ArrowRight size={14} color={colors.primary} />
                      </View>
                    </View>

                    {/* Payee */}
                    <View style={styles.debtPartyCol}>
                      <View
                        style={[
                          styles.avatarSm,
                          { backgroundColor: payeeStyle.bg, borderColor: payeeStyle.border },
                        ]}
                      >
                        <Text style={[styles.avatarSmText, { color: payeeStyle.text }]}>
                          {getInitials(debt.payeeName)}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text variant="xs" color="secondary" weight="medium">
                          To (Payee)
                        </Text>
                        <Text variant="sm" weight="bold" numberOfLines={1}>
                          {debt.payeeName}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.debtFooterDivider,
                      { backgroundColor: isDark ? colors.border : colors.borderLight },
                    ]}
                  />

                  {/* Settle Action Bar */}
                  <View style={styles.debtFooterRow}>
                    <View>
                      <Text variant="xs" color="secondary" weight="medium">
                        Amount to settle
                      </Text>
                      <Text variant="base" weight="extrabold" style={{ color: colors.primary }}>
                        {formatCurrency(debt.amount, group.currency)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/split/settle',
                          params: {
                            groupId: group.id,
                            payerId: debt.payerId,
                            payeeId: debt.payeeId,
                            amount: debt.amount.toString(),
                          },
                        })
                      }
                      activeOpacity={0.8}
                      style={[
                        styles.debtSettleBtn,
                        {
                          backgroundColor: isUserInvolved ? colors.primary : isDark ? colors.elevatedSurface : colors.background,
                          borderColor: isUserInvolved ? colors.primary : colors.borderLight,
                          borderWidth: isUserInvolved ? 0 : 1,
                        },
                      ]}
                    >
                      <HandCoins size={14} color={isUserInvolved ? colors.onPrimary : colors.primary} />
                      <Text
                        variant="xs"
                        weight="bold"
                        style={{
                          color: isUserInvolved ? colors.onPrimary : colors.primary,
                          marginLeft: 5,
                        }}
                      >
                        Settle Now
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Member Balances & Add Member */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text variant="sm" weight="bold" color="secondary" style={styles.sectionTitleText}>
              MEMBER BALANCES ({memberBalances.length})
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddMember(!showAddMember)}
              style={[
                styles.addMemberBtn,
                {
                  backgroundColor: showAddMember ? colors.expenseMuted : colors.primaryMuted,
                },
              ]}
            >
              {showAddMember ? (
                <X size={13} color={colors.negative} />
              ) : (
                <UserPlus size={13} color={colors.primary} />
              )}
              <Text
                variant="xs"
                weight="bold"
                style={{
                  color: showAddMember ? colors.negative : colors.primary,
                  marginLeft: 4,
                }}
              >
                {showAddMember ? 'Cancel' : 'Add Member'}
              </Text>
            </TouchableOpacity>
          </View>

          {showAddMember ? (
            <Card elevated style={styles.addMemberCard}>
              <View style={styles.addMemberInputRow}>
                <Input
                  placeholder="Member name (e.g. Kiran, Rahul)"
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

          <View
            style={[
              styles.membersCard,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : colors.borderLight,
              },
              !isDark ? Shadows.sm : undefined,
            ]}
          >
            {memberBalances.map((mb, idx) => {
              const memOwed = mb.netBalance > 0;
              const memOwing = mb.netBalance < 0;
              const isSettled = mb.netBalance === 0;
              const avatar = getAvatarStyle(mb.memberName, isDark);

              return (
                <View key={mb.memberId}>
                  <View style={styles.memberRow}>
                    <View style={styles.memberLeft}>
                      <View
                        style={[
                          styles.avatarMd,
                          { backgroundColor: avatar.bg, borderColor: avatar.border },
                        ]}
                      >
                        <Text style={[styles.avatarMdText, { color: avatar.text }]}>
                          {getInitials(mb.memberName)}
                        </Text>
                      </View>
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text variant="sm" weight="bold" numberOfLines={1}>
                            {mb.memberName}
                          </Text>
                          {mb.isCurrentUser && (
                            <View style={[styles.youBadge, { backgroundColor: colors.primaryMuted }]}>
                              <Text variant="xs" weight="bold" style={{ color: colors.primary, fontSize: 10 }}>
                                You
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text variant="xs" color="secondary" style={{ marginTop: 1 }}>
                          {memOwed ? 'Gets back' : memOwing ? 'Owes to group' : 'All settled'}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.balancePill,
                        {
                          backgroundColor: memOwed
                            ? colors.successMuted
                            : memOwing
                            ? colors.expenseMuted
                            : isDark
                            ? colors.elevatedSurface
                            : colors.background,
                        },
                      ]}
                    >
                      {memOwed && <ArrowUpRight size={13} color={colors.positive} style={{ marginRight: 2 }} />}
                      {memOwing && <ArrowDownLeft size={13} color={colors.negative} style={{ marginRight: 2 }} />}
                      {isSettled && <Check size={13} color={colors.secondaryText} style={{ marginRight: 3 }} />}
                      <Text
                        variant="xs"
                        weight="bold"
                        style={{
                          color: memOwed
                            ? colors.positive
                            : memOwing
                            ? colors.negative
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
                  </View>
                  {idx < memberBalances.length - 1 && (
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: isDark ? colors.border : colors.borderLight },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Activity & History Filter Tabs */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text variant="sm" weight="bold" color="secondary" style={styles.sectionTitleText}>
              ACTIVITY & HISTORY
            </Text>
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                onPress={() => setActivityTab('all')}
                style={[
                  styles.tabChip,
                  activityTab === 'all' && {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <Text
                  variant="xs"
                  weight="bold"
                  style={{
                    color: activityTab === 'all' ? colors.onPrimary : colors.secondaryText,
                    fontSize: 11,
                  }}
                >
                  All ({expenses.length + settlements.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActivityTab('expenses')}
                style={[
                  styles.tabChip,
                  activityTab === 'expenses' && {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <Text
                  variant="xs"
                  weight="bold"
                  style={{
                    color: activityTab === 'expenses' ? colors.onPrimary : colors.secondaryText,
                    fontSize: 11,
                  }}
                >
                  Expenses ({expenses.length})
                </Text>
              </TouchableOpacity>
              {settlements.length > 0 && (
                <TouchableOpacity
                  onPress={() => setActivityTab('settlements')}
                  style={[
                    styles.tabChip,
                    activityTab === 'settlements' && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    variant="xs"
                    weight="bold"
                    style={{
                      color: activityTab === 'settlements' ? colors.onPrimary : colors.secondaryText,
                      fontSize: 11,
                    }}
                  >
                    Settled ({settlements.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Expenses Rendering */}
          {(activityTab === 'all' || activityTab === 'expenses') && (
            <>
              {expenses.length === 0 ? (
                activityTab === 'expenses' && (
                  <EmptyState
                    title="No Shared Expenses"
                    description="Tap '+ Add Expense' above to log groceries, dining, or rent."
                  />
                )
              ) : (
                expenses.map((exp) => {
                  const cat = getExpenseCategoryConfig(exp.title, isDark);
                  const IconComp = cat.Icon;

                  return (
                    <View
                      key={exp.id}
                      style={[
                        styles.expenseCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: isDark ? colors.border : colors.borderLight,
                        },
                        !isDark ? Shadows.sm : undefined,
                      ]}
                    >
                      <View style={styles.expenseRow}>
                        <View style={[styles.expenseIconBox, { backgroundColor: cat.bg }]}>
                          <IconComp size={18} color={cat.color} strokeWidth={2.2} />
                        </View>

                        <View style={styles.expenseDetails}>
                          <Text variant="sm" weight="bold" numberOfLines={1}>
                            {exp.title}
                          </Text>
                          <View style={styles.expenseMetaRow}>
                            <Text variant="xs" color="secondary" numberOfLines={1}>
                              Paid by{' '}
                              <Text variant="xs" weight="semibold" style={{ color: colors.mainText }}>
                                {exp.payer?.member_name || 'Member'}
                              </Text>
                            </Text>
                            <Text variant="xs" color="tertiary">
                              •
                            </Text>
                            <Text variant="xs" color="secondary">
                              {formatDisplayDate(exp.date)}
                            </Text>
                            <View
                              style={[
                                styles.splitTypeBadge,
                                {
                                  backgroundColor: isDark ? colors.elevatedSurface : colors.borderLight,
                                },
                              ]}
                            >
                              <Text
                                variant="xs"
                                weight="medium"
                                style={{ color: colors.secondaryText, fontSize: 10 }}
                              >
                                {exp.split_type.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.expenseRightCol}>
                          <Text variant="base" weight="extrabold" style={{ color: colors.mainText }}>
                            {formatCurrency(exp.amount, group.currency)}
                          </Text>
                          <View style={styles.expenseActions}>
                            <TouchableOpacity
                              onPress={() =>
                                router.push({
                                  pathname: '/split/add-expense',
                                  params: { groupId: group.id, editExpenseId: exp.id },
                                })
                              }
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={[
                                styles.actionIconBtn,
                                {
                                  backgroundColor: isDark ? colors.elevatedSurface : colors.background,
                                  borderColor: colors.borderLight,
                                },
                              ]}
                              accessibilityLabel="Edit expense"
                            >
                              <Pencil size={12} color={colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteExpense(exp.id, exp.title)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={[
                                styles.actionIconBtn,
                                {
                                  backgroundColor: isDark ? colors.elevatedSurface : colors.background,
                                  borderColor: colors.borderLight,
                                },
                              ]}
                              accessibilityLabel="Delete expense"
                            >
                              <Trash2 size={12} color={colors.error} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

          {/* Settlement History Rendering */}
          {(activityTab === 'all' || activityTab === 'settlements') &&
            settlements.length > 0 &&
            settlements.map((s) => {
              const payerName = members.find((m) => m.id === s.payer_id)?.member_name || 'Member';
              const payeeName = members.find((m) => m.id === s.payee_id)?.member_name || 'Member';

              return (
                <View
                  key={s.id}
                  style={[
                    styles.expenseCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isDark ? colors.border : colors.borderLight,
                    },
                    !isDark ? Shadows.sm : undefined,
                  ]}
                >
                  <View style={styles.expenseRow}>
                    <View style={[styles.expenseIconBox, { backgroundColor: colors.successMuted }]}>
                      <HandCoins size={18} color={colors.positive} strokeWidth={2.2} />
                    </View>

                    <View style={styles.expenseDetails}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Text variant="sm" weight="bold">
                          {payerName}
                        </Text>
                        <ArrowRight size={12} color={colors.secondaryText} />
                        <Text variant="sm" weight="bold">
                          {payeeName}
                        </Text>
                      </View>
                      <View style={styles.expenseMetaRow}>
                        <View style={[styles.splitTypeBadge, { backgroundColor: colors.successMuted }]}>
                          <Text variant="xs" weight="bold" style={{ color: colors.positive, fontSize: 10 }}>
                            {s.payment_method || 'UPI'}
                          </Text>
                        </View>
                        {s.notes ? (
                          <>
                            <Text variant="xs" color="tertiary">
                              •
                            </Text>
                            <Text variant="xs" color="secondary" numberOfLines={1}>
                              {s.notes}
                            </Text>
                          </>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.expenseRightCol}>
                      <Text variant="base" weight="extrabold" style={{ color: colors.positive }}>
                        {formatCurrency(s.amount, group.currency)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteSettlement(s.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={[
                          styles.actionIconBtn,
                          {
                            backgroundColor: isDark ? colors.elevatedSurface : colors.background,
                            borderColor: colors.borderLight,
                          },
                        ]}
                        accessibilityLabel="Delete settlement"
                      >
                        <Trash2 size={12} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}

          {expenses.length === 0 && settlements.length === 0 && (
            <EmptyState
              title="No Activity Yet"
              description="Tap '+ Add Expense' above to start splitting with your group."
            />
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
  headerRightActions: {
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
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  heroBalanceCol: {
    flex: 1,
    marginRight: Spacing.md,
  },
  heroOverlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroOverline: {
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginTop: 6,
  },
  heroTotalBox: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  heroPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  heroSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  sectionTitleText: {
    letterSpacing: 0.5,
  },
  minimalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  debtCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
  },
  debtHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  debtPartyCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  debtArrowContainer: {
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtFooterDivider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  debtFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debtSettleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  avatarSm: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarSmText: {
    fontSize: 11,
    fontWeight: '700',
  },
  avatarMd: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarMdText: {
    fontSize: 13,
    fontWeight: '700',
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  addMemberCard: {
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.xl,
  },
  addMemberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  confirmMemBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  membersCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  divider: {
    height: 1,
    marginLeft: 62,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  expenseCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  expenseDetails: {
    flex: 1,
    gap: 3,
  },
  expenseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  splitTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  expenseRightCol: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: Spacing.sm,
  },
  expenseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
