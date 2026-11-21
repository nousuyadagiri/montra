import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { ArrowUpRight, LucideIcon } from 'lucide-react-native';
import { Text } from './Typography';
import { NEO_ACCENTS } from '../../theme/colors';
import { BorderRadius, Spacing } from '../../theme/tokens';

export type NeoCardVariant = 'pistachio' | 'lavender' | 'obsidian';

export interface NeoAssetCardProps {
  variant?: NeoCardVariant;
  symbol?: string;
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  primaryLabel?: string;
  primaryValue?: string;
  secondaryLabel?: string;
  secondaryValue?: string;
  badgeText?: string;
  badgePositive?: boolean;
  onPressAction?: () => void;
  style?: ViewStyle;
}

export const NeoAssetCard: React.FC<NeoAssetCardProps> = ({
  variant = 'pistachio',
  symbol,
  icon: Icon,
  title,
  subtitle,
  primaryLabel = 'Available',
  primaryValue,
  secondaryLabel = 'Track',
  secondaryValue,
  badgeText,
  badgePositive = true,
  onPressAction,
  style,
}) => {
  const isObsidian = variant === 'obsidian';
  const isLavender = variant === 'lavender';

  const bgColor = isObsidian
    ? NEO_ACCENTS.obsidian
    : isLavender
    ? NEO_ACCENTS.lavender
    : NEO_ACCENTS.pistachio;

  const textColor = isObsidian ? '#FFFFFF' : '#141416';
  const subTextColor = isObsidian ? 'rgba(255, 255, 255, 0.65)' : 'rgba(20, 20, 22, 0.6)';
  const circleBtnBg = isObsidian ? 'rgba(255, 255, 255, 0.14)' : '#FFFFFF';
  const circleBtnIconColor = isObsidian ? '#FFFFFF' : '#141416';
  const badgeBg = isObsidian ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.6)';
  const badgeTextColor = isObsidian ? '#FFFFFF' : '#141416';

  return (
    <View style={[styles.card, { backgroundColor: bgColor }, style]}>
      {/* Top Row: Icon Badge + Title + Action Button */}
      <View style={styles.topRow}>
        <View style={styles.leftMeta}>
          <View style={[styles.iconBadge, { backgroundColor: isObsidian ? '#2C2C32' : '#1C1C1E' }]}>
            {Icon ? (
              <Icon size={17} color="#FFFFFF" strokeWidth={2.4} />
            ) : (
              <Text variant="sm" weight="bold" style={styles.symbolText}>
                {symbol || '◈'}
              </Text>
            )}
          </View>
          <View style={styles.titleCol}>
            <View style={styles.titleRow}>
              <Text variant="sm" weight="bold" style={{ color: textColor }}>
                {title}
              </Text>
              {subtitle ? (
                <Text variant="xs" style={[styles.subtitleText, { color: subTextColor }]}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {onPressAction ? (
          <TouchableOpacity
            onPress={onPressAction}
            activeOpacity={0.8}
            style={[styles.actionCircle, { backgroundColor: circleBtnBg }]}
            accessibilityRole="button"
            accessibilityLabel={`${title} action`}
          >
            <ArrowUpRight size={18} color={circleBtnIconColor} strokeWidth={2.4} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Bottom Metrics Row */}
      <View style={styles.bottomRow}>
        <View style={styles.metricsCol}>
          <View style={styles.statsInline}>
            {primaryValue ? (
              <View style={styles.statItem}>
                <Text variant="xs" style={[styles.statLabel, { color: subTextColor }]}>
                  {primaryLabel}
                </Text>
                <Text variant="xs" weight="bold" style={{ color: textColor }}>
                  {primaryValue}
                </Text>
              </View>
            ) : null}
            {secondaryValue ? (
              <View style={styles.statItem}>
                <Text variant="xs" style={[styles.statLabel, { color: subTextColor }]}>
                  {secondaryLabel}
                </Text>
                <Text variant="xs" weight="bold" style={{ color: textColor }}>
                  {secondaryValue}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {badgeText ? (
          <View style={[styles.pillBadge, { backgroundColor: badgeBg }]}>
            <Text variant="xs" weight="bold" style={{ color: badgeTextColor }}>
              {badgeText}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.md + 2,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm + 4,
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  titleCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  subtitleText: {
    fontSize: 11,
    letterSpacing: 0.4,
  },
  actionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  metricsCol: {
    flex: 1,
  },
  statsInline: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

