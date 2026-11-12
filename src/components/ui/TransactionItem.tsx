import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction, SupportedCurrency } from '../../types/database';
import { useAppTheme } from '../../store/themeStore';
import { CategoryIcon } from './CategoryIcon';
import { Text } from './Typography';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';

interface TransactionItemProps {
  transaction: Transaction;
  currency?: SupportedCurrency;
  onPress?: () => void;
  showDivider?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  currency = 'INR',
  onPress,
  showDivider = false,
}) => {
  const { colors } = useAppTheme();

  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';

  const amountColor = isIncome
    ? colors.positive
    : isTransfer
    ? colors.secondary
    : colors.mainText;

  const prefix = isIncome ? '+' : isTransfer ? '' : '-';
  const formattedAmount = `${prefix}${formatCurrency(transaction.amount, currency)}`;

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
        style={styles.container}
      >
        <CategoryIcon
          icon={transaction.category?.icon || (isTransfer ? 'transfer' : 'wallet')}
          name={transaction.category?.name}
          color={transaction.category?.color || (isIncome ? colors.positive : colors.primary)}
          size="md"
          shape="squircle"
        />

        <View style={styles.contentGroup}>
          <Text variant="sm" weight="semibold" numberOfLines={1} style={styles.title}>
            {transaction.title}
          </Text>
          <Text variant="xs" color="secondary" numberOfLines={1} style={styles.subtitle}>
            {transaction.category?.name || (isTransfer ? 'Transfer' : 'General')}
            {transaction.payment_method ? ` • ${transaction.payment_method}` : ''}
          </Text>
        </View>

        <View style={styles.amountGroup}>
          <Text
            variant="sm"
            weight="bold"
            style={[styles.amountText, { color: amountColor }]}
          >
            {formattedAmount}
          </Text>
        </View>
      </TouchableOpacity>

      {showDivider ? (
        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 2,
    gap: 12,
  },
  contentGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13.5,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
  },
  amountGroup: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 13.5,
    letterSpacing: -0.3,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 48, // Aligned with the text after 36px icon + 12px gap
  },
});
