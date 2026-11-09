export interface ThemeColors {
  background: string;
  surface: string;
  elevatedSurface: string;
  primary: string;
  primaryMuted: string;
  secondary: string;
  secondaryMuted: string;
  mainText: string;
  secondaryText: string;
  tertiaryText: string;
  border: string;
  borderLight: string;
  error: string;
  errorMuted: string;
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  overlay: string;
  cardGradientStart: string;
  cardGradientEnd: string;
}

export const DarkColors: ThemeColors = {
  background: '#0B0F14',
  surface: '#121923',
  elevatedSurface: '#19232F',
  primary: '#A3E635',
  primaryMuted: 'rgba(163, 230, 53, 0.15)',
  secondary: '#38BDF8',
  secondaryMuted: 'rgba(56, 189, 248, 0.15)',
  mainText: '#F8FAFC',
  secondaryText: '#94A3B8',
  tertiaryText: '#64748B',
  border: '#1E293B',
  borderLight: '#334155',
  error: '#F87171',
  errorMuted: 'rgba(248, 113, 113, 0.15)',
  success: '#4ADE80',
  successMuted: 'rgba(74, 222, 128, 0.15)',
  warning: '#FBBF24',
  warningMuted: 'rgba(251, 191, 36, 0.15)',
  overlay: 'rgba(0, 0, 0, 0.75)',
  cardGradientStart: '#121923',
  cardGradientEnd: '#19232F',
};

export const LightColors: ThemeColors = {
  background: '#F7F9FC',
  surface: '#FFFFFF',
  elevatedSurface: '#F1F5F9',
  primary: '#4D7C0F',
  primaryMuted: 'rgba(77, 124, 15, 0.12)',
  secondary: '#0284C7',
  secondaryMuted: 'rgba(2, 132, 199, 0.12)',
  mainText: '#172033',
  secondaryText: '#64748B',
  tertiaryText: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#CBD5E1',
  error: '#DC2626',
  errorMuted: 'rgba(220, 38, 38, 0.12)',
  success: '#16A34A',
  successMuted: 'rgba(22, 163, 74, 0.12)',
  warning: '#D97706',
  warningMuted: 'rgba(217, 119, 6, 0.12)',
  overlay: 'rgba(15, 23, 42, 0.5)',
  cardGradientStart: '#FFFFFF',
  cardGradientEnd: '#F8FAFC',
};
