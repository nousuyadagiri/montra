import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, Users } from 'lucide-react-native';
import { ExpenseGroup, GroupMember, SupportedCurrency } from '../../types/database';
import { useAppTheme } from '../../store/themeStore';
import { Text, CurrencyText } from './Typography';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';

interface GroupExpenseCardProps {
  group: ExpenseGroup;
  members?: GroupMember[];
  netBalance?: number;
  currency?: SupportedCurrency;
  onPress: () => void;
}

export const GroupExpenseCard: React.FC<GroupExpenseCardProps> = ({
  group,
  members = [],
  netBalance = 0,
  currency = 'INR',
  onPress,
}) => {
  const { colors, isDark } = useAppTheme();

  const isOwed = netBalance > 0;
  const youOwe = netBalance < 0;
  const isSettled = netBalance === 0;

  let balanceColor = colors.secondaryText;
  let balanceText = 'Settled up';

  if (isOwed) {
    balanceColor = colors.positive;
    balanceText = `You are owed ${formatCurrency(netBalance, currency)}`;
  } else if (youOwe) {
    balanceColor = colors.negative;
    balanceText = `You owe ${formatCurrency(Math.abs(netBalance), currency)}`;
  }

  // Display first 3 members
  const memberInitials = (members.length > 0 ? members : (group.members || []))
    .slice(0, 3)
    .map((m) =>
      m.member_name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    );

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
          borderWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleInfo}>
          <Text variant="md" weight="bold" numberOfLines={1}>
            {group.name}
          </Text>
          <Text variant="xs" color="secondary">
            {group.category || 'Shared Expenses'}
          </Text>
        </View>

        <ChevronRight size={18} color={colors.secondaryText} />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

      <View style={styles.bottomRow}>
        {/* Avatars */}
        <View style={styles.avatarCluster}>
          {memberInitials.map((initials, idx) => (
            <View
              key={idx}
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: colors.elevatedSurface,
                  borderColor: colors.surface,
                  marginLeft: idx === 0 ? 0 : -8,
                },
              ]}
            >
              <Text variant="xs" weight="bold" style={{ color: colors.mainText }}>
                {initials}
              </Text>
            </View>
          ))}
          {(group.members?.length || members.length) > 3 ? (
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: colors.elevatedSurface,
                  borderColor: colors.surface,
                  marginLeft: -8,
                },
              ]}
            >
              <Text variant="xs" weight="bold" color="secondary">
                +{((group.members?.length || members.length) - 3)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Net Balance Status */}
        <View style={styles.balanceTag}>
          <Text variant="xs" weight="bold" style={{ color: balanceColor }}>
            {balanceText}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleInfo: {
    gap: 2,
    flex: 1,
    marginRight: Spacing.sm,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarCluster: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceTag: {
    alignItems: 'flex-end',
  },
});
