import React from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  Path,
  G,
  Line,
} from 'react-native-svg';
import { useAppTheme } from '../../store/themeStore';

interface IllustrationProps {
  size?: number;
  width?: number;
  height?: number;
}

/**
 * Storyset / unDraw inspired Modern Budget Empty State Illustration
 * Visualizes smart spending guardrails, analytics gauge, and growth coin
 */
export const BudgetIllustration: React.FC<IllustrationProps> = ({ size = 160, width, height }) => {
  const { colors, isDark } = useAppTheme();
  const w = width ?? size;
  const h = height ?? Math.round(size * 0.88);

  const primary = colors.primary;
  const accent = colors.accent;
  const soft = isDark ? colors.elevatedSurface : colors.softAccent;
  const cardBg = colors.surface;
  const border = colors.border;
  const coinColor = colors.warning;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={w} height={h} viewBox="0 0 200 170" fill="none">
        <Defs>
          <RadialGradient id="bgtAmbient" cx="50%" cy="45%" r="60%">
            <Stop offset="0%" stopColor={accent} stopOpacity={isDark ? 0.22 : 0.14} />
            <Stop offset="100%" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="bgtCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={cardBg} stopOpacity={1} />
            <Stop offset="100%" stopColor={soft} stopOpacity={0.85} />
          </LinearGradient>
          <LinearGradient id="bgtAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={primary} />
            <Stop offset="100%" stopColor={accent} />
          </LinearGradient>
        </Defs>

        {/* Ambient Glow */}
        <Circle cx="100" cy="85" r="75" fill="url(#bgtAmbient)" />

        {/* Base Stage Shadow */}
        <Path
          d="M30 148 C65 158, 135 158, 170 148 C155 156, 45 156, 30 148 Z"
          fill={colors.border}
          opacity={0.5}
        />

        {/* Main Dashboard Window */}
        <Rect
          x="38"
          y="30"
          width="124"
          height="102"
          rx="14"
          fill="url(#bgtCardGrad)"
          stroke={border}
          strokeWidth="1.5"
        />

        {/* Window Top Controls */}
        <Circle cx="50" cy="42" r="3" fill={colors.error} opacity={0.7} />
        <Circle cx="60" cy="42" r="3" fill={colors.warning} opacity={0.7} />
        <Circle cx="70" cy="42" r="3" fill={colors.success} opacity={0.7} />
        <Line x1="38" y1="52" x2="162" y2="52" stroke={border} strokeWidth="1" opacity={0.6} />

        {/* Circular Progress Gauge */}
        <Circle
          cx="80"
          cy="92"
          r="26"
          stroke={colors.borderLight}
          strokeWidth="6"
          fill="none"
        />
        <Path
          d="M80 66 A26 26 0 1 1 54 92"
          stroke="url(#bgtAccentGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx="80" cy="92" r="16" fill={soft} />
        <Path
          d="M75 92 L79 96 L87 88"
          stroke={primary}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Mini Analytics Bars on Right */}
        <Rect x="118" y="66" width="30" height="6" rx="3" fill={colors.borderLight} />
        <Rect x="118" y="78" width="22" height="6" rx="3" fill={primary} opacity={0.3} />
        <Rect x="118" y="90" width="34" height="6" rx="3" fill={colors.borderLight} />
        <Rect x="118" y="102" width="18" height="6" rx="3" fill="url(#bgtAccentGrad)" />

        {/* Floating Coin on Front */}
        <G transform="translate(138, 98)">
          <Circle cx="16" cy="16" r="15" fill={coinColor} />
          <Circle cx="16" cy="16" r="11" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity={0.6} />
          <Path
            d="M13 12 H19 M13 16 H18 M13 20 H19 M16 11 V21"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </G>

        {/* Floating Sparkle Stars */}
        <Path
          d="M32 64 L34 58 L40 56 L34 54 L32 48 L30 54 L24 56 L30 58 Z"
          fill={accent}
          opacity={0.8}
        />
        <Path
          d="M168 44 L170 39 L175 37 L170 35 L168 30 L166 35 L161 37 L166 39 Z"
          fill={coinColor}
          opacity={0.85}
        />
      </Svg>
    </View>
  );
};

/**
 * Storyset / unDraw inspired Savings Goal Empty State Illustration
 * Visualizes treasure vault, target flag, and coin growth
 */
export const SavingsGoalIllustration: React.FC<IllustrationProps> = ({ size = 160, width, height }) => {
  const { colors, isDark } = useAppTheme();
  const w = width ?? size;
  const h = height ?? Math.round(size * 0.88);

  const primary = colors.primary;
  const accent = colors.accent;
  const soft = isDark ? colors.elevatedSurface : colors.softAccent;
  const cardBg = colors.surface;
  const border = colors.border;
  const gold = colors.warning;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={w} height={h} viewBox="0 0 200 170" fill="none">
        <Defs>
          <RadialGradient id="goalAmbient" cx="50%" cy="50%" r="60%">
            <Stop offset="0%" stopColor={primary} stopOpacity={isDark ? 0.22 : 0.12} />
            <Stop offset="100%" stopColor={primary} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="goalVaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={cardBg} />
            <Stop offset="100%" stopColor={soft} />
          </LinearGradient>
          <LinearGradient id="goalAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.success} />
            <Stop offset="100%" stopColor={accent} />
          </LinearGradient>
        </Defs>

        {/* Ambient Glow */}
        <Circle cx="100" cy="85" r="75" fill="url(#goalAmbient)" />

        {/* Floor Shadow */}
        <Path
          d="M32 148 C65 158, 135 158, 168 148 C155 155, 45 155, 32 148 Z"
          fill={colors.border}
          opacity={0.5}
        />

        {/* Vault Safe Box */}
        <Rect
          x="52"
          y="38"
          width="96"
          height="96"
          rx="18"
          fill="url(#goalVaultGrad)"
          stroke={border}
          strokeWidth="1.5"
        />

        {/* Vault Inner Circle Door */}
        <Circle cx="100" cy="86" r="32" stroke={border} strokeWidth="2" fill={soft} />
        <Circle cx="100" cy="86" r="24" stroke={primary} strokeWidth="3" strokeDasharray="6 3" fill="none" opacity={0.7} />
        <Circle cx="100" cy="86" r="10" fill={primary} />
        <Rect x="98" y="74" width="4" height="8" rx="2" fill="#FFFFFF" />
        <Rect x="98" y="90" width="4" height="8" rx="2" fill="#FFFFFF" />
        <Rect x="88" y="84" width="8" height="4" rx="2" fill="#FFFFFF" />
        <Rect x="104" y="84" width="8" height="4" rx="2" fill="#FFFFFF" />

        {/* Target Flag on Top Right */}
        <Line x1="148" y1="26" x2="148" y2="92" stroke={primary} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M148 28 L174 38 L148 48 Z" fill="url(#goalAccentGrad)" />
        <Circle cx="148" cy="26" r="3" fill={primary} />

        {/* Ascending Steps on Left */}
        <Rect x="28" y="118" width="18" height="16" rx="4" fill={soft} stroke={border} strokeWidth="1" />
        <Rect x="36" y="98" width="18" height="20" rx="4" fill={soft} stroke={border} strokeWidth="1" />
        <Rect x="44" y="78" width="18" height="24" rx="4" fill={primary} opacity={0.25} />

        {/* Gold Coin Floating */}
        <G transform="translate(32, 54)">
          <Circle cx="12" cy="12" r="11" fill={gold} />
          <Circle cx="12" cy="12" r="8" stroke="#FFFFFF" strokeWidth="1.2" fill="none" opacity={0.6} />
          <Path d="M10 8 L14 12 L10 16" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </G>

        {/* Sparkles */}
        <Path d="M168 76 L170 70 L175 68 L170 66 L168 60 L166 66 L161 68 L166 70 Z" fill={gold} />
      </Svg>
    </View>
  );
};

/**
 * Storyset / unDraw inspired Shared Expenses / Split Empty State Illustration
 * Visualizes collaboration, shared receipt, avatars, and settled arrows
 */
export const SplitIllustration: React.FC<IllustrationProps> = ({ size = 160, width, height }) => {
  const { colors, isDark } = useAppTheme();
  const w = width ?? size;
  const h = height ?? Math.round(size * 0.88);

  const primary = colors.primary;
  const accent = colors.accent;
  const soft = isDark ? colors.elevatedSurface : colors.softAccent;
  const cardBg = colors.surface;
  const border = colors.border;
  const success = colors.success;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={w} height={h} viewBox="0 0 200 170" fill="none">
        <Defs>
          <RadialGradient id="splitAmbient" cx="50%" cy="50%" r="60%">
            <Stop offset="0%" stopColor={accent} stopOpacity={isDark ? 0.22 : 0.12} />
            <Stop offset="100%" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="splitCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={cardBg} />
            <Stop offset="100%" stopColor={soft} />
          </LinearGradient>
        </Defs>

        {/* Ambient Glow */}
        <Circle cx="100" cy="85" r="75" fill="url(#splitAmbient)" />

        {/* Floor Shadow */}
        <Path
          d="M32 148 C65 158, 135 158, 168 148 C155 155, 45 155, 32 148 Z"
          fill={colors.border}
          opacity={0.5}
        />

        {/* Left Person Avatar */}
        <G transform="translate(36, 52)">
          <Circle cx="18" cy="18" r="18" fill={soft} stroke={border} strokeWidth="1.5" />
          <Circle cx="18" cy="13" r="7" fill={primary} />
          <Path d="M7 32 C7 24, 29 24, 29 32 Z" fill={primary} opacity={0.65} />
        </G>

        {/* Right Person Avatar */}
        <G transform="translate(128, 52)">
          <Circle cx="18" cy="18" r="18" fill={soft} stroke={border} strokeWidth="1.5" />
          <Circle cx="18" cy="13" r="7" fill={accent} />
          <Path d="M7 32 C7 24, 29 24, 29 32 Z" fill={accent} opacity={0.65} />
        </G>

        {/* Central Shared Expense Card */}
        <Rect
          x="65"
          y="38"
          width="70"
          height="96"
          rx="12"
          fill="url(#splitCardGrad)"
          stroke={border}
          strokeWidth="1.5"
        />

        {/* Split Pie Graphic */}
        <Circle cx="100" cy="68" r="18" fill={soft} stroke={border} strokeWidth="1" />
        <Path d="M100 68 L100 50 A18 18 0 0 1 118 68 Z" fill={primary} />
        <Path d="M100 68 L118 68 A18 18 0 0 1 100 86 Z" fill={accent} />
        <Path d="M100 68 L100 86 A18 18 0 0 1 82 68 Z" fill={success} />
        <Path d="M100 68 L82 68 A18 18 0 0 1 100 50 Z" fill={colors.warning} />

        {/* Connected Sync Lines */}
        <Line x1="72" y1="70" x2="54" y2="70" stroke={primary} strokeWidth="2" strokeDasharray="3 3" />
        <Line x1="128" y1="70" x2="146" y2="70" stroke={accent} strokeWidth="2" strokeDasharray="3 3" />

        {/* Balance Badge at Card Bottom */}
        <Rect x="74" y="98" width="52" height="18" rx="9" fill={soft} stroke={border} strokeWidth="1" />
        <Path d="M84 107 L89 112 L96 102" stroke={success} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Line x1="102" y1="107" x2="118" y2="107" stroke={colors.secondaryText} strokeWidth="2" strokeLinecap="round" />

        {/* Floating Arrow Exchange Badge */}
        <G transform="translate(86, 122)">
          <Circle cx="14" cy="14" r="12" fill={primary} />
          <Path d="M8 12 L14 12 M11 9 L14 12 L11 15" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M20 16 L14 16 M17 19 L14 16 L17 13" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </G>
      </Svg>
    </View>
  );
};

/**
 * Storyset / unDraw inspired Transactions Empty State Illustration
 * Visualizes digital receipt, checkmark shield, and money coin
 */
export const TransactionsIllustration: React.FC<IllustrationProps> = ({ size = 160, width, height }) => {
  const { colors, isDark } = useAppTheme();
  const w = width ?? size;
  const h = height ?? Math.round(size * 0.88);

  const primary = colors.primary;
  const accent = colors.accent;
  const soft = isDark ? colors.elevatedSurface : colors.softAccent;
  const cardBg = colors.surface;
  const border = colors.border;
  const success = colors.success;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={w} height={h} viewBox="0 0 200 170" fill="none">
        <Defs>
          <RadialGradient id="txAmbient" cx="50%" cy="50%" r="60%">
            <Stop offset="0%" stopColor={primary} stopOpacity={isDark ? 0.22 : 0.12} />
            <Stop offset="100%" stopColor={primary} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="txCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={cardBg} />
            <Stop offset="100%" stopColor={soft} />
          </LinearGradient>
        </Defs>

        {/* Ambient Glow */}
        <Circle cx="100" cy="85" r="75" fill="url(#txAmbient)" />

        {/* Base Shadow */}
        <Path
          d="M32 148 C65 158, 135 158, 168 148 C155 155, 45 155, 32 148 Z"
          fill={colors.border}
          opacity={0.5}
        />

        {/* Backing Credit Card Outline */}
        <Rect
          x="34"
          y="54"
          width="100"
          height="62"
          rx="12"
          fill={soft}
          stroke={border}
          strokeWidth="1.5"
          transform="rotate(-8 84 85)"
        />

        {/* Main Digital Receipt Sheet */}
        <Path
          d="M72 32 L150 32 L150 134 L142 128 L134 134 L126 128 L118 134 L110 128 L102 134 L94 128 L86 134 L78 128 L72 134 Z"
          fill="url(#txCardGrad)"
          stroke={border}
          strokeWidth="1.5"
        />

        {/* Receipt Header Icon */}
        <Circle cx="111" cy="52" r="10" fill={primary} opacity={0.15} />
        <Path d="M106 52 L110 56 L116 48" stroke={primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Receipt Line Items */}
        <Line x1="88" y1="72" x2="134" y2="72" stroke={border} strokeWidth="3" strokeLinecap="round" />
        <Line x1="88" y1="84" x2="124" y2="84" stroke={border} strokeWidth="3" strokeLinecap="round" />
        <Line x1="88" y1="96" x2="134" y2="96" stroke={border} strokeWidth="3" strokeLinecap="round" />
        <Line x1="88" y1="108" x2="114" y2="108" stroke={primary} strokeWidth="3" strokeLinecap="round" opacity={0.5} />

        {/* Magnifying Glass Searching */}
        <G transform="translate(42, 80)">
          <Circle cx="20" cy="20" r="16" fill={cardBg} stroke={primary} strokeWidth="2.5" />
          <Line x1="32" y1="32" x2="44" y2="44" stroke={primary} strokeWidth="3.5" strokeLinecap="round" />
          <Path d="M14 20 L18 24 L26 16" stroke={success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </G>

        {/* Sparkle */}
        <Path d="M162 46 L164 40 L169 38 L164 36 L162 30 L160 36 L155 38 L160 40 Z" fill={accent} />
      </Svg>
    </View>
  );
};

