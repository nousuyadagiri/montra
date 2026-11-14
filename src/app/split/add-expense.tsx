import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';
import { splitService } from '../../services/splitService';
import { GroupMember, SupportedCurrency } from '../../types/database';
import { SplitType, SplitMemberInput } from '../../utils/splitEngine';
import {
  Text,
  Input,
  Button,
  Header,
  Card,
  LoadingState,
  DatePickerField,
} from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { CURRENCY_SYMBOLS, parseCurrencyInput } from '../../utils/currency';
import { Check, Calendar } from 'lucide-react-native';

const SPLIT_TYPES: { label: string; value: SplitType }[] = [
  { label: 'Equally', value: 'equal' },
  { label: 'Exact', value: 'exact' },
  { label: 'Percentage', value: 'percentage' },
  { label: 'Shares', value: 'shares' },
];

export default function AddGroupExpenseScreen() {
  const { groupId, editExpenseId } = useLocalSearchParams<{ groupId: string; editExpenseId?: string }>();
  const isEditing = Boolean(editExpenseId);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const demoProfile = useDemoStore((s) => s.demoProfile);
  const getDemoGroupDetails = useDemoStore((s) => s.getDemoGroupDetails);
  const addDemoGroupExpense = useDemoStore((s) => s.addDemoGroupExpense);
  const updateDemoGroupExpense = useDemoStore((s) => s.updateDemoGroupExpense);

  const isDemo = !user || (groupId?.startsWith('demo-') ?? false);

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paidBy, setPaidBy] = useState<string>('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [groupCurrency, setGroupCurrency] = useState<SupportedCurrency>(
    ((isDemo ? demoProfile?.currency : profile?.currency) as SupportedCurrency) || 'INR'
  );
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(Boolean(groupId && !isDemo));

  const currencySymbol = CURRENCY_SYMBOLS[groupCurrency] || '₹';

  useEffect(() => {
    if (!groupId) return;

    const applyGroupData = (
      loadedMembers: GroupMember[],
      loadedCurrency: SupportedCurrency,
      expensesList: any[]
    ) => {
      setMembers(loadedMembers);
      setGroupCurrency(loadedCurrency);

      if (editExpenseId) {
        const exp = expensesList.find((e) => e.id === editExpenseId);
        if (exp) {
          setTitle(exp.title);
          setAmountStr(String(exp.amount));
          setPaidBy(exp.paid_by);
          setSplitType(exp.split_type || 'equal');
          setDate(exp.date || new Date().toISOString().split('T')[0]);
          setNotes(exp.notes || '');
          const splitMembers = (exp.splits || []).map((s: any) => s.member_id);
          setSelectedMemberIds(
            splitMembers.length > 0 ? splitMembers : loadedMembers.map((m) => m.id)
          );
          if (exp.split_type === 'exact') {
            const vals: Record<string, string> = {};
            (exp.splits || []).forEach((s: any) => {
              vals[s.member_id] = String(s.owed_amount);
            });
            setCustomValues(vals);
          }
          return;
        }
      }

      if (loadedMembers.length > 0) {
        const currentMem =
          loadedMembers.find((m) => m.user_id === (user?.id || demoProfile.id)) ||
          loadedMembers[0];
        setPaidBy(currentMem.id);
        setSelectedMemberIds(loadedMembers.map((m) => m.id));
      }
    };

    if (isDemo) {
      const details = getDemoGroupDetails(groupId);
      if (details) {
        applyGroupData(
          details.members,
          (details.group.currency as SupportedCurrency) || 'INR',
          details.expenses
        );
      }
      setInitialLoading(false);
      return;
    }

    if (!user) {
      setInitialLoading(false);
      return;
    }
    setInitialLoading(true);
    splitService
      .getGroupDetails(groupId, user.id)
      .then((res) => {
        applyGroupData(
          res.members,
          (res.group.currency as SupportedCurrency) || 'INR',
          res.expenses
        );
      })
      .catch((err) => {
        toast.error(getErrorMessage(err, 'Unable to load group members.'));
      })
      .finally(() => setInitialLoading(false));
  }, [groupId, editExpenseId, user, isDemo, getDemoGroupDetails, demoProfile.id]);

  const toggleMember = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      if (selectedMemberIds.length === 1) {
        toast.warning('At least one participant must be included in the split.');
        return;
      }
      setSelectedMemberIds(selectedMemberIds.filter((m) => m !== id));
    } else {
      setSelectedMemberIds([...selectedMemberIds, id]);
    }
  };

  const handleCustomValChange = (memberId: string, val: string) => {
    setCustomValues((prev) => ({ ...prev, [memberId]: val }));
  };

  const handleSave = async () => {
    if (!groupId) return;
    const amount = parseCurrencyInput(amountStr);

    if (!title.trim()) {
      toast.warning('Please enter an expense title.', 'Title Required');
      return;
    }
    if (amount <= 0) {
      toast.warning('Please enter an amount greater than zero.', 'Invalid Amount');
      return;
    }
    if (!paidBy) {
      toast.warning('Please select who paid for this expense.', 'Payer Required');
      return;
    }
    if (selectedMemberIds.length === 0) {
      toast.warning('Please select at least one participant.', 'Participants Required');
      return;
    }

    const participants: SplitMemberInput[] = selectedMemberIds.map((id) => {
      const mem = members.find((m) => m.id === id);
      return {
        memberId: id,
        memberName: mem?.member_name || 'Member',
        shareValue: customValues[id] ? parseCurrencyInput(customValues[id]) : undefined,
      };
    });

    const payload = {
      title: title.trim(),
      amount,
      paidByMemberId: paidBy,
      splitType,
      participants,
      date,
      notes: notes.trim() || undefined,
    };

    try {
      setLoading(true);
      if (isDemo) {
        if (editExpenseId) {
          updateDemoGroupExpense(groupId, editExpenseId, payload);
        } else {
          addDemoGroupExpense(groupId, payload);
        }
      } else if (user) {
        if (editExpenseId) {
          await splitService.updateGroupExpense(editExpenseId, payload);
        } else {
          await splitService.createGroupExpense(groupId, user.id, payload);
        }
      }

      toast.success(editExpenseId ? 'Shared expense updated.' : 'Shared expense added.');
      router.back();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to save expense.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header title={isEditing ? 'Edit Group Expense' : 'Add Group Expense'} showBack />
      {initialLoading ? (
        <LoadingState message="Loading group members..." />
      ) : (
        <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card elevated style={styles.amountCard}>
          <Text variant="xs" color="secondary" weight="semibold">
            EXPENSE AMOUNT
          </Text>
          <View style={styles.amountInputRow}>
            <Text variant="3xl" weight="bold" color="primary">
              {currencySymbol}
            </Text>
            <Input
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amountStr}
              onChangeText={setAmountStr}
              inputStyle={styles.bigAmountInput}
              containerStyle={styles.amountContainer}
            />
          </View>
        </Card>

        <Input
          label="Expense Title"
          placeholder="e.g. Dinner at Coastal Bistro"
          value={title}
          onChangeText={setTitle}
        />

        <DatePickerField
          label="Expense Date"
          value={date}
          onChange={setDate}
        />

        {/* Paid By Selector */}
        <View style={styles.section}>
          <Text variant="sm" weight="medium" color="secondary" style={styles.label}>
            Paid By
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {members.map((m) => {
              const isSelected = paidBy === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setPaidBy(m.id)}
                  style={[
                    styles.choicePill,
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
                    {m.member_name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Split Type Selector */}
        <View style={styles.section}>
          <Text variant="sm" weight="medium" color="secondary" style={styles.label}>
            Split Method
          </Text>
          <View style={[styles.splitTypeRow, { backgroundColor: colors.surface }]}>
            {SPLIT_TYPES.map((st) => {
              const isSelected = splitType === st.value;
              return (
                <TouchableOpacity
                  key={st.value}
                  onPress={() => setSplitType(st.value)}
                  style={[
                    styles.splitTypeTab,
                    {
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  <Text
                    variant="xs"
                    weight={isSelected ? 'bold' : 'medium'}
                    style={{ color: isSelected ? colors.onPrimary : colors.secondaryText }}
                  >
                    {st.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Participants & Custom Split Inputs */}
        <View style={styles.section}>
          <Text variant="sm" weight="medium" color="secondary" style={styles.label}>
            Participants ({selectedMemberIds.length} of {members.length})
          </Text>

          <Card elevated style={styles.membersCard}>
            {members.map((m) => {
              const isChecked = selectedMemberIds.includes(m.id);
              return (
                <View key={m.id} style={styles.memberRow}>
                  <TouchableOpacity
                    onPress={() => toggleMember(m.id)}
                    style={styles.memberCheckRow}
                  >
                    <View
                      style={[
                        styles.checkBox,
                        {
                          backgroundColor: isChecked ? colors.primary : 'transparent',
                          borderColor: isChecked ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      {isChecked ? <Check size={14} color={colors.onPrimary} /> : null}
                    </View>
                    <Text variant="sm" weight={isChecked ? 'semibold' : 'regular'}>
                      {m.member_name}
                    </Text>
                  </TouchableOpacity>

                  {/* Dynamic split input if not equal */}
                  {isChecked && splitType !== 'equal' ? (
                    <View style={styles.splitInputCol}>
                      <Input
                        placeholder={
                          splitType === 'percentage'
                            ? '%'
                            : splitType === 'shares'
                            ? 'Shares'
                            : `Exact ${currencySymbol}`
                        }
                        keyboardType="decimal-pad"
                        value={customValues[m.id] || ''}
                        onChangeText={(val) => handleCustomValChange(m.id, val)}
                        containerStyle={{ marginBottom: 0, width: 90 }}
                        inputStyle={{ fontSize: 13, paddingVertical: 4, textAlign: 'center' }}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </Card>
        </View>

        <Button
          title="Save Shared Expense"
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleSave}
          leftIcon={<Check size={20} color={colors.onPrimary} />}
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
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  horizontalScroll: {
    flexDirection: 'row',
  },
  choicePill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  splitTypeRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: 3,
  },
  splitTypeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  membersCard: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitInputCol: {
    width: 90,
  },
});

