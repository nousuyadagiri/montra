import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { splitService } from '../../services/splitService';
import { GroupMember } from '../../types/database';
import { Text, Heading, Input, Button, Header, Card } from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { parseCurrencyInput } from '../../utils/currency';
import { Check, ArrowRight, HandCoins } from 'lucide-react-native';

export default function SettleScreen() {
  const { groupId, payerId: initPayer, payeeId: initPayee, amount: initAmount } =
    useLocalSearchParams<{
      groupId: string;
      payerId?: string;
      payeeId?: string;
      amount?: string;
    }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [payerId, setPayerId] = useState<string>(initPayer || '');
  const [payeeId, setPayeeId] = useState<string>(initPayee || '');
  const [amountStr, setAmountStr] = useState<string>(initAmount || '');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!groupId || !user) return;
    splitService.getGroupDetails(groupId, user.id).then((res) => {
      setMembers(res.members);
      if (res.members.length > 1) {
        if (!payerId) setPayerId(res.members[0].id);
        if (!payeeId) setPayeeId(res.members[1].id);
      }
    });
  }, [groupId, user]);

  const handleSettle = async () => {
    if (!groupId) return;
    const amount = parseCurrencyInput(amountStr);

    if (amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid settlement amount.');
      return;
    }
    if (payerId === payeeId) {
      Alert.alert('Invalid Transfer', 'Payer and Payee cannot be the same member.');
      return;
    }

    try {
      setLoading(true);
      await splitService.recordSettlement(groupId, {
        payerId,
        payeeId,
        amount,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      Alert.alert('Settled!', 'The debt settlement has been successfully recorded.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to record settlement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Settle Balance" showBack />
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
            SETTLEMENT AMOUNT
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

        {/* Payer Selector */}
        <View style={styles.section}>
          <Text variant="sm" weight="medium" color="secondary" style={styles.label}>
            Who Paid / Transferred? (Payer)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
            {members.map((m) => {
              const isSelected = payerId === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setPayerId(m.id)}
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

        {/* Payee Selector */}
        <View style={styles.section}>
          <Text variant="sm" weight="medium" color="secondary" style={styles.label}>
            Who Received Payment? (Payee)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
            {members.map((m) => {
              const isSelected = payeeId === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setPayeeId(m.id)}
                  style={[
                    styles.choicePill,
                    {
                      backgroundColor: isSelected ? colors.secondaryMuted : colors.surface,
                      borderColor: isSelected ? colors.secondary : colors.border,
                    },
                  ]}
                >
                  <Text
                    variant="xs"
                    weight={isSelected ? 'bold' : 'regular'}
                    style={{ color: isSelected ? colors.secondary : colors.mainText }}
                  >
                    {m.member_name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text variant="sm" weight="medium" color="secondary" style={styles.label}>
            Settlement Method
          </Text>
          <View style={styles.methodRow}>
            {['UPI', 'NetBanking', 'Cash'].map((m) => {
              const isSelected = paymentMethod === m;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setPaymentMethod(m)}
                  style={[
                    styles.methodPill,
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
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Input
          label="Optional Notes"
          placeholder="e.g. GPay ref #123456"
          value={notes}
          onChangeText={setNotes}
        />

        <Button
          title="Confirm Settlement"
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleSettle}
          leftIcon={<HandCoins size={20} color="#0B0F14" />}
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
  pillsScroll: {
    flexDirection: 'row',
  },
  choicePill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  methodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  methodPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
});

