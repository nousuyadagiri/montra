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
  | 'slate-blue'
  | 'aurora-teal'
  | 'obsidian-ash'
  | 'sage-stone'
  | 'alpine-cobalt'
  | 'glacier-mist'
  | 'soft-periwinkle'
  | 'minimal-pearl';

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
    id: 'slate-blue',
    name: 'Oceanic Slate',
    description: 'Crisp cobalt & alpine steel',
    previewBgLight: '#F3F6FA',
    previewBgDark: '#0B121C',
    previewColor: '#0284C7',
    accentColor: '#38BDF8',
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
    id: 'obsidian-ash',
    name: 'Obsidian Ash',
    description: 'Architectural charcoal & cool silver',
    previewBgLight: '#F6F7F8',
    previewBgDark: '#0A0B0E',
    previewColor: '#272B33',
    accentColor: '#9CA3B2',
  },
  {
    id: 'sage-stone',
    name: 'Sage Stone',
    description: 'Muted eucalyptus & mineral neutral',
    previewBgLight: '#F4F6F4',
    previewBgDark: '#0A100D',
    previewColor: '#3E6352',
    accentColor: '#7BA893',
  },
  {
    id: 'alpine-cobalt',
    name: 'Alpine Cobalt',
    description: 'Tailored ink navy & frosted steel',
    previewBgLight: '#F5F7FA',
    previewBgDark: '#090E17',
    previewColor: '#2D4A7A',
    accentColor: '#7B9ED4',
  },
  {
    id: 'glacier-mist',
    name: 'Glacier Mist',
    description: 'Airy ice-slate & soft petrol',
    previewBgLight: '#F4F8F9',
    previewBgDark: '#091114',
    previewColor: '#2A6B7C',
    accentColor: '#6EB6C7',
  },
  {
    id: 'soft-periwinkle',
    name: 'Soft Periwinkle',
    description: 'Calm lavender-slate & twilight mist',
    previewBgLight: '#F6F6FA',
    previewBgDark: '#0B0B14',
    previewColor: '#51548C',
    accentColor: '#9396CF',
  },
  {
    id: 'minimal-pearl',
    name: 'Minimalist Pearl',
    description: 'Warm alabaster & matte graphite',
    previewBgLight: '#F7F6F4',
    previewBgDark: '#0F0E0D',
    previewColor: '#4A463F',
    accentColor: '#C7C1B6',
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
 * 2. OCEANIC SLATE
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
 * SHARED MINIMALIST PALETTE BUILDER
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
    secondaryMuted: 'rgba(71, 85, 105, 0.10)',
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

const ObsidianAshPair = buildThemePair({
  lightBg: '#F6F7F8',
  lightElevated: '#ECEEF1',
  lightPrimary: '#272B33',
  lightPrimaryMuted: 'rgba(39, 43, 51, 0.09)',
  lightAccent: '#525866',
  lightSoftAccent: '#EBECEF',
  lightBorder: '#DFE2E7',
  lightBorderLight: '#EDF0F3',
  lightText: '#111317',
  lightTextSecondary: '#59606D',
  lightTextTertiary: '#99A0AD',
  darkBg: '#0A0B0E',
  darkSurface: '#121419',
  darkElevated: '#1B1E25',
  darkPrimary: '#D4D8E0',
  darkPrimaryMuted: 'rgba(212, 216, 224, 0.15)',
  darkOnPrimary: '#0A0B0E',
  darkAccent: '#9CA3B2',
  darkSoftAccent: '#222630',
  darkBorder: '#252A34',
  darkBorderLight: '#191C24',
  darkText: '#F4F5F7',
  darkTextSecondary: '#9198A6',
  darkTextTertiary: '#616875',
});

const SageStonePair = buildThemePair({
  lightBg: '#F4F6F4',
  lightElevated: '#E8ECE8',
  lightPrimary: '#3E6352',
  lightPrimaryMuted: 'rgba(62, 99, 82, 0.11)',
  lightAccent: '#547D6A',
  lightSoftAccent: '#E4ECE7',
  lightBorder: '#DCE3DD',
  lightBorderLight: '#EBF0EC',
  lightText: '#141D18',
  lightTextSecondary: '#536159',
  lightTextTertiary: '#919E97',
  darkBg: '#0A100D',
  darkSurface: '#121A16',
  darkElevated: '#1B2620',
  darkPrimary: '#7BA893',
  darkPrimaryMuted: 'rgba(123, 168, 147, 0.17)',
  darkOnPrimary: '#08130E',
  darkAccent: '#9AC2AF',
  darkSoftAccent: '#1A2B22',
  darkBorder: '#23312A',
  darkBorderLight: '#18221D',
  darkText: '#F1F5F2',
  darkTextSecondary: '#8E9E95',
  darkTextTertiary: '#5E6E66',
});

const AlpineCobaltPair = buildThemePair({
  lightBg: '#F5F7FA',
  lightElevated: '#EAEEF5',
  lightPrimary: '#2D4A7A',
  lightPrimaryMuted: 'rgba(45, 74, 122, 0.11)',
  lightAccent: '#4669A3',
  lightSoftAccent: '#E6ECF6',
  lightBorder: '#DCE2EC',
  lightBorderLight: '#EBEEF5',
  lightText: '#101724',
  lightTextSecondary: '#4D596D',
  lightTextTertiary: '#8F9AAE',
  darkBg: '#090E17',
  darkSurface: '#111927',
  darkElevated: '#192436',
  darkPrimary: '#7B9ED4',
  darkPrimaryMuted: 'rgba(123, 158, 212, 0.17)',
  darkOnPrimary: '#070E19',
  darkAccent: '#9CB9E5',
  darkSoftAccent: '#19263D',
  darkBorder: '#233046',
  darkBorderLight: '#182233',
  darkText: '#F2F5FA',
  darkTextSecondary: '#8E9BB0',
  darkTextTertiary: '#5F6D82',
});

const GlacierMistPair = buildThemePair({
  lightBg: '#F4F8F9',
  lightElevated: '#E7EFF2',
  lightPrimary: '#2A6B7C',
  lightPrimaryMuted: 'rgba(42, 107, 124, 0.11)',
  lightAccent: '#428799',
  lightSoftAccent: '#E2EFF3',
  lightBorder: '#DAE5E8',
  lightBorderLight: '#EAF1F3',
  lightText: '#0F1C20',
  lightTextSecondary: '#4D6066',
  lightTextTertiary: '#8DA0A6',
  darkBg: '#091114',
  darkSurface: '#101B1F',
  darkElevated: '#18272D',
  darkPrimary: '#6EB6C7',
  darkPrimaryMuted: 'rgba(110, 182, 199, 0.17)',
  darkOnPrimary: '#071317',
  darkAccent: '#8FD0DF',
  darkSoftAccent: '#152930',
  darkBorder: '#21333A',
  darkBorderLight: '#162429',
  darkText: '#F1F7F9',
  darkTextSecondary: '#8BA1A8',
  darkTextTertiary: '#5B7077',
});

const SoftPeriwinklePair = buildThemePair({
  lightBg: '#F6F6FA',
  lightElevated: '#ECECF5',
  lightPrimary: '#51548C',
  lightPrimaryMuted: 'rgba(81, 84, 140, 0.11)',
  lightAccent: '#6A6DA8',
  lightSoftAccent: '#EAEAF5',
  lightBorder: '#DFDFEC',
  lightBorderLight: '#ECECF5',
  lightText: '#141422',
  lightTextSecondary: '#55556D',
  lightTextTertiary: '#9696AD',
  darkBg: '#0B0B14',
  darkSurface: '#131422',
  darkElevated: '#1D1E31',
  darkPrimary: '#9396CF',
  darkPrimaryMuted: 'rgba(147, 150, 207, 0.18)',
  darkOnPrimary: '#0B0C18',
  darkAccent: '#B0B3E3',
  darkSoftAccent: '#21233B',
  darkBorder: '#282A40',
  darkBorderLight: '#1B1C2D',
  darkText: '#F4F4FA',
  darkTextSecondary: '#9495B0',
  darkTextTertiary: '#636480',
});

const MinimalPearlPair = buildThemePair({
  lightBg: '#F7F6F4',
  lightElevated: '#EEECE8',
  lightPrimary: '#4A463F',
  lightPrimaryMuted: 'rgba(74, 70, 63, 0.10)',
  lightAccent: '#6E685E',
  lightSoftAccent: '#ECE9E3',
  lightBorder: '#E3DFD8',
  lightBorderLight: '#EFECE7',
  lightText: '#191815',
  lightTextSecondary: '#625E57',
  lightTextTertiary: '#9E9990',
  darkBg: '#0F0E0D',
  darkSurface: '#181715',
  darkElevated: '#23211E',
  darkPrimary: '#C7C1B6',
  darkPrimaryMuted: 'rgba(199, 193, 182, 0.16)',
  darkOnPrimary: '#11100E',
  darkAccent: '#DFD9CE',
  darkSoftAccent: '#292622',
  darkBorder: '#2F2C27',
  darkBorderLight: '#211E1B',
  darkText: '#F6F5F2',
  darkTextSecondary: '#9D988E',
  darkTextTertiary: '#6B665D',
});

/* -------------------------------------------------------------
 * Dynamic Theme Resolver
 * ------------------------------------------------------------- */
export const THEMES: Record<ThemeName, { light: ThemeColors; dark: ThemeColors }> = {
  'midnight-indigo': {
    light: MidnightIndigoLight,
    dark: MidnightIndigoDark,
  },
  'slate-blue': {
    light: SlateBlueLight,
    dark: SlateBlueDark,
  },
  'aurora-teal': AuroraTealPair,
  'obsidian-ash': ObsidianAshPair,
  'sage-stone': SageStonePair,
  'alpine-cobalt': AlpineCobaltPair,
  'glacier-mist': GlacierMistPair,
  'soft-periwinkle': SoftPeriwinklePair,
  'minimal-pearl': MinimalPearlPair,
};

export const getThemeColors = (themeName: ThemeName, isDark: boolean): ThemeColors => {
  const selectedTheme = THEMES[themeName] || THEMES['midnight-indigo'];
  return isDark ? selectedTheme.dark : selectedTheme.light;
};

// Backwards-compatible defaults
export const LightColors: ThemeColors = MidnightIndigoLight;
export const DarkColors: ThemeColors = MidnightIndigoDark;
