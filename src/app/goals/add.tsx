import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';
import { savingsService } from '../../services/savingsService';
import { SupportedCurrency } from '../../types/database';
import {
  Text,
  Input,
  Button,
  Header,
  LoadingState,
  DatePickerField,
} from '../../components/ui';
import { Spacing, BorderRadius, Shadows } from '../../theme/tokens';
import { CURRENCY_SYMBOLS, parseCurrencyInput } from '../../utils/currency';
import {
  Check,
  Plus,
  ShieldCheck,
  Plane,
  Home,
  Car,
  Laptop,
  PiggyBank,
  Target,
} from 'lucide-react-native';

const GOAL_CATEGORIES = [
  { id: 'Emergency Fund', name: 'Emergency Fund', icon: ShieldCheck, color: '#10B981' },
  { id: 'Travel & Vacation', name: 'Travel & Vacation', icon: Plane, color: '#0EA5E9' },
  { id: 'Home & Property', name: 'Home & Property', icon: Home, color: '#EC4899' },
  { id: 'Vehicle', name: 'Vehicle', icon: Car, color: '#F59E0B' },
  { id: 'Gadget', name: 'Gadget & Tech', icon: Laptop, color: '#8B5CF6' },
  { id: 'Retirement', name: 'Retirement', icon: PiggyBank, color: '#14B8A6' },
  { id: 'General', name: 'General', icon: Target, color: '#6366F1' },
];

const PRESET_AMOUNTS = [10000, 25000, 50000, 100000];

export default function AddGoalScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditing = Boolean(editId);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const demoGoals = useDemoStore((s) => s.demoGoals);
  const demoProfile = useDemoStore((s) => s.demoProfile);
  const createDemoGoal = useDemoStore((s) => s.createDemoGoal);
  const updateDemoGoal = useDemoStore((s) => s.updateDemoGoal);

  const isDemo = !user || (editId?.startsWith('demo-') ?? false);

  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [currentAmountStr, setCurrentAmountStr] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Emergency Fund');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(Boolean(editId && !isDemo));

  useEffect(() => {
    if (!editId) {
      setInitialLoading(false);
      return;
    }
    if (isDemo) {
      const existing = demoGoals.find((g) => g.id === editId);
      if (existing) {
        setName(existing.name);
        setTargetAmountStr(String(existing.target_amount));
        setCurrentAmountStr(String(existing.current_amount));
        setTargetDate(existing.target_date || '');
        setCategory(existing.category || 'Emergency Fund');
      }
      setInitialLoading(false);
      return;
    }

    setInitialLoading(true);
    savingsService
      .getGoalById(editId)
      .then((res) => {
        if (!res?.goal) return;
        setName(res.goal.name);
        setTargetAmountStr(String(res.goal.target_amount));
        setCurrentAmountStr(String(res.goal.current_amount));
        setTargetDate(res.goal.target_date || '');
        setCategory(res.goal.category || 'Emergency Fund');
      })
      .catch((err) => toast.error(getErrorMessage(err, 'Failed to load goal details.')))
      .finally(() => setInitialLoading(false));
  }, [editId, isDemo, demoGoals]);

  const handlePresetSelect = (preset: number) => {
    const cur = parseCurrencyInput(targetAmountStr);
    setTargetAmountStr(String(cur > 0 ? cur + preset : preset));
  };

  const handleSave = async () => {
    const targetAmount = parseCurrencyInput(targetAmountStr);
    const currentAmount = parseCurrencyInput(currentAmountStr);

    if (!name.trim()) {
      toast.warning('Please enter a name for your financial goal.', 'Goal Name Required');
      return;
    }
    if (targetAmount <= 0) {
      toast.warning('Please enter a target amount greater than zero.', 'Invalid Target');
      return;
    }

    try {
      setLoading(true);
      if (isDemo) {
        if (editId) {
          updateDemoGoal(editId, {
            name: name.trim(),
            targetAmount,
            currentAmount,
            targetDate: targetDate.trim() || null,
            category,
          });
        } else {
          createDemoGoal({
            name: name.trim(),
            targetAmount,
            currentAmount,
            targetDate: targetDate.trim() || undefined,
            category,
          });
        }
      } else if (user) {
        if (editId) {
          await savingsService.updateGoal(editId, {
            name: name.trim(),
            targetAmount,
            currentAmount,
            targetDate: targetDate.trim() || null,
            category,
          });
        } else {
          await savingsService.createGoal(user.id, {
            name: name.trim(),
            targetAmount,
            currentAmount,
            targetDate: targetDate.trim() || undefined,
            category,
          });
        }
      }

      toast.success(editId ? 'Savings goal updated.' : `Goal "${name.trim()}" created!`);
      router.back();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to save savings goal.'));
    } finally {
      setLoading(false);
    }
  };

  const activeCurrency: SupportedCurrency =
    ((isDemo ? demoProfile?.currency : profile?.currency) as SupportedCurrency) || 'INR';
  const currencySymbol = CURRENCY_SYMBOLS[activeCurrency] || '₹';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header title={isEditing ? 'Edit Savings Goal' : 'New Savings Goal'} showBack />
      {initialLoading ? (
        <LoadingState message="Loading goal details..." />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* TARGET AMOUNT HERO CARD */}
          <View
            style={[
              styles.amountCard,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : colors.borderLight,
              },
              !isDark ? Shadows.sm : undefined,
            ]}
          >
            <View style={styles.amountCardHeader}>
              <Target size={13} color={colors.secondaryText} />
              <Text variant="xs" color="secondary" weight="bold" style={styles.amountCardLabel}>
                TARGET SAVINGS AMOUNT
              </Text>
            </View>

            <View style={styles.amountInputRow}>
              <Text variant="3xl" weight="extrabold" style={{ color: colors.primary, marginRight: 4 }}>
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

            {/* Quick Presets */}
            <View style={styles.presetsRow}>
              {PRESET_AMOUNTS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: isDark ? colors.elevatedSurface : colors.background,
                      borderColor: colors.borderLight,
                    },
                  ]}
                  onPress={() => handlePresetSelect(preset)}
                  activeOpacity={0.7}
                >
                  <Plus size={10} color={colors.secondaryText} />
                  <Text variant="xs" weight="bold" color="secondary">
                    {currencySymbol}{preset >= 100000 ? `${preset / 100000}L` : `${preset / 1000}k`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* GOAL NAME */}
          <Input
            label="Goal Name"
            placeholder="e.g. 6-Month Emergency Fund"
            value={name}
            onChangeText={setName}
          />

          {/* CATEGORY SELECTOR TILES */}
          <View style={styles.categorySection}>
            <Text variant="sm" weight="bold" style={styles.sectionLabel}>
              Goal Category
            </Text>
            <View style={styles.categoryGrid}>
              {GOAL_CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                const CatIcon = cat.icon;

                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    style={[
                      styles.categoryTile,
                      {
                        backgroundColor: isSelected
                          ? `${cat.color}14`
                          : colors.surface,
                        borderColor: isSelected ? cat.color : colors.borderLight,
                      },
                      !isDark && !isSelected ? Shadows.sm : undefined,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.catIconSquircle,
                        {
                          backgroundColor: `${cat.color}20`,
                        },
                      ]}
                    >
                      <CatIcon size={16} color={cat.color} strokeWidth={2.2} />
                    </View>
                    <Text
                      variant="xs"
                      weight={isSelected ? 'bold' : 'medium'}
                      numberOfLines={1}
                      style={{
                        color: isSelected ? colors.mainText : colors.secondaryText,
                        flex: 1,
                        fontSize: 12,
                      }}
                    >
                      {cat.name}
                    </Text>
                    {isSelected ? (
                      <View style={[styles.checkCircle, { backgroundColor: cat.color }]}>
                        <Check size={10} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ALREADY SAVED */}
          <Input
            label="Already Saved (Starting Balance)"
            placeholder="0.00"
            prefix={currencySymbol}
            keyboardType="decimal-pad"
            value={currentAmountStr}
            onChangeText={setCurrentAmountStr}
          />

          {/* TARGET DATE PICKER */}
          <DatePickerField
            label="Target Date"
            value={targetDate}
            onChange={setTargetDate}
          />

          {/* SUBMIT BUTTON */}
          <Button
            title={isEditing ? 'Update Goal' : 'Create Goal'}
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleSave}
            leftIcon={<Check size={18} color={colors.onPrimary} />}
            buttonStyle={{ marginTop: Spacing.xl }}
          />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
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
  amountCard: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  amountCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: Spacing.xs,
  },
  amountCardLabel: {
    letterSpacing: 0.6,
    fontSize: 11,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  amountContainer: {
    marginBottom: 0,
    width: 220,
  },
  bigAmountInput: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    width: '100%',
  },
  presetChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 3,
  },
  categorySection: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  categoryGrid: {
    gap: Spacing.xs,
  },
  categoryTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  catIconSquircle: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
