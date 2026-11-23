import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, Check, X, ShieldCheck } from 'lucide-react-native';
import { MoneyRequestMetadata, MoneyRequestStatus } from '../../types/database';
import { useAppTheme } from '../../store/themeStore';
import { BorderRadius, Spacing } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';

export interface MoneyRequestCardProps {
  metadata: MoneyRequestMetadata;
  isSender: boolean;
  currentUserId: string;
  onRespond?: (action: MoneyRequestStatus) => Promise<void>;
}

export const MoneyRequestCard: React.FC<MoneyRequestCardProps> = ({
  metadata,
  isSender,
  currentUserId,
  onRespond,
}) => {
  const { colors, isDark } = useAppTheme();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const status = metadata.status || 'pending';
  const isRecipient = metadata.recipient_id === currentUserId;
  const currency = (metadata.currency as any) || 'INR';

  const handleAction = async (action: MoneyRequestStatus) => {
    if (!onRespond || loadingAction) return;
    try {
      setLoadingAction(action);
      await onRespond(action);
    } finally {
      setLoadingAction(null);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'paid':
        return {
          bg: isDark ? 'rgba(52, 211, 153, 0.18)' : '#D1FAE5',
          text: isDark ? '#34D399' : '#065F46',
          label: '✓ Paid',
        };
      case 'accepted':
        return {
          bg: isDark ? 'rgba(96, 165, 250, 0.18)' : '#DBEAFE',
          text: isDark ? '#60A5FA' : '#1E40AF',
          label: 'Accepted',
        };
      case 'declined':
        return {
          bg: isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2',
          text: isDark ? '#F87171' : '#991B1B',
          label: 'Declined',
        };
      case 'pending':
      default:
        return {
          bg: isDark ? 'rgba(251, 191, 36, 0.18)' : '#FEF3C7',
          text: isDark ? '#FBBF24' : '#92400E',
          label: 'Pending',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1C1C22' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        },
      ]}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View style={[styles.iconBadge, { backgroundColor: colors.primaryMuted }]}>
            {isSender ? (
              <ArrowUpRight size={13} color={colors.primary} />
            ) : (
              <ArrowDownLeft size={13} color={colors.primary} />
            )}
          </View>
          <Text style={[styles.cardTitle, { color: colors.secondaryText }]}>
            {isSender ? 'MONEY REQUEST SENT' : 'MONEY REQUEST RECEIVED'}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
        </View>
      </View>

      {/* Big Amount */}
      <View style={styles.amountContainer}>
        <Text style={[styles.amountText, { color: colors.mainText }]}>
          {formatCurrency(metadata.amount, currency)}
        </Text>
        {metadata.notes ? (
          <Text style={[styles.notesText, { color: colors.secondaryText }]} numberOfLines={2}>
            {`"${metadata.notes}"`}
          </Text>
        ) : null}
      </View>

      {/* Action Footer */}
      {status === 'pending' && isRecipient && onRespond && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.declineBtn, { borderColor: colors.borderLight }]}
            onPress={() => handleAction('declined')}
            disabled={Boolean(loadingAction)}
            activeOpacity={0.7}
          >
            {loadingAction === 'declined' ? (
              <ActivityIndicator size="small" color={colors.secondaryText} />
            ) : (
              <>
                <X size={14} color={colors.secondaryText} />
                <Text style={[styles.declineBtnText, { color: colors.secondaryText }]}>
                  Decline
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
            onPress={() => handleAction('accepted')}
            disabled={Boolean(loadingAction)}
            activeOpacity={0.8}
          >
            {loadingAction === 'accepted' ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <>
                <Check size={14} color={colors.onPrimary} />
                <Text style={[styles.acceptBtnText, { color: colors.onPrimary }]}>
                  Accept
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {status === 'accepted' && onRespond && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.markPaidBtn,
              { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.22)' : '#D1FAE5' },
            ]}
            onPress={() => handleAction('paid')}
            disabled={Boolean(loadingAction)}
            activeOpacity={0.8}
          >
            {loadingAction === 'paid' ? (
              <ActivityIndicator size="small" color={isDark ? '#34D399' : '#065F46'} />
            ) : (
              <>
                <ShieldCheck size={16} color={isDark ? '#34D399' : '#065F46'} />
                <Text
                  style={[
                    styles.markPaidText,
                    { color: isDark ? '#34D399' : '#065F46' },
                  ]}
                >
                  Mark as Paid
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {status === 'paid' && (
        <View
          style={[
            styles.confirmedBanner,
            { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.12)' : '#ECFDF5' },
          ]}
        >
          <ShieldCheck size={14} color={isDark ? '#34D399' : '#059669'} />
          <Text style={[styles.confirmedText, { color: isDark ? '#34D399' : '#059669' }]}>
            Payment update recorded and confirmed
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 14,
    marginVertical: 4,
    minWidth: 240,
    maxWidth: 290,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  iconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  amountContainer: {
    marginVertical: 4,
  },
  amountText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  notesText: {
    fontSize: 12,
    marginTop: 3,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  declineBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  markPaidBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  markPaidText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  confirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  confirmedText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
