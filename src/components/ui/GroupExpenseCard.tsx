import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, Users, Home, Plane, Coffee, ShoppingBag, Folder } from 'lucide-react-native';
import { ExpenseGroup, GroupMember, SupportedCurrency } from '../../types/database';
import { useAppTheme } from '../../store/themeStore';
import { Text } from './Typography';
import { Spacing, BorderRadius, Shadows } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';

interface GroupExpenseCardProps {
  group: ExpenseGroup;
  members?: GroupMember[];
  netBalance?: number;
  currency?: SupportedCurrency;
  onPress: () => void;
}

const renderGroupIcon = (category: string | undefined, color: string) => {
  const cat = (category || '').toLowerCase();
  const props = { size: 18, color, strokeWidth: 2.2 };
  if (cat.includes('home') || cat.includes('rent') || cat.includes('flat')) return <Home {...props} />;
  if (cat.includes('trip') || cat.includes('travel') || cat.includes('flight')) return <Plane {...props} />;
  if (cat.includes('food') || cat.includes('dining') || cat.includes('cafe')) return <Coffee {...props} />;
  if (cat.includes('shop') || cat.includes('grocer')) return <ShoppingBag {...props} />;
  return <Users {...props} />;
};

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

  let balanceColor = colors.secondaryText;
  let balanceBg = isDark ? colors.elevatedSurface : colors.background;
  let balanceText = 'All Settled';

  if (isOwed) {
    balanceColor = colors.positive;
    balanceBg = colors.successMuted;
    balanceText = `You are owed ${formatCurrency(netBalance, currency)}`;
  } else if (youOwe) {
    balanceColor = colors.negative;
    balanceBg = colors.expenseMuted;
    balanceText = `You owe ${formatCurrency(Math.abs(netBalance), currency)}`;
  }

  const allMembers = members.length > 0 ? members : (group.members || []);
  const memberInitials = allMembers.slice(0, 3).map((m) =>
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
      activeOpacity={0.75}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? colors.border : colors.borderLight,
        },
        !isDark ? Shadows.sm : undefined,
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.groupIconBox, { backgroundColor: colors.primaryMuted, borderColor: colors.borderLight }]}>
          {renderGroupIcon(group.category, colors.primary)}
        </View>

        <View style={styles.titleInfo}>
          <Text variant="sm" weight="bold" numberOfLines={1} style={styles.groupName}>
            {group.name}
          </Text>
          <View style={styles.metaRow}>
            <Text variant="xs" color="secondary" style={styles.categoryText}>
              {group.category || 'Shared Group'}
            </Text>
            <Text variant="xs" color="tertiary">
              •
            </Text>
            <Text variant="xs" color="secondary">
              {allMembers.length} {allMembers.length === 1 ? 'member' : 'members'}
            </Text>
          </View>
        </View>

        <ChevronRight size={18} color={colors.secondaryText} />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

      <View style={styles.bottomRow}>
        {/* Overlapping Avatars */}
        <View style={styles.avatarCluster}>
          {memberInitials.map((initials, idx) => (
            <View
              key={idx}
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: isDark ? colors.elevatedSurface : colors.softAccent,
                  borderColor: colors.surface,
                  marginLeft: idx === 0 ? 0 : -9,
                },
              ]}
            >
              <Text variant="xs" weight="bold" style={{ color: colors.mainText, fontSize: 10.5 }}>
                {initials}
              </Text>
            </View>
          ))}
          {allMembers.length > 3 ? (
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: colors.elevatedSurface,
                  borderColor: colors.surface,
                  marginLeft: -9,
                },
              ]}
            >
              <Text variant="xs" weight="bold" color="secondary" style={{ fontSize: 10.5 }}>
                +{allMembers.length - 3}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Net Balance Status Pill */}
        <View style={[styles.balancePill, { backgroundColor: balanceBg }]}>
          <Text variant="xs" weight="bold" style={{ color: balanceColor, fontSize: 11 }}>
            {balanceText}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md + 2,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    marginBottom: Spacing.sm + 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
  },
  groupIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInfo: {
    flex: 1,
    gap: 2,
  },
  groupName: {
    fontSize: 14.5,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    fontSize: 11.5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.sm + 2,
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
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balancePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
});
