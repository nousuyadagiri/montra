import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { transactionService } from '../../services/transactionService';
import { Transaction, TransactionCategory } from '../../types/database';
import {
  Text,
  Heading,
  CurrencyText,
  Input,
  Button,
  Card,
  Badge,
  LoadingState,
  EmptyState,
} from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { exportTransactionsToCSV } from '../../utils/csvExport';
import {
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Download,
  Filter,
} from 'lucide-react-native';

const TYPE_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Expenses', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Transfers', value: 'transfer' },
] as const;

export default function TransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const [txns, cats] = await Promise.all([
        transactionService.getTransactions(user.id, {
          type: selectedType as any,
          categoryId: selectedCategory,
          searchQuery: searchQuery.trim() || undefined,
        }),
        transactionService.getCategories(user.id),
      ]);
      setTransactions(txns);
      setCategories(cats);
    } catch (err) {
      console.warn('Failed to load transactions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedType, selectedCategory, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [fetchTransactions])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const handleExportCSV = async () => {
    await exportTransactionsToCSV(transactions);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerTitleRow}>
          <Heading level={1}>Transactions</Heading>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.surface }]}
              onPress={handleExportCSV}
              accessibilityLabel="Export transactions as CSV"
            >
              <Download size={20} color={colors.mainText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/transactions/add')}
              accessibilityLabel="Add transaction"
            >
              <Plus size={20} color="#0B0F14" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <Input
          placeholder="Search by title..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color={colors.secondaryText} />}
          containerStyle={styles.searchBar}
        />

        {/* Type Filter Pills */}
        <View style={styles.filterPillsRow}>
          {TYPE_FILTERS.map((item) => {
            const isSelected = selectedType === item.value;
            return (
              <TouchableOpacity
                key={item.label}
                onPress={() => setSelectedType(item.value)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  variant="xs"
                  weight={isSelected ? 'bold' : 'medium'}
                  style={{ color: isSelected ? '#0B0F14' : colors.mainText }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Category Horizontal Filter */}
        {categories.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catFilterScroll}
          >
            <TouchableOpacity
              onPress={() => setSelectedCategory(undefined)}
              style={[
                styles.catPill,
                {
                  backgroundColor: !selectedCategory ? colors.primaryMuted : 'transparent',
                  borderColor: !selectedCategory ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                variant="xs"
                weight={!selectedCategory ? 'bold' : 'regular'}
                style={{ color: !selectedCategory ? colors.primary : colors.secondaryText }}
              >
                All Categories
              </Text>
            </TouchableOpacity>
            {categories.map((c) => {
              const isSelected = selectedCategory === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setSelectedCategory(isSelected ? undefined : c.id)}
                  style={[
                    styles.catPill,
                    {
                      backgroundColor: isSelected ? colors.primaryMuted : 'transparent',
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    variant="xs"
                    weight={isSelected ? 'bold' : 'regular'}
                    style={{ color: isSelected ? colors.primary : colors.secondaryText }}
                  >
                    {c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}
      </View>

      {/* Transactions List */}
      {loading && !refreshing ? (
        <LoadingState message="Loading transactions..." />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Transactions Found"
              description="No transaction matches your filters. Tap '+ Add Transaction' to create one."
              actionTitle="Add Transaction"
              onAction={() => router.push('/transactions/add')}
            />
          }
          renderItem={({ item }) => {
            const isIncome = item.type === 'income';
            const isTransfer = item.type === 'transfer';

            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push(`/transactions/${item.id}`)}
              >
                <Card style={styles.txnCard}>
                  <View style={styles.txnRow}>
                    <View
                      style={[
                        styles.iconCircle,
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
                        <ArrowDownLeft size={20} color={colors.success} />
                      ) : isTransfer ? (
                        <ArrowLeftRight size={20} color={colors.secondary} />
                      ) : (
                        <ArrowUpRight size={20} color={colors.error} />
                      )}
                    </View>

                    <View style={styles.txnInfo}>
                      <Text variant="base" weight="semibold" numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text variant="xs" color="secondary">
                        {item.category?.name || 'General'} • {item.date} • {item.payment_method}
                      </Text>
                    </View>

                    <View style={styles.txnAmountCol}>
                      <CurrencyText
                        amount={item.amount}
                        currency={profile?.currency || 'INR'}
                        variant="base"
                        weight="bold"
                        style={{
                          color: isIncome
                            ? colors.success
                            : isTransfer
                            ? colors.secondary
                            : colors.mainText,
                        }}
                      />
                      <Badge
                        label={isIncome ? 'Income' : isTransfer ? 'Transfer' : 'Expense'}
                        variant={isIncome ? 'success' : isTransfer ? 'secondary' : 'error'}
                        size="sm"
                      />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    marginBottom: Spacing.sm,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  catFilterScroll: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  catPill: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    gap: Spacing.xs,
  },
  txnCard: {
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  txnInfo: {
    flex: 1,
    gap: 3,
  },
  txnAmountCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
});

