import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Appearance, ColorSchemeName } from 'react-native';
import { DarkColors, LightColors, ThemeColors } from '../theme/colors';

export type ThemeMode = 'system' | 'dark' | 'light';

interface ThemeState {
  mode: ThemeMode;
  systemScheme: ColorSchemeName;
  colors: ThemeColors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  updateSystemScheme: (scheme: ColorSchemeName) => void;
  loadPersistedTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = 'montra_theme_mode';

const resolveColors = (mode: ThemeMode, systemScheme: ColorSchemeName): { colors: ThemeColors; isDark: boolean } => {
  const activeMode = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const isDark = activeMode === 'dark';
  return {
    colors: isDark ? DarkColors : LightColors,
    isDark,
  };
};

const initialScheme: ColorSchemeName = Appearance.getColorScheme() || 'dark';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  systemScheme: initialScheme,
  colors: initialScheme === 'light' ? LightColors : DarkColors,
  isDark: initialScheme !== 'light',

  setMode: async (mode: ThemeMode) => {
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
    } catch {
      // fallback
    }
    const { systemScheme } = get();
    const { colors, isDark } = resolveColors(mode, systemScheme);
    set({ mode, colors, isDark });
  },

  updateSystemScheme: (systemScheme: ColorSchemeName) => {
    const { mode } = get();
    const resolvedScheme = systemScheme || 'dark';
    const { colors, isDark } = resolveColors(mode, resolvedScheme);
    set({ systemScheme: resolvedScheme, colors, isDark });
  },

  loadPersistedTheme: async () => {
    try {
      const saved = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        const { systemScheme } = get();
        const { colors, isDark } = resolveColors(saved, systemScheme);
        set({ mode: saved, colors, isDark });
      }
    } catch {
      // ignore
    }
  },
}));

export const useAppTheme = () => {
  const colors = useThemeStore((s) => s.colors);
  const isDark = useThemeStore((s) => s.isDark);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  return { colors, isDark, mode, setMode };
};
