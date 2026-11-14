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
  | 'claude-terracotta'
  | 'gemini-celestial'
  | 'chatgpt-emerald'
  | 'linear-violet'
  | 'solaris-amber'
  | 'monolith-onyx'
  | 'nordic-frost';

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
    id: 'claude-terracotta',
    name: 'Claude Terracotta',
    description: 'Warm terracotta & desert sand',
    previewBgLight: '#FAF8F5',
    previewBgDark: '#141210',
    previewColor: '#C2410C',
    accentColor: '#FB923C',
  },
  {
    id: 'gemini-celestial',
    name: 'Gemini Celestial',
    description: 'Celestial blue & violet aurora',
    previewBgLight: '#F4F7FC',
    previewBgDark: '#0B0F19',
    previewColor: '#1A73E8',
    accentColor: '#8B5CF6',
  },
  {
    id: 'chatgpt-emerald',
    name: 'OpenAI Emerald',
    description: 'OpenAI mint & titanium slate',
    previewBgLight: '#F7F9F8',
    previewBgDark: '#0D1117',
    previewColor: '#10A37F',
    accentColor: '#10B981',
  },
  {
    id: 'linear-violet',
    name: 'Linear Violet',
    description: 'Linear obsidian & electric violet',
    previewBgLight: '#F8F8FC',
    previewBgDark: '#0F0F14',
    previewColor: '#5E6AD2',
    accentColor: '#717DF0',
  },
  {
    id: 'solaris-amber',
    name: 'Solaris Amber',
    description: 'Radiant amber & champagne bronze',
    previewBgLight: '#FFFDF7',
    previewBgDark: '#120E08',
    previewColor: '#D97706',
    accentColor: '#FBBF24',
  },
  {
    id: 'monolith-onyx',
    name: 'Monolith Onyx',
    description: 'Architectural onyx & pure platinum',
    previewBgLight: '#FAFAFA',
    previewBgDark: '#09090B',
    previewColor: '#111827',
    accentColor: '#FAFAFA',
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Frost',
    description: 'Polar slate & arctic spruce',
    previewBgLight: '#F3F6F8',
    previewBgDark: '#090F13',
    previewColor: '#1E4E63',
    accentColor: '#64AEC9',
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

const ClaudeTerracottaPair = buildThemePair({
  lightBg: '#FAF8F5',
  lightElevated: '#F3EFEA',
  lightPrimary: '#C2410C',
  lightPrimaryMuted: 'rgba(194, 65, 12, 0.11)',
  lightAccent: '#EA580C',
  lightSoftAccent: '#FFEDD5',
  lightBorder: '#E7DFD5',
  lightBorderLight: '#F3EFE8',
  lightText: '#1C1917',
  lightTextSecondary: '#57534E',
  lightTextTertiary: '#A8A29E',
  darkBg: '#141210',
  darkSurface: '#1D1917',
  darkElevated: '#292524',
  darkPrimary: '#FB923C',
  darkPrimaryMuted: 'rgba(251, 146, 60, 0.18)',
  darkOnPrimary: '#0C0A09',
  darkAccent: '#FDBA74',
  darkSoftAccent: '#292524',
  darkBorder: '#38322E',
  darkBorderLight: '#231F1C',
  darkText: '#FAFAF9',
  darkTextSecondary: '#A8A29E',
  darkTextTertiary: '#78716C',
});

const GeminiCelestialPair = buildThemePair({
  lightBg: '#F4F7FC',
  lightElevated: '#E9EEF8',
  lightPrimary: '#1A73E8',
  lightPrimaryMuted: 'rgba(26, 115, 232, 0.12)',
  lightAccent: '#7C3AED',
  lightSoftAccent: '#EDE9FE',
  lightBorder: '#D8E2F0',
  lightBorderLight: '#EAF0F9',
  lightText: '#0F172A',
  lightTextSecondary: '#475569',
  lightTextTertiary: '#94A3B8',
  darkBg: '#0B0F19',
  darkSurface: '#111827',
  darkElevated: '#1F2937',
  darkPrimary: '#38BDF8',
  darkPrimaryMuted: 'rgba(56, 189, 248, 0.18)',
  darkOnPrimary: '#030712',
  darkAccent: '#A78BFA',
  darkSoftAccent: '#1E1B4B',
  darkBorder: '#1F293D',
  darkBorderLight: '#141D2D',
  darkText: '#F8FAFC',
  darkTextSecondary: '#94A3B8',
  darkTextTertiary: '#64748B',
});

const ChatGPTEmeraldPair = buildThemePair({
  lightBg: '#F7F9F8',
  lightElevated: '#EDF2F0',
  lightPrimary: '#10A37F',
  lightPrimaryMuted: 'rgba(16, 163, 127, 0.11)',
  lightAccent: '#059669',
  lightSoftAccent: '#D1FAE5',
  lightBorder: '#D6E2DE',
  lightBorderLight: '#E8F0ED',
  lightText: '#0D1714',
  lightTextSecondary: '#475852',
  lightTextTertiary: '#8FA39C',
  darkBg: '#0D1117',
  darkSurface: '#161B22',
  darkElevated: '#21262D',
  darkPrimary: '#10B981',
  darkPrimaryMuted: 'rgba(16, 185, 129, 0.18)',
  darkOnPrimary: '#05130E',
  darkAccent: '#34D399',
  darkSoftAccent: '#064E3B',
  darkBorder: '#30363D',
  darkBorderLight: '#21262D',
  darkText: '#F0F6FC',
  darkTextSecondary: '#8B949E',
  darkTextTertiary: '#6E7681',
});

const LinearVioletPair = buildThemePair({
  lightBg: '#F8F8FC',
  lightElevated: '#EEEEF7',
  lightPrimary: '#5E6AD2',
  lightPrimaryMuted: 'rgba(94, 106, 210, 0.12)',
  lightAccent: '#7C3AED',
  lightSoftAccent: '#EDE9FE',
  lightBorder: '#DCDCF0',
  lightBorderLight: '#EDEDFA',
  lightText: '#121224',
  lightTextSecondary: '#50506E',
  lightTextTertiary: '#9191B0',
  darkBg: '#0F0F14',
  darkSurface: '#171721',
  darkElevated: '#212130',
  darkPrimary: '#717DF0',
  darkPrimaryMuted: 'rgba(113, 125, 240, 0.18)',
  darkOnPrimary: '#09090F',
  darkAccent: '#A78BFA',
  darkSoftAccent: '#262248',
  darkBorder: '#29293D',
  darkBorderLight: '#1C1C2A',
  darkText: '#F5F5FA',
  darkTextSecondary: '#9494B3',
  darkTextTertiary: '#626280',
});

const SolarisAmberPair = buildThemePair({
  lightBg: '#FFFDF7',
  lightElevated: '#FBF4E4',
  lightPrimary: '#D97706',
  lightPrimaryMuted: 'rgba(217, 119, 6, 0.11)',
  lightAccent: '#F59E0B',
  lightSoftAccent: '#FEF3C7',
  lightBorder: '#EEDCBE',
  lightBorderLight: '#F7EDDC',
  lightText: '#261C08',
  lightTextSecondary: '#6B542B',
  lightTextTertiary: '#AA9063',
  darkBg: '#120E08',
  darkSurface: '#1C170E',
  darkElevated: '#272014',
  darkPrimary: '#FBBF24',
  darkPrimaryMuted: 'rgba(251, 191, 36, 0.18)',
  darkOnPrimary: '#140E04',
  darkAccent: '#FDE68A',
  darkSoftAccent: '#33230A',
  darkBorder: '#382B14',
  darkBorderLight: '#261C0D',
  darkText: '#FEF9EE',
  darkTextSecondary: '#B8A179',
  darkTextTertiary: '#7C6949',
});

const MonolithOnyxPair = buildThemePair({
  lightBg: '#FAFAFA',
  lightElevated: '#F0F0F0',
  lightPrimary: '#111827',
  lightPrimaryMuted: 'rgba(17, 24, 39, 0.08)',
  lightAccent: '#374151',
  lightSoftAccent: '#E5E7EB',
  lightBorder: '#E5E7EB',
  lightBorderLight: '#F3F4F6',
  lightText: '#111827',
  lightTextSecondary: '#4B5563',
  lightTextTertiary: '#9CA3AF',
  darkBg: '#09090B',
  darkSurface: '#141417',
  darkElevated: '#202024',
  darkPrimary: '#FAFAFA',
  darkPrimaryMuted: 'rgba(250, 250, 250, 0.15)',
  darkOnPrimary: '#09090B',
  darkAccent: '#D4D4D8',
  darkSoftAccent: '#27272A',
  darkBorder: '#27272A',
  darkBorderLight: '#18181B',
  darkText: '#FAFAFA',
  darkTextSecondary: '#A1A1AA',
  darkTextTertiary: '#71717A',
});

const NordicFrostPair = buildThemePair({
  lightBg: '#F3F6F8',
  lightElevated: '#E8EDF1',
  lightPrimary: '#1E4E63',
  lightPrimaryMuted: 'rgba(30, 78, 99, 0.11)',
  lightAccent: '#3A7087',
  lightSoftAccent: '#E3ECF0',
  lightBorder: '#D7E0E6',
  lightBorderLight: '#E8EEF2',
  lightText: '#101B22',
  lightTextSecondary: '#4A5D68',
  lightTextTertiary: '#8799A5',
  darkBg: '#090F13',
  darkSurface: '#10181E',
  darkElevated: '#17232B',
  darkPrimary: '#64AEC9',
  darkPrimaryMuted: 'rgba(100, 174, 201, 0.17)',
  darkOnPrimary: '#081217',
  darkAccent: '#86C7DE',
  darkSoftAccent: '#172731',
  darkBorder: '#1F313B',
  darkBorderLight: '#16232B',
  darkText: '#F2F6F8',
  darkTextSecondary: '#8CA2AF',
  darkTextTertiary: '#5C717E',
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
  'claude-terracotta': ClaudeTerracottaPair,
  'gemini-celestial': GeminiCelestialPair,
  'chatgpt-emerald': ChatGPTEmeraldPair,
  'linear-violet': LinearVioletPair,
  'solaris-amber': SolarisAmberPair,
  'monolith-onyx': MonolithOnyxPair,
  'nordic-frost': NordicFrostPair,
};

export const getThemeColors = (themeName: ThemeName, isDark: boolean): ThemeColors => {
  const selectedTheme = THEMES[themeName] || THEMES['midnight-indigo'];
  return isDark ? selectedTheme.dark : selectedTheme.light;
};

// Backwards-compatible defaults
export const LightColors: ThemeColors = MidnightIndigoLight;
export const DarkColors: ThemeColors = MidnightIndigoDark;
