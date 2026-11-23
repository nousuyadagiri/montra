import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, Check } from 'lucide-react-native';
import { PaymentUpdateMetadata } from '../../types/database';
import { useAppTheme } from '../../store/themeStore';
import { BorderRadius } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';

export interface PaymentUpdateCardProps {
  metadata: PaymentUpdateMetadata;
  isSender: boolean;
}

export const PaymentUpdateCard: React.FC<PaymentUpdateCardProps> = ({
  metadata,
  isSender,
}) => {
  const { colors, isDark } = useAppTheme();
  const currency = (metadata.currency as any) || 'INR';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(52, 211, 153, 0.08)' : '#ECFDF5',
          borderColor: isDark ? 'rgba(52, 211, 153, 0.25)' : '#A7F3D0',
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <ShieldCheck size={14} color={isDark ? '#34D399' : '#059669'} />
          <Text style={[styles.badgeText, { color: isDark ? '#34D399' : '#059669' }]}>
            VERIFIED PAYMENT UPDATE
          </Text>
        </View>
        <View style={[styles.checkCircle, { backgroundColor: isDark ? '#34D399' : '#059669' }]}>
          <Check size={10} color="#FFFFFF" strokeWidth={3} />
        </View>
      </View>

      <View style={styles.amountBlock}>
        <Text style={[styles.amountText, { color: isDark ? '#FFFFFF' : '#064E3B' }]}>
          {formatCurrency(metadata.amount, currency)}
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#047857' }]}>
          {isSender
            ? `Paid via ${metadata.payment_method || 'UPI'}`
            : `Payment recorded via ${metadata.payment_method || 'UPI'}`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 12,
    marginVertical: 4,
    minWidth: 230,
    maxWidth: 280,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  checkCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBlock: {
    marginTop: 2,
  },
  amountText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: '500',
  },
});

