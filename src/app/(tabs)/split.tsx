import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import { useSyncStore } from '../../store/syncStore';
import { splitService } from '../../services/splitService';
import { ExpenseGroup, SupportedCurrency } from '../../types/database';
import {
  Text,
  Heading,
  GroupExpenseCard,
  DemoDataBadge,
  EmptyState,
  ErrorState,
  ListSkeleton,
} from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';

export default function SplitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const syncTick = useSyncStore((s) => s.syncTick);

  const demoGroups = useDemoStore((s) => s.demoGroups);
  const demoGroupExpenses = useDemoStore((s) => s.demoGroupExpenses);
  const demoGroupSettlements = useDemoStore((s) => s.demoGroupSettlements);
  const demoProfile = useDemoStore((s) => s.demoProfile);
  const getDemoGroupDetails = useDemoStore((s) => s.getDemoGroupDetails);

  const [realGroups, setRealGroups] = useState<ExpenseGroup[]>([]);
  const [initialLoading, setInitialLoading] = useState(Boolean(user));
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [realOwed, setRealOwed] = useState(0);
  const [realOwing, setRealOwing] = useState(0);
  const [groupBalancesMap, setGroupBalancesMap] = useState<Record<string, number>>({});
  const hasLoadedRef = useRef(false);

  const isDemo = !user;

  const fetchGroups = useCallback(async () => {
    if (!user) {
      setInitialLoading(false);
      setRefreshing(false);
      setFetchError(null);
      return;
    }
    try {
      setFetchError(null);
      const data = await splitService.getGroups(user.id);
      hasLoadedRef.current = true;
      setRealGroups(data);

      const groupDetailsList = await Promise.allSettled(
        data.map((g) => splitService.getGroupDetails(g.id, user.id))
      );

      let totalOwed = 0;
      let totalOwing = 0;
      const bMap: Record<string, number> = {};

      groupDetailsList.forEach((res, idx) => {
        if (res.status === 'fulfilled') {
          const details = res.value;
          const groupId = data[idx].id;
          bMap[groupId] = details.yourNetBalance;

          if (details.yourNetBalance > 0) {
            totalOwed += details.yourNetBalance;
          } else if (details.yourNetBalance < 0) {
            totalOwing += Math.abs(details.yourNetBalance);
          }
        }
      });

      setGroupBalancesMap(bMap);
      setRealOwed(totalOwed);
      setRealOwing(totalOwing);
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Unable to load shared groups.');
      setFetchError(msg);
      if (hasLoadedRef.current) {
        toast.error(msg, 'Load Failed');
      }
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups])
  );

  useEffect(() => {
    if (syncTick > 0) {
      fetchGroups();
    }
  }, [syncTick, fetchGroups]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  void demoGroupExpenses;
  void demoGroupSettlements;
  const demoSummary = (() => {
    let owed = 0;
    let owing = 0;
    const map: Record<string, number> = {};
    demoGroups.forEach((g) => {
      const details = getDemoGroupDetails(g.id);
      const bal = details?.yourNetBalance || 0;
      map[g.id] = bal;
      if (bal > 0) owed += bal;
      else if (bal < 0) owing += Math.abs(bal);
    });
    return { owed, owing, map };
  })();

  const activeProfile = isDemo ? demoProfile : profile;
  const currency: SupportedCurrency = (activeProfile?.currency as SupportedCurrency) || 'INR';

  const totalOwed = isDemo ? demoSummary.owed : realOwed;
  const totalOwing = isDemo ? demoSummary.owing : realOwing;
  const netSplitBalance = totalOwed - totalOwing;
  const groupsList = isDemo ? demoGroups : realGroups;
  const activeBalancesMap = isDemo ? demoSummary.map : groupBalancesMap;

  const statusBarHeight = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 0;
  const topInset = Math.max(insets.top, statusBarHeight, Platform.OS === 'android' ? 28 : 16);
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 24 : 10);
  const tabHeight = 62 + bottomInset;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + (Platform.OS === 'android' ? 16 : 12),
            paddingBottom: tabHeight + Spacing.xl,
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
        {/* 1. TOP HEADER */}
        <View style={styles.topHeader}>
          <View style={styles.titleWithBadge}>
            <Heading level={2} style={styles.screenTitle}>Shared Expenses</Heading>
            {isDemo ? <DemoDataBadge compact /> : null}
          </View>

          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/split/create-group')}
            accessibilityLabel="Create group"
          >
            <Plus size={15} color={colors.onPrimary} strokeWidth={2.5} />
            <Text variant="xs" weight="bold" style={{ color: colors.onPrimary, marginLeft: 4 }}>
              New Group
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. GLOBAL SPLITWISE BALANCE CARD */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.surface, borderColor: colors.borderLight },
          ]}
        >
          <View style={styles.summaryTop}>
            <Text variant="xs" color="secondary" weight="semibold">
              TOTAL SHARED BALANCE
            </Text>
            <Text
              variant="xs"
              weight="bold"
              style={{
                color:
                  netSplitBalance > 0
                    ? colors.positive
                    : netSplitBalance < 0
                    ? colors.negative
                    : colors.secondaryText,
              }}
            >
              {netSplitBalance > 0
                ? `Overall +${formatCurrency(netSplitBalance, currency)}`
                : netSplitBalance < 0
                ? `Overall -${formatCurrency(Math.abs(netSplitBalance), currency)}`
                : 'All Settled'}
            </Text>
          </View>

          <View style={styles.balancesSplitRow}>
            {/* Owed to you */}
            <View style={styles.balanceCol}>
              <View style={styles.balanceLabelRow}>
                <View
                  style={[
                    styles.iconDot,
                    { backgroundColor: colors.successMuted },
                  ]}
                >
                  <ArrowDownLeft size={13} color={colors.positive} />
                </View>
                <Text variant="xs" color="secondary" weight="medium">
                  You are owed
                </Text>
              </View>
              <Text variant="lg" weight="bold" style={{ color: colors.positive, marginTop: 4 }}>
                {formatCurrency(totalOwed, currency)}
              </Text>
            </View>

            <View style={[styles.vertLine, { backgroundColor: colors.borderLight }]} />

            {/* You owe */}
            <View style={styles.balanceCol}>
              <View style={styles.balanceLabelRow}>
                <View
                  style={[
                    styles.iconDot,
                    { backgroundColor: colors.expenseMuted },
                  ]}
                >
                  <ArrowUpRight size={13} color={colors.negative} />
                </View>
                <Text variant="xs" color="secondary" weight="medium">
                  You owe
                </Text>
              </View>
              <Text variant="lg" weight="bold" style={{ color: colors.negative, marginTop: 4 }}>
                {formatCurrency(totalOwing, currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. GROUPS LIST HEADER */}
        <View style={styles.groupsHeader}>
          <Text variant="sm" weight="bold">
            Active Groups
          </Text>
          <Text variant="xs" color="secondary">
            {groupsList.length} {groupsList.length === 1 ? 'Group' : 'Groups'}
          </Text>
        </View>

        {/* 4. GROUPS LIST */}
        {!isDemo && initialLoading ? (
          <ListSkeleton count={4} cardHeight={78} />
        ) : !isDemo && fetchError && groupsList.length === 0 ? (
          <ErrorState
            title="Could Not Load Groups"
            message={fetchError}
            onRetry={() => {
              setInitialLoading(true);
              fetchGroups();
            }}
          />
        ) : groupsList.length === 0 ? (
          <EmptyState
            icon={<Users size={44} color={colors.primary} />}
            title="No Shared Groups"
            description="Create a group to split flat rent, road trips, dinners, and events with friends without awkward math."
            actionTitle="Create Your First Group"
            onAction={() => router.push('/split/create-group')}
          />
        ) : (
          groupsList.map((group) => (
            <GroupExpenseCard
              key={group.id}
              group={group}
              netBalance={activeBalancesMap[group.id] || 0}
              currency={currency}
              onPress={() => router.push(`/split/${group.id}`)}
            />
          ))
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  screenTitle: {
    fontSize: 20,
    letterSpacing: -0.4,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  summaryCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.md,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  balancesSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceCol: {
    flex: 1,
  },
  balanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vertLine: {
    width: StyleSheet.hairlineWidth,
    height: 38,
    marginHorizontal: Spacing.md,
  },
  groupsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
});
