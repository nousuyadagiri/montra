import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { savingsService } from '../../services/savingsService';
import { Text, Heading, Input, Button, Header, Card } from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { CURRENCY_SYMBOLS, parseCurrencyInput } from '../../utils/currency';
import { Check, Target, Calendar } from 'lucide-react-native';

const GOAL_CATEGORIES = [
  'Emergency Fund',
  'Travel & Vacation',
  'Home & Property',
  'Vehicle',
  'Gadget',
  'Retirement',
  'General',
];

export default function AddGoalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [currentAmountStr, setCurrentAmountStr] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Emergency Fund');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    const targetAmount = parseCurrencyInput(targetAmountStr);
    const currentAmount = parseCurrencyInput(currentAmountStr);

    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a name for your financial goal.');
      return;
    }
    if (targetAmount <= 0) {
      Alert.alert('Invalid Target', 'Please enter a target amount greater than zero.');
      return;
    }

    try {
      setLoading(true);
      await savingsService.createGoal(user.id, {
        name: name.trim(),
        targetAmount,
        currentAmount,
        targetDate: targetDate.trim() || undefined,
        category,
      });

      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create savings goal.');
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = CURRENCY_SYMBOLS[profile?.currency || 'INR'] || '₹';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="New Savings Goal" showBack />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Input
          label="Goal Name"
          placeholder="e.g. 6-Month Emergency Fund"
          value={name}
          onChangeText={setName}
        />

        <Card elevated style={styles.amountCard}>
          <Text variant="xs" color="secondary" weight="semibold">
            TARGET AMOUNT
          </Text>
          <View style={styles.amountInputRow}>
            <Text variant="3xl" weight="bold" color="secondary">
              {currencySymbol}
            </Text>
            <Input
              placeholder="100000"
              keyboardType="decimal-pad"
              value={targetAmountStr}
              onChangeText={setTargetAmountStr}
              inputStyle={styles.bigAmountInput}
              containerStyle={styles.amountContainer}
            />
          </View>
        </Card>

        <Input
          label="Already Saved (Optional)"
          placeholder="0.00"
          prefix={currencySymbol}
          keyboardType="decimal-pad"
          value={currentAmountStr}
          onChangeText={setCurrentAmountStr}
        />

        <Input
          label="Target Date (YYYY-MM-DD)"
          placeholder="2027-12-31"
          value={targetDate}
          onChangeText={setTargetDate}
          leftIcon={<Calendar size={18} color={colors.secondaryText} />}
        />

        {/* Category Selector */}
        <View style={styles.categorySection}>
          <Text variant="sm" weight="medium" color="secondary" style={styles.sectionLabel}>
            Goal Category
          </Text>
          <View style={styles.pillsRow}>
            {GOAL_CATEGORIES.map((c) => {
              const isSelected = category === c;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    variant="xs"
                    weight={isSelected ? 'bold' : 'regular'}
                    style={{ color: isSelected ? colors.primary : colors.mainText }}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Button
          title="Create Goal"
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
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
});

