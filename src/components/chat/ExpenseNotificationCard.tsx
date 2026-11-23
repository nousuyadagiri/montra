import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Receipt, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ExpenseNotificationMetadata } from '../../types/database';
import { useAppTheme } from '../../store/themeStore';
import { BorderRadius } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';

export interface ExpenseNotificationCardProps {
  metadata: ExpenseNotificationMetadata;
}

export const ExpenseNotificationCard: React.FC<ExpenseNotificationCardProps> = ({ metadata }) => {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const currency = (metadata.currency as any) || 'INR';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.elevatedSurface : '#F8F9FA',
          borderColor: isDark ? colors.borderLight : 'rgba(0, 0, 0, 0.08)',
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
            <Receipt size={12} color={colors.primary} />
          </View>
          <Text style={[styles.badgeText, { color: colors.secondaryText }]}>
            GROUP EXPENSE
          </Text>
        </View>
        <View style={[styles.splitTypeBadge, { backgroundColor: isDark ? '#2A2A30' : '#E5E7EB' }]}>
          <Text style={[styles.splitTypeText, { color: colors.secondaryText }]}>
            {metadata.split_type?.toUpperCase() || 'EQUAL'}
          </Text>
        </View>
      </View>

      <Text style={[styles.titleText, { color: colors.mainText }]} numberOfLines={1}>
        {metadata.title}
      </Text>

      <Text style={[styles.amountText, { color: colors.mainText }]}>
        {formatCurrency(metadata.amount, currency)}
      </Text>

      <Text style={[styles.metaText, { color: colors.secondaryText }]}>
        Paid by {metadata.paid_by_name || 'Member'}
      </Text>

      {metadata.group_id && (
        <TouchableOpacity
          style={[styles.viewBtn, { borderColor: colors.borderLight }]}
          onPress={() => router.push(`/split/${metadata.group_id}`)}
          activeOpacity={0.7}
        >
          <Text style={[styles.viewBtnText, { color: colors.primary }]}>
            View in Split Group
          </Text>
          <ArrowRight size={12} color={colors.primary} />
        </TouchableOpacity>
      )}
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
    gap: 6,
  },
  iconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  splitTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  splitTypeText: {
    fontSize: 8.5,
    fontWeight: '700',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metaText: {
    fontSize: 11,
    marginTop: 2,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingVertical: 6,
    marginTop: 8,
  },
  viewBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
});

