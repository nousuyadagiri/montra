import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { budgetService } from '../../services/budgetService';
import { transactionService } from '../../services/transactionService';
import { TransactionCategory } from '../../types/database';
import { Text, Heading, Input, Button, Header, Card } from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { CURRENCY_SYMBOLS, parseCurrencyInput } from '../../utils/currency';
import { Check, PieChart } from 'lucide-react-native';

export default function AddBudgetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const [name, setName] = useState('Monthly Budget');
  const [totalLimitStr, setTotalLimitStr] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [categoryAllocations, setCategoryAllocations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    if (!user) return;
    transactionService.getCategories(user.id, 'expense').then((cats) => {
      setCategories(cats);
    });
  }, [user]);

  const handleAllocationChange = (catId: string, val: string) => {
    setCategoryAllocations((prev) => ({
      ...prev,
      [catId]: val,
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    const totalLimit = parseCurrencyInput(totalLimitStr);

    if (!name.trim()) {
      Alert.alert('Required Field', 'Please provide a name for this budget.');
      return;
    }
    if (totalLimit <= 0) {
      Alert.alert('Invalid Limit', 'Please specify a total budget limit greater than zero.');
      return;
    }

    const catInputs = Object.entries(categoryAllocations)
      .map(([catId, val]) => ({
        categoryId: catId,
        allocatedAmount: parseCurrencyInput(val),
      }))
      .filter((c) => c.allocatedAmount > 0);

    try {
      setLoading(true);
      await budgetService.createBudget(user.id, {
        name: name.trim(),
        period,
        month: currentMonth,
        year: currentYear,
        totalLimit,
        categories: catInputs,
      });

      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create budget.');
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = CURRENCY_SYMBOLS[profile?.currency || 'INR'] || '₹';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Create Budget" showBack />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Input
          label="Budget Name"
          placeholder="e.g. November 2026 Budget"
          value={name}
          onChangeText={setName}
        />

        <Card elevated style={styles.amountCard}>
          <Text variant="xs" color="secondary" weight="semibold">
            TOTAL MONTHLY LIMIT
          </Text>
          <View style={styles.amountInputRow}>
            <Text variant="3xl" weight="bold" color="primary">
              {currencySymbol}
            </Text>
            <Input
              placeholder="50000"
              keyboardType="decimal-pad"
              value={totalLimitStr}
              onChangeText={setTotalLimitStr}
              inputStyle={styles.bigAmountInput}
              containerStyle={styles.amountContainer}
            />
          </View>
        </Card>

        {/* Category-Specific Limits */}
        {categories.length > 0 ? (
          <View style={styles.categorySection}>
            <Text variant="sm" weight="semibold" color="secondary" style={styles.sectionLabel}>
              CATEGORY BUDGET CAPS (OPTIONAL)
            </Text>
            <Card elevated style={styles.catCard}>
              {categories.map((c) => (
                <View key={c.id} style={styles.catRow}>
                  <View style={styles.catNameGroup}>
                    <View
                      style={[styles.catColorCircle, { backgroundColor: c.color || colors.primary }]}
                    />
                    <Text variant="sm" weight="medium" style={styles.catName}>
                      {c.name}
                    </Text>
                  </View>
                  <View style={styles.catInputWrapper}>
                    <Input
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      prefix={currencySymbol}
                      value={categoryAllocations[c.id] || ''}
                      onChangeText={(val) => handleAllocationChange(c.id, val)}
                      containerStyle={{ marginBottom: 0, width: 140 }}
                      inputStyle={{ fontSize: 13, paddingVertical: 4 }}
                    />
                  </View>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        <Button
          title="Save Budget"
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleSave}
          leftIcon={<Check size={20} color="#0B0F14" />}
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
    paddingTop: Spacing.sm,
  },
  amountCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  amountContainer: {
    marginBottom: 0,
    width: 220,
  },
  bigAmountInput: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    marginBottom: Spacing.xs,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  catCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  catColorCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  catName: {
    flex: 1,
  },
  catInputWrapper: {
    width: 140,
  },
});

