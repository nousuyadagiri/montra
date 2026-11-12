export interface ThemeColors {
  background: string;
  surface: string;
  elevatedSurface: string;
  primary: string;
  primaryMuted: string;
  onPrimary: string;
  accent: string;
  softAccent: string;
  secondary: string;
  secondaryMuted: string;
  onSecondary: string;
  mainText: string;
  secondaryText: string;
  tertiaryText: string;
  border: string;
  borderLight: string;
  error: string;
  errorMuted: string;
  expense: string;
  expenseMuted: string;
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  positive: string;
  negative: string;
  overlay: string;
  cardGradientStart: string;
  cardGradientEnd: string;
}

export type ThemeName =
  | 'midnight-indigo'
  | 'warm-sand'
  | 'slate-blue'
  | 'forest-sage'
  | 'royal-violet'
  | 'crimson-rose'
  | 'aurora-teal'
  | 'sunset-gold'
  | 'nordic-mono';

export interface ThemeOption {
  id: ThemeName;
  name: string;
  description: string;
  previewBgLight: string;
  previewBgDark: string;
  previewColor: string;
  accentColor: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'midnight-indigo',
    name: 'Electric Indigo',
    description: 'Obsidian slate & crisp indigo',
    previewBgLight: '#F6F7FB',
    previewBgDark: '#090D16',
    previewColor: '#4F46E5',
    accentColor: '#6366F1',
  },
  {
    id: 'forest-sage',
    name: 'Emerald Mint',
    description: 'Deep pine & modern emerald',
    previewBgLight: '#F3F7F4',
    previewBgDark: '#0A130E',
    previewColor: '#059669',
    accentColor: '#10B981',
  },
  {
    id: 'slate-blue',
    name: 'Oceanic Slate',
    description: 'Crisp cobalt & alpine steel',
    previewBgLight: '#F3F6FA',
    previewBgDark: '#0B121C',
    previewColor: '#0284C7',
    accentColor: '#38BDF8',
  },
  {
    id: 'royal-violet',
    name: 'Royal Amethyst',
    description: 'Midnight velvet & luminous violet',
    previewBgLight: '#F7F5FC',
    previewBgDark: '#0D0A18',
    previewColor: '#7C3AED',
    accentColor: '#A78BFA',
  },
  {
    id: 'aurora-teal',
    name: 'Aurora Teal',
    description: 'Clean mineral & Nordic cyan-teal',
    previewBgLight: '#F2F9F8',
    previewBgDark: '#081313',
    previewColor: '#0D9488',
    accentColor: '#2DD4BF',
  },
  {
    id: 'crimson-rose',
    name: 'Velvet Rose',
    description: 'Warm pearl & tailored ruby accent',
    previewBgLight: '#FBF5F6',
    previewBgDark: '#140B0E',
    previewColor: '#E11D48',
    accentColor: '#FB7185',
  },
  {
    id: 'warm-sand',
    name: 'Warm Copper',
    description: 'Refined espresso & terracotta',
    previewBgLight: '#F8F5F0',
    previewBgDark: '#12100E',
    previewColor: '#B45309',
    accentColor: '#D97706',
  },
  {
    id: 'sunset-gold',
    name: 'Champagne Gold',
    description: 'Ivory parchment & burnished gold',
    previewBgLight: '#FAF7F0',
    previewBgDark: '#131109',
    previewColor: '#B45309',
    accentColor: '#EAB308',
  },
  {
    id: 'nordic-mono',
    name: 'Carbon Mono',
    description: 'Minimalist monochrome & titanium',
    previewBgLight: '#F5F5F7',
    previewBgDark: '#0A0A0B',
    previewColor: '#18181B',
    accentColor: '#A1A1AA',
  },
];

/* -------------------------------------------------------------
 * 1. ELECTRIC INDIGO (Default)
 * ------------------------------------------------------------- */
export const MidnightIndigoLight: ThemeColors = {
  background: '#F6F7FB',
  surface: '#FFFFFF',
  elevatedSurface: '#EEF1F8',
  primary: '#4F46E5',
  primaryMuted: 'rgba(79, 70, 229, 0.11)',
  onPrimary: '#FFFFFF',
  accent: '#6366F1',
  softAccent: '#EEF2FF',
  secondary: '#475569',
  secondaryMuted: 'rgba(71, 85, 105, 0.11)',
  onSecondary: '#FFFFFF',
  mainText: '#0F172A',
  secondaryText: '#475569',
  tertiaryText: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#EDF1F7',
  error: '#E11D48',
  errorMuted: 'rgba(225, 29, 72, 0.1)',
  expense: '#E11D48',
  expenseMuted: 'rgba(225, 29, 72, 0.1)',
  success: '#059669',
  successMuted: 'rgba(5, 150, 105, 0.11)',
  warning: '#D97706',
  warningMuted: 'rgba(217, 119, 6, 0.11)',
  positive: '#059669',
  negative: '#E11D48',
  overlay: 'rgba(15, 23, 42, 0.56)',
  cardGradientStart: '#FFFFFF',
  cardGradientEnd: '#F3F5FC',
};

export const MidnightIndigoDark: ThemeColors = {
  background: '#090D16',
  surface: '#111827',
  elevatedSurface: '#1B2437',
  primary: '#6366F1',
  primaryMuted: 'rgba(99, 102, 241, 0.18)',
  onPrimary: '#FFFFFF',
  accent: '#818CF8',
  softAccent: '#1E2547',
  secondary: '#94A3B8',
  secondaryMuted: 'rgba(148, 163, 184, 0.14)',
  onSecondary: '#090D16',
  mainText: '#F8FAFC',
  secondaryText: '#94A3B8',
  tertiaryText: '#64748B',
  border: '#232E45',
  borderLight: '#192235',
  error: '#FB7185',
  errorMuted: 'rgba(251, 113, 133, 0.16)',
  expense: '#FB7185',
  expenseMuted: 'rgba(251, 113, 133, 0.16)',
  success: '#34D399',
  successMuted: 'rgba(52, 211, 153, 0.16)',
  warning: '#FBBF24',
  warningMuted: 'rgba(251, 191, 36, 0.16)',
  positive: '#34D399',
  negative: '#FB7185',
  overlay: 'rgba(2, 6, 23, 0.78)',
  cardGradientStart: '#111827',
  cardGradientEnd: '#1B2437',
};

/* -------------------------------------------------------------
 * 2. WARM COPPER (Warm Sand)
 * ------------------------------------------------------------- */
export const WarmSandLight: ThemeColors = {
  background: '#F8F5F0',
  surface: '#FFFFFF',
  elevatedSurface: '#EFE9E0',
  primary: '#B45309',
  primaryMuted: 'rgba(180, 83, 9, 0.11)',
  onPrimary: '#FFFFFF',
  accent: '#C2410C',
  softAccent: '#FFF3EB',
  secondary: '#57534E',
  secondaryMuted: 'rgba(87, 83, 78, 0.11)',
  onSecondary: '#FFFFFF',
  mainText: '#1C1917',
  secondaryText: '#57534E',
  tertiaryText: '#A8A29E',
  border: '#E7E0D6',
  borderLight: '#F2EDE6',
  error: '#DC2626',
  errorMuted: 'rgba(220, 38, 38, 0.1)',
  expense: '#DC2626',
  expenseMuted: 'rgba(220, 38, 38, 0.1)',
  success: '#0D9488',
  successMuted: 'rgba(13, 148, 136, 0.11)',
  warning: '#D97706',
  warningMuted: 'rgba(217, 119, 6, 0.12)',
  positive: '#0D9488',
  negative: '#DC2626',
  overlay: 'rgba(28, 25, 23, 0.56)',
  cardGradientStart: '#FFFFFF',
  cardGradientEnd: '#F8F5F0',
};

export const WarmSandDark: ThemeColors = {
  background: '#12100E',
  surface: '#1C1915',
  elevatedSurface: '#27231D',
  primary: '#F59E0B',
  primaryMuted: 'rgba(245, 158, 11, 0.17)',
  onPrimary: '#12100E',
  accent: '#FB923C',
  softAccent: '#2D2118',
  secondary: '#A8A29E',
  secondaryMuted: 'rgba(168, 162, 158, 0.14)',
  onSecondary: '#12100E',
  mainText: '#FAF7F2',
  secondaryText: '#A8A29E',
  tertiaryText: '#78716C',
  border: '#322C25',
  borderLight: '#25211B',
  error: '#F87171',
  errorMuted: 'rgba(248, 113, 113, 0.16)',
  expense: '#F87171',
  expenseMuted: 'rgba(248, 113, 113, 0.16)',
  success: '#2DD4BF',
  successMuted: 'rgba(45, 212, 191, 0.16)',
  warning: '#FBBF24',
  warningMuted: 'rgba(251, 191, 36, 0.16)',
  positive: '#2DD4BF',
  negative: '#F87171',
  overlay: 'rgba(0, 0, 0, 0.78)',
  cardGradientStart: '#1C1915',
  cardGradientEnd: '#27231D',
};

/* -------------------------------------------------------------
 * 3. OCEANIC SLATE (Slate Blue)
 * ------------------------------------------------------------- */
export const SlateBlueLight: ThemeColors = {
  background: '#F3F6FA',
  surface: '#FFFFFF',
  elevatedSurface: '#E8EEF6',
  primary: '#0284C7',
  primaryMuted: 'rgba(2, 132, 199, 0.11)',
  onPrimary: '#FFFFFF',
  accent: '#0EA5E9',
  softAccent: '#E0F2FE',
  secondary: '#475569',
  secondaryMuted: 'rgba(71, 85, 105, 0.11)',
  onSecondary: '#FFFFFF',
  mainText: '#0F172A',
  secondaryText: '#475569',
  tertiaryText: '#94A3B8',
  border: '#DCE4EF',
  borderLight: '#EAF0F7',
  error: '#E11D48',
  errorMuted: 'rgba(225, 29, 72, 0.1)',
  expense: '#E11D48',
  expenseMuted: 'rgba(225, 29, 72, 0.1)',
  success: '#059669',
  successMuted: 'rgba(5, 150, 105, 0.11)',
  warning: '#D97706',
  warningMuted: 'rgba(217, 119, 6, 0.11)',
  positive: '#059669',
  negative: '#E11D48',
  overlay: 'rgba(15, 23, 42, 0.56)',
  cardGradientStart: '#FFFFFF',
  cardGradientEnd: '#F3F6FA',
};

export const SlateBlueDark: ThemeColors = {
  background: '#0B121C',
  surface: '#131D2B',
  elevatedSurface: '#1C293B',
  primary: '#38BDF8',
  primaryMuted: 'rgba(56, 189, 248, 0.17)',
  onPrimary: '#08121E',
  accent: '#7DD3FC',
  softAccent: '#162A3E',
  secondary: '#94A3B8',
  secondaryMuted: 'rgba(148, 163, 184, 0.14)',
  onSecondary: '#0B121C',
  mainText: '#F1F5F9',
  secondaryText: '#94A3B8',
  tertiaryText: '#64748B',
  border: '#25354B',
  borderLight: '#1A2637',
  error: '#FB7185',
  errorMuted: 'rgba(251, 113, 133, 0.16)',
  expense: '#FB7185',
  expenseMuted: 'rgba(251, 113, 133, 0.16)',
  success: '#34D399',
  successMuted: 'rgba(52, 211, 153, 0.16)',
  warning: '#FBBF24',
  warningMuted: 'rgba(251, 191, 36, 0.16)',
  positive: '#34D399',
  negative: '#FB7185',
  overlay: 'rgba(2, 6, 23, 0.78)',
  cardGradientStart: '#131D2B',
  cardGradientEnd: '#1C293B',
};

/* -------------------------------------------------------------
 * 4. EMERALD MINT (Forest Sage)
 * ------------------------------------------------------------- */
export const ForestSageLight: ThemeColors = {
  background: '#F3F7F4',
  surface: '#FFFFFF',
  elevatedSurface: '#E6EFE9',
  primary: '#059669',
  primaryMuted: 'rgba(5, 150, 105, 0.11)',
  onPrimary: '#FFFFFF',
  accent: '#10B981',
  softAccent: '#D1FAE5',
  secondary: '#4B5E53',
  secondaryMuted: 'rgba(75, 94, 83, 0.11)',
  onSecondary: '#FFFFFF',
  mainText: '#0F2117',
  secondaryText: '#4B5E53',
  tertiaryText: '#8FA398',
  border: '#DCE7DF',
  borderLight: '#EAF2EC',
  error: '#E11D48',
  errorMuted: 'rgba(225, 29, 72, 0.1)',
  expense: '#E11D48',
  expenseMuted: 'rgba(225, 29, 72, 0.1)',
  success: '#059669',
  successMuted: 'rgba(5, 150, 105, 0.12)',
  warning: '#D97706',
  warningMuted: 'rgba(217, 119, 6, 0.11)',
  positive: '#059669',
  negative: '#E11D48',
  overlay: 'rgba(10, 19, 14, 0.56)',
  cardGradientStart: '#FFFFFF',
  cardGradientEnd: '#F3F7F4',
};

export const ForestSageDark: ThemeColors = {
  background: '#0A130E',
  surface: '#111E17',
  elevatedSurface: '#1A2C22',
  primary: '#10B981',
  primaryMuted: 'rgba(16, 185, 129, 0.18)',
  onPrimary: '#06150E',
  accent: '#34D399',
  softAccent: '#132D21',
  secondary: '#8FA69A',
  secondaryMuted: 'rgba(143, 166, 154, 0.14)',
  onSecondary: '#0A130E',
  mainText: '#F0FDF4',
  secondaryText: '#8FA69A',
  tertiaryText: '#5F776A',
  border: '#22382C',
  borderLight: '#18281F',
  error: '#FB7185',
  errorMuted: 'rgba(251, 113, 133, 0.16)',
  expense: '#FB7185',
  expenseMuted: 'rgba(251, 113, 133, 0.16)',
  success: '#34D399',
  successMuted: 'rgba(52, 211, 153, 0.17)',
  warning: '#FBBF24',
  warningMuted: 'rgba(251, 191, 36, 0.16)',
  positive: '#34D399',
  negative: '#FB7185',
  overlay: 'rgba(2, 10, 6, 0.78)',
  cardGradientStart: '#111E17',
  cardGradientEnd: '#1A2C22',
};

/* -------------------------------------------------------------
 * COMPACT PALETTE BUILDER (Shared for 5 Curated Extra Themes)
 * ------------------------------------------------------------- */
interface PaletteSeed {
  lightBg: string;
  lightElevated: string;
  lightPrimary: string;
  lightPrimaryMuted: string;
  lightAccent: string;
  lightSoftAccent: string;
  lightBorder: string;
  lightBorderLight: string;
  lightText: string;
  lightTextSecondary: string;
  lightTextTertiary: string;
  darkBg: string;
  darkSurface: string;
  darkElevated: string;
  darkPrimary: string;
  darkPrimaryMuted: string;
  darkOnPrimary: string;
  darkAccent: string;
  darkSoftAccent: string;
  darkBorder: string;
  darkBorderLight: string;
  darkText: string;
  darkTextSecondary: string;
  darkTextTertiary: string;
}

const buildThemePair = (seed: PaletteSeed): { light: ThemeColors; dark: ThemeColors } => ({
  light: {
    background: seed.lightBg,
    surface: '#FFFFFF',
    elevatedSurface: seed.lightElevated,
    primary: seed.lightPrimary,
    primaryMuted: seed.lightPrimaryMuted,
    onPrimary: '#FFFFFF',
    accent: seed.lightAccent,
    softAccent: seed.lightSoftAccent,
    secondary: seed.lightTextSecondary,
    secondaryMuted: 'rgba(71, 85, 105, 0.11)',
    onSecondary: '#FFFFFF',
    mainText: seed.lightText,
    secondaryText: seed.lightTextSecondary,
    tertiaryText: seed.lightTextTertiary,
    border: seed.lightBorder,
    borderLight: seed.lightBorderLight,
    error: '#E11D48',
    errorMuted: 'rgba(225, 29, 72, 0.1)',
    expense: '#E11D48',
    expenseMuted: 'rgba(225, 29, 72, 0.1)',
    success: '#059669',
    successMuted: 'rgba(5, 150, 105, 0.11)',
    warning: '#D97706',
    warningMuted: 'rgba(217, 119, 6, 0.11)',
    positive: '#059669',
    negative: '#E11D48',
    overlay: 'rgba(15, 23, 42, 0.56)',
    cardGradientStart: '#FFFFFF',
    cardGradientEnd: seed.lightBg,
  },
  dark: {
    background: seed.darkBg,
    surface: seed.darkSurface,
    elevatedSurface: seed.darkElevated,
    primary: seed.darkPrimary,
    primaryMuted: seed.darkPrimaryMuted,
    onPrimary: seed.darkOnPrimary,
    accent: seed.darkAccent,
    softAccent: seed.darkSoftAccent,
    secondary: seed.darkTextSecondary,
    secondaryMuted: 'rgba(148, 163, 184, 0.14)',
    onSecondary: seed.darkBg,
    mainText: seed.darkText,
    secondaryText: seed.darkTextSecondary,
    tertiaryText: seed.darkTextTertiary,
    border: seed.darkBorder,
    borderLight: seed.darkBorderLight,
    error: '#FB7185',
    errorMuted: 'rgba(251, 113, 133, 0.16)',
    expense: '#FB7185',
    expenseMuted: 'rgba(251, 113, 133, 0.16)',
    success: '#34D399',
    successMuted: 'rgba(52, 211, 153, 0.16)',
    warning: '#FBBF24',
    warningMuted: 'rgba(251, 191, 36, 0.16)',
    positive: '#34D399',
    negative: '#FB7185',
    overlay: 'rgba(2, 6, 23, 0.78)',
    cardGradientStart: seed.darkSurface,
    cardGradientEnd: seed.darkElevated,
  },
});

const RoyalVioletPair = buildThemePair({
  lightBg: '#F7F5FC',
  lightElevated: '#EEEAF9',
  lightPrimary: '#7C3AED',
  lightPrimaryMuted: 'rgba(124, 58, 237, 0.11)',
  lightAccent: '#8B5CF6',
  lightSoftAccent: '#F3EEFF',
  lightBorder: '#E5DFF5',
  lightBorderLight: '#F0ECF9',
  lightText: '#171128',
  lightTextSecondary: '#584E73',
  lightTextTertiary: '#998FB5',
  darkBg: '#0D0A18',
  darkSurface: '#151126',
  darkElevated: '#201A38',
  darkPrimary: '#8B5CF6',
  darkPrimaryMuted: 'rgba(139, 92, 246, 0.2)',
  darkOnPrimary: '#FFFFFF',
  darkAccent: '#A78BFA',
  darkSoftAccent: '#261D45',
  darkBorder: '#2C234B',
  darkBorderLight: '#1E1835',
  darkText: '#F7F5FF',
  darkTextSecondary: '#A89EC8',
  darkTextTertiary: '#6F6591',
});

const AuroraTealPair = buildThemePair({
  lightBg: '#F2F9F8',
  lightElevated: '#E5F2F0',
  lightPrimary: '#0D9488',
  lightPrimaryMuted: 'rgba(13, 148, 136, 0.11)',
  lightAccent: '#14B8A6',
  lightSoftAccent: '#CCFBF1',
  lightBorder: '#D5E8E5',
  lightBorderLight: '#E7F3F1',
  lightText: '#0C2020',
  lightTextSecondary: '#476362',
  lightTextTertiary: '#8AA3A1',
  darkBg: '#081313',
  darkSurface: '#101F1F',
  darkElevated: '#182E2E',
  darkPrimary: '#14B8A6',
  darkPrimaryMuted: 'rgba(20, 184, 166, 0.18)',
  darkOnPrimary: '#061A19',
  darkAccent: '#2DD4BF',
  darkSoftAccent: '#123130',
  darkBorder: '#213C3C',
  darkBorderLight: '#162A2A',
  darkText: '#F0FDFA',
  darkTextSecondary: '#8CA8A6',
  darkTextTertiary: '#5C7775',
});

const CrimsonRosePair = buildThemePair({
  lightBg: '#FBF5F6',
  lightElevated: '#F5E9EC',
  lightPrimary: '#E11D48',
  lightPrimaryMuted: 'rgba(225, 29, 72, 0.11)',
  lightAccent: '#F43F5E',
  lightSoftAccent: '#FFE4E9',
  lightBorder: '#EEDCE0',
  lightBorderLight: '#F7ECEE',
  lightText: '#230F15',
  lightTextSecondary: '#694952',
  lightTextTertiary: '#A68991',
  darkBg: '#140B0E',
  darkSurface: '#1F1216',
  darkElevated: '#2D1A20',
  darkPrimary: '#F43F5E',
  darkPrimaryMuted: 'rgba(244, 63, 94, 0.2)',
  darkOnPrimary: '#FFFFFF',
  darkAccent: '#FB7185',
  darkSoftAccent: '#381923',
  darkBorder: '#3C222A',
  darkBorderLight: '#29171D',
  darkText: '#FFF5F7',
  darkTextSecondary: '#C29BA4',
  darkTextTertiary: '#85616A',
});

const SunsetGoldPair = buildThemePair({
  lightBg: '#FAF7F0',
  lightElevated: '#F2ECE0',
  lightPrimary: '#B45309',
  lightPrimaryMuted: 'rgba(180, 83, 9, 0.12)',
  lightAccent: '#CA8A04',
  lightSoftAccent: '#FEF3C7',
  lightBorder: '#EAE0CE',
  lightBorderLight: '#F4EFE3',
  lightText: '#1F1A0E',
  lightTextSecondary: '#61563F',
  lightTextTertiary: '#9E9279',
  darkBg: '#131109',
  darkSurface: '#1D1A0F',
  darkElevated: '#2B2616',
  darkPrimary: '#EAB308',
  darkPrimaryMuted: 'rgba(234, 179, 8, 0.19)',
  darkOnPrimary: '#131109',
  darkAccent: '#FACC15',
  darkSoftAccent: '#332B12',
  darkBorder: '#3A321C',
  darkBorderLight: '#282213',
  darkText: '#FEFCE8',
  darkTextSecondary: '#B8AD8A',
  darkTextTertiary: '#7D7458',
});

const NordicMonoPair = buildThemePair({
  lightBg: '#F5F5F7',
  lightElevated: '#EAEAEF',
  lightPrimary: '#18181B',
  lightPrimaryMuted: 'rgba(24, 24, 27, 0.09)',
  lightAccent: '#3F3F46',
  lightSoftAccent: '#E4E4E7',
  lightBorder: '#E0E0E5',
  lightBorderLight: '#EDEDEF',
  lightText: '#09090B',
  lightTextSecondary: '#52525B',
  lightTextTertiary: '#A1A1AA',
  darkBg: '#0A0A0B',
  darkSurface: '#141416',
  darkElevated: '#1F1F23',
  darkPrimary: '#E4E4E7',
  darkPrimaryMuted: 'rgba(228, 228, 231, 0.16)',
  darkOnPrimary: '#09090B',
  darkAccent: '#A1A1AA',
  darkSoftAccent: '#27272A',
  darkBorder: '#2A2A2F',
  darkBorderLight: '#1D1D21',
  darkText: '#FAFAFA',
  darkTextSecondary: '#A1A1AA',
  darkTextTertiary: '#71717A',
});

/* -------------------------------------------------------------
 * Dynamic Theme Resolver
 * ------------------------------------------------------------- */
export const THEMES: Record<ThemeName, { light: ThemeColors; dark: ThemeColors }> = {
  'midnight-indigo': {
    light: MidnightIndigoLight,
    dark: MidnightIndigoDark,
  },
  'warm-sand': {
    light: WarmSandLight,
    dark: WarmSandDark,
  },
  'slate-blue': {
    light: SlateBlueLight,
    dark: SlateBlueDark,
  },
  'forest-sage': {
    light: ForestSageLight,
    dark: ForestSageDark,
  },
  'royal-violet': RoyalVioletPair,
  'crimson-rose': CrimsonRosePair,
  'aurora-teal': AuroraTealPair,
  'sunset-gold': SunsetGoldPair,
  'nordic-mono': NordicMonoPair,
};

export const getThemeColors = (themeName: ThemeName, isDark: boolean): ThemeColors => {
  const selectedTheme = THEMES[themeName] || THEMES['midnight-indigo'];
  return isDark ? selectedTheme.dark : selectedTheme.light;
};

// Backwards-compatible defaults
export const LightColors: ThemeColors = MidnightIndigoLight;
export const DarkColors: ThemeColors = MidnightIndigoDark;
