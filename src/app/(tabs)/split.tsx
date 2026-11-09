import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { splitService } from '../../services/splitService';
import { ExpenseGroup } from '../../types/database';
import {
  Text,
  Heading,
  CurrencyText,
  Button,
  Card,
  Badge,
  LoadingState,
  EmptyState,
} from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import {
  Users,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Plane,
  Home,
  Coffee,
  Receipt,
} from 'lucide-react-native';

export default function SplitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const [groups, setGroups] = useState<ExpenseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [netOwed, setNetOwed] = useState(0);
  const [netOwing, setNetOwing] = useState(0);

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    try {
      const data = await splitService.getGroups(user.id);
      setGroups(data);

      // Compute total owed and owing across groups
      let totalOwed = 0;
      let totalOwing = 0;

      for (const g of data) {
        try {
          const details = await splitService.getGroupDetails(g.id, user.id);
          if (details.yourNetBalance > 0) {
            totalOwed += details.yourNetBalance;
          } else if (details.yourNetBalance < 0) {
            totalOwing += Math.abs(details.yourNetBalance);
          }
        } catch {
          // ignore individual group err
        }
      }

      setNetOwed(totalOwed);
      setNetOwing(totalOwing);
    } catch (err) {
      console.warn('Failed to fetch groups:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'trip':
      case 'travel':
        return <Plane size={20} color={colors.secondary} />;
      case 'house':
      case 'apartment':
      case 'household':
        return <Home size={20} color={colors.primary} />;
      default:
        return <Receipt size={20} color={colors.warning} />;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState message="Loading shared groups and balances..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: insets.bottom + Spacing['3xl'],
          },
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
        {/* Header */}
        <View style={styles.headerRow}>
          <Heading level={1}>Shared Expenses</Heading>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/split/create-group')}
          >
            <Plus size={18} color="#0B0F14" />
            <Text variant="xs" weight="bold" style={{ color: '#0B0F14', marginLeft: 4 }}>
              New Group
            </Text>
          </TouchableOpacity>
        </View>

        {/* Global Net Balance Card */}
        <Card elevated style={styles.summaryCard}>
          <Text variant="xs" color="secondary" weight="semibold">
            TOTAL SPLITWISE BALANCE
          </Text>

          <View style={styles.balancesSplitRow}>
            <View style={styles.balanceCol}>
              <View style={styles.balanceLabelRow}>
                <View style={[styles.iconDot, { backgroundColor: colors.successMuted }]}>
                  <ArrowDownLeft size={14} color={colors.success} />
                </View>
                <Text variant="xs" color="secondary">
                  You are owed
                </Text>
              </View>
              <CurrencyText
                amount={netOwed}
                currency={profile?.currency || 'INR'}
                variant="xl"
                weight="bold"
                style={{ color: colors.success }}
              />
            </View>

            <View style={[styles.vertLine, { backgroundColor: colors.border }]} />

            <View style={styles.balanceCol}>
              <View style={styles.balanceLabelRow}>
                <View style={[styles.iconDot, { backgroundColor: colors.errorMuted }]}>
                  <ArrowUpRight size={14} color={colors.error} />
                </View>
                <Text variant="xs" color="secondary">
                  You owe
                </Text>
              </View>
              <CurrencyText
                amount={netOwing}
                currency={profile?.currency || 'INR'}
                variant="xl"
                weight="bold"
                style={{ color: colors.error }}
              />
            </View>
          </View>
        </Card>

        {/* Groups List */}
        <View style={styles.groupsHeader}>
          <Text variant="base" weight="bold">
            Active Groups
          </Text>
          <Text variant="xs" color="secondary">
            {groups.length} groups
          </Text>
        </View>

        {groups.length === 0 ? (
          <EmptyState
            icon={<Users size={44} color={colors.primary} />}
            title="No Shared Groups"
            description="Create a group to split flat rent, road trips, dinners, and events with friends without awkward math."
            actionTitle="Create Your First Group"
            onAction={() => router.push('/split/create-group')}
          />
        ) : (
          groups.map((group) => {
            const memberCount = group.members?.length || 1;

            return (
              <TouchableOpacity
                key={group.id}
                activeOpacity={0.7}
                onPress={() => router.push(`/split/${group.id}`)}
              >
                <Card elevated style={styles.groupCard}>
                  <View style={styles.groupCardRow}>
                    <View style={[styles.groupIconContainer, { backgroundColor: colors.surface }]}>
                      {getCategoryIcon(group.category)}
                    </View>

                    <View style={styles.groupInfo}>
                      <Text variant="base" weight="bold">
                        {group.name}
                      </Text>
                      <Text variant="xs" color="secondary">
                        {group.category} • {memberCount} {memberCount === 1 ? 'member' : 'members'}
                      </Text>
                      {group.description ? (
                        <Text variant="xs" color="tertiary" numberOfLines={1}>
                          {group.description}
                        </Text>
                      ) : null}
                    </View>

                    <ChevronRight size={20} color={colors.secondaryText} />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.lg,
  },
  summaryCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  balancesSplitRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  balanceCol: {
    flex: 1,
  },
  balanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  iconDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vertLine: {
    width: 1,
    height: 40,
    marginHorizontal: Spacing.md,
  },
  groupsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  groupCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  groupCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  groupInfo: {
    flex: 1,
    gap: 2,
  },
});

