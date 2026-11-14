import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Download, Plus, Calendar } from 'lucide-react-native';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import { useSyncStore } from '../../store/syncStore';
import { transactionService } from '../../services/transactionService';
import { Transaction, TransactionCategory, SupportedCurrency } from '../../types/database';
import {
  Text,
  Heading,
  TransactionItem,
  SearchBar,
  DateFilterOption,
  DemoDataBadge,
  EmptyState,
  ErrorState,
  ListSkeleton,
  TransactionsIllustration,
} from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { exportTransactionsToCSV } from '../../utils/csvExport';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';

const TYPE_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Expenses', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Transfers', value: 'transfer' },
] as const;

interface DateGroup {
  dateKey: string;
  displayDate: string;
  items: Transaction[];
}

export default function TransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const syncTick = useSyncStore((s) => s.syncTick);

  const demoTransactions = useDemoStore((s) => s.demoTransactions);
  const demoCategories = useDemoStore((s) => s.demoCategories);
  const demoProfile = useDemoStore((s) => s.demoProfile);

  const [realTransactions, setRealTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [initialLoading, setInitialLoading] = useState(Boolean(user));
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedDateFilter] = useState<DateFilterOption>('all');

  const isDemo = !user;

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setInitialLoading(false);
      setRefreshing(false);
      setFetchError(null);
      return;
    }
    try {
      setFetchError(null);
      const [txns, cats] = await Promise.all([
        transactionService.getTransactions(user.id, {
          type: selectedType as any,
          categoryId: selectedCategory,
          searchQuery: searchQuery.trim() || undefined,
        }),
        transactionService.getCategories(user.id),
      ]);
      hasLoadedRef.current = true;
      setRealTransactions(txns);
      setCategories(cats);
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Unable to load transactions.');
      setFetchError(msg);
      if (hasLoadedRef.current) {
        toast.error(msg, 'Load Failed');
      }
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedType, selectedCategory, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [fetchTransactions])
  );

  useEffect(() => {
    if (syncTick > 0) {
      fetchTransactions();
    }
  }, [syncTick, fetchTransactions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const activeCategories = isDemo ? demoCategories : categories;

  // Deduplicate and filter categories by active transaction type to avoid duplicate chips
  const displayCategories = useMemo(() => {
    let list = activeCategories;
    if (selectedType) {
      list = list.filter((c) => c.type === selectedType);
    }
    const seen = new Set<string>();
    return list.filter((c) => {
      const nameKey = (c.name || '').trim().toLowerCase();
      if (!nameKey || seen.has(nameKey)) return false;
      seen.add(nameKey);
      return true;
    });
  }, [activeCategories, selectedType]);

  // Filter Transactions (supports demo & real client-side filtering consistently)
  const filteredTransactions = useMemo(() => {
    const source = isDemo ? demoTransactions : realTransactions;

    return source.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCat = item.category?.name.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat && !matchesNotes) return false;
      }

      // 2. Type Filter
      if (selectedType && item.type !== selectedType) {
        return false;
      }

      // 3. Category Filter
      if (selectedCategory && item.category_id !== selectedCategory) {
        return false;
      }

      // 4. Date Filter
      if (selectedDateFilter !== 'all' && item.date) {
        const itemDate = new Date(item.date);
        const now = new Date();
        if (selectedDateFilter === 'this_month') {
          if (itemDate.getMonth() !== now.getMonth() || itemDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        } else if (selectedDateFilter === 'last_month') {
          const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          if (itemDate.getMonth() !== lastMonth || itemDate.getFullYear() !== year) {
            return false;
          }
        } else if (selectedDateFilter === 'this_year') {
          if (itemDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        }
      }

      return true;
    });
  }, [isDemo, demoTransactions, realTransactions, searchQuery, selectedType, selectedCategory, selectedDateFilter]);

  // Group transactions by Date
  const groupedTransactions: DateGroup[] = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    filteredTransactions.forEach((txn) => {
      const dateKey = txn.date || todayStr;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(txn);
    });

    return Object.keys(groups)
      .sort((a, b) => (a < b ? 1 : -1))
      .map((dateKey) => {
        let displayDate = dateKey;
        if (dateKey === todayStr) {
          displayDate = 'Today';
        } else if (dateKey === yesterdayStr) {
          displayDate = 'Yesterday';
        } else {
          try {
            const d = new Date(dateKey + 'T00:00:00');
            displayDate = d.toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            });
          } catch {
            displayDate = dateKey;
          }
        }
        return {
          dateKey,
          displayDate,
          items: groups[dateKey],
        };
      });
  }, [filteredTransactions]);

  const handleExportCSV = async () => {
    await exportTransactionsToCSV(filteredTransactions);
  };

  const activeProfile = isDemo ? demoProfile : profile;
  const currency: SupportedCurrency = (activeProfile?.currency as SupportedCurrency) || 'INR';

  const statusBarHeight = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 0;
  const topInset = Math.max(insets.top, statusBarHeight, Platform.OS === 'android' ? 28 : 16);
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 24 : 10);
  const tabHeight = 62 + bottomInset;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. TOP HEADER */}
      <View style={[styles.header, { paddingTop: topInset + (Platform.OS === 'android' ? 14 : 10) }]}>
        <View style={styles.headerTitleRow}>
          <View style={styles.titleWithBadge}>
            <Heading level={2} style={styles.titleText}>Transactions</Heading>
            {isDemo ? <DemoDataBadge compact /> : null}
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={handleExportCSV}
              accessibilityLabel="Export transactions as CSV"
            >
              <Download size={17} color={colors.mainText} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/transactions/add')}
              accessibilityLabel="Add transaction"
              activeOpacity={0.8}
            >
              <Plus size={16} color={colors.onPrimary} />
              <Text variant="xs" weight="bold" style={{ color: colors.onPrimary, marginLeft: 4 }}>
                Add
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. COMPACT SEARCH BAR */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search transactions..."
          onClear={() => setSearchQuery('')}
          style={styles.searchBar}
        />

        {/* 3. TYPE FILTER PILLS (Segmented Row) */}
        <View style={[styles.filterPillsRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          {TYPE_FILTERS.map((item) => {
            const isSelected = selectedType === item.value;
            return (
              <TouchableOpacity
                key={item.label}
                onPress={() => setSelectedType(item.value)}
                activeOpacity={0.7}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.primary : 'transparent',
                  },
                ]}
              >
                <Text
                  variant="xs"
                  weight={isSelected ? 'bold' : 'medium'}
                  style={{
                    color: isSelected ? colors.onPrimary : colors.secondaryText,
                    fontSize: 11,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. CATEGORY HORIZONTAL FILTER */}
        {displayCategories.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catFilterScroll}
          >
            <TouchableOpacity
              onPress={() => setSelectedCategory(undefined)}
              activeOpacity={0.7}
              style={[
                styles.catPill,
                {
                  backgroundColor: !selectedCategory
                    ? colors.primaryMuted
                    : 'transparent',
                  borderColor: !selectedCategory ? colors.primary : colors.borderLight,
                },
              ]}
            >
              <Text
                variant="xs"
                weight={!selectedCategory ? 'bold' : 'regular'}
                style={{
                  color: !selectedCategory ? colors.primary : colors.secondaryText,
                  fontSize: 11,
                }}
              >
                All Categories
              </Text>
            </TouchableOpacity>

            {displayCategories.map((c) => {
              const isSelected = selectedCategory === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setSelectedCategory(isSelected ? undefined : c.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.catPill,
                    {
                      backgroundColor: isSelected
                        ? colors.primaryMuted
                        : 'transparent',
                      borderColor: isSelected ? colors.primary : colors.borderLight,
                    },
                  ]}
                >
                  <Text
                    variant="xs"
                    weight={isSelected ? 'bold' : 'regular'}
                    style={{
                      color: isSelected ? colors.primary : colors.secondaryText,
                      fontSize: 11,
                    }}
                  >
                    {c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}
      </View>

      {/* 5. TRANSACTIONS GROUPED BY DATE */}
      <FlatList
        data={groupedTransactions}
        keyExtractor={(group) => group.dateKey}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabHeight + Spacing.lg },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isDemo && initialLoading ? (
            <ListSkeleton count={6} cardHeight={62} />
          ) : !isDemo && fetchError ? (
            <ErrorState
              title="Could Not Load Transactions"
              message={fetchError}
              onRetry={() => {
                setInitialLoading(true);
                fetchTransactions();
              }}
            />
          ) : (
            <EmptyState
              illustration={<TransactionsIllustration size={160} />}
              title="No Transactions Found"
              description="No transactions match your current search or filters. Tap '+ Add' to record one."
              actionTitle="Add Transaction"
              actionIcon={<Plus size={16} color={colors.onPrimary} />}
              onAction={() => router.push('/transactions/add')}
            />
          )
        }
        renderItem={({ item: group }) => (
          <View style={styles.dateGroupContainer}>
            <View style={styles.dateHeaderRow}>
              <View style={styles.dateLeftRow}>
                <Calendar size={12} color={colors.secondaryText} />
                <Text variant="xs" color="secondary" weight="bold" style={styles.dateHeaderText}>
                  {group.displayDate.toUpperCase()}
                </Text>
              </View>
              <Text variant="xs" color="secondary" style={styles.countText}>
                {group.items.length} {group.items.length === 1 ? 'txn' : 'txns'}
              </Text>
            </View>

            <View
              style={[
                styles.groupCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                },
              ]}
            >
              {group.items.map((txn, idx) => (
                <TransactionItem
                  key={txn.id}
                  transaction={txn}
                  currency={currency}
                  onPress={() => router.push(`/transactions/${txn.id}`)}
                  showDivider={idx < group.items.length - 1}
                />
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  titleText: {
    fontSize: 20,
    letterSpacing: -0.4,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    marginBottom: 6,
  },
  filterPillsRow: {
    flexDirection: 'row',
    padding: 2.5,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 6,
  },
  filterPill: {
    flex: 1,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  catFilterScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 4,
  },
  dateGroupContainer: {
    marginBottom: Spacing.sm,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  dateLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateHeaderText: {
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  countText: {
    fontSize: 10,
  },
  groupCard: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
  },
});
