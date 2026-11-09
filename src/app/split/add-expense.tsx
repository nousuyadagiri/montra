import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { splitService } from '../../services/splitService';
import { GroupMember } from '../../types/database';
import { SplitType, SplitMemberInput } from '../../utils/splitEngine';
import {
  Text,
  Heading,
  Input,
  Button,
  Header,
  Card,
  Badge,
} from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { CURRENCY_SYMBOLS, parseCurrencyInput, formatCurrency } from '../../utils/currency';
import { Check, Calendar } from 'lucide-react-native';

const SPLIT_TYPES: { label: string; value: SplitType }[] = [
  { label: 'Equally', value: 'equal' },
  { label: 'Exact', value: 'exact' },
  { label: 'Percentage', value: 'percentage' },
  { label: 'Shares', value: 'shares' },
];

export default function AddGroupExpenseScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paidBy, setPaidBy] = useState<string>('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!groupId || !user) return;
    splitService.getGroupDetails(groupId, user.id).then((res) => {
      setMembers(res.members);
      if (res.members.length > 0) {
        // Default paidBy to current user or first member
        const currentMem = res.members.find((m) => m.user_id === user.id) || res.members[0];
        setPaidBy(currentMem.id);
        // Default all members selected
        setSelectedMemberIds(res.members.map((m) => m.id));
      }
    });
  }, [groupId, user]);

  const toggleMember = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      if (selectedMemberIds.length === 1) {
        Alert.alert('Notice', 'At least one participant must be included in the split.');
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
    if (!user || !groupId) return;
    const amount = parseCurrencyInput(amountStr);

    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter an expense title.');
      return;
    }
    if (amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter an amount greater than zero.');
      return;
    }
    if (!paidBy) {
      Alert.alert('Required Field', 'Please select who paid for this expense.');
      return;
    }
    if (selectedMemberIds.length === 0) {
      Alert.alert('Required Field', 'Please select at least one participant.');
      return;
    }

    // Prepare participants with share values
    const participants: SplitMemberInput[] = selectedMemberIds.map((id) => {
      const mem = members.find((m) => m.id === id);
      return {
        memberId: id,
        memberName: mem?.member_name || 'Member',
        shareValue: customValues[id] ? parseCurrencyInput(customValues[id]) : undefined,
      };
    });

    try {
      setLoading(true);
      await splitService.createGroupExpense(groupId, user.id, {
        title: title.trim(),
        amount,
        paidByMemberId: paidBy,
        splitType,
        participants,
        date,
        notes: notes.trim() || undefined,
      });

      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to record expense.');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = parseCurrencyInput(amountStr);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Add Group Expense" showBack />
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
              ₹
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

        <Input
          label="Date (YYYY-MM-DD)"
          placeholder="2026-11-09"
          value={date}
          onChangeText={setDate}
          leftIcon={<Calendar size={18} color={colors.secondaryText} />}
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
                    style={{ color: isSelected ? '#0B0F14' : colors.secondaryText }}
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
                      {isChecked ? <Check size={14} color="#0B0F14" /> : null}
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
                            : 'Exact ₹'
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

