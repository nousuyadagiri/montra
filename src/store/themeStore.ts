import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Appearance, ColorSchemeName } from 'react-native';
import { getThemeColors, ThemeColors, ThemeName } from '../theme/colors';

export type ThemeMode = 'system' | 'dark' | 'light';

interface ThemeState {
  mode: ThemeMode;
  themePalette: ThemeName;
  systemScheme: ColorSchemeName;
  colors: ThemeColors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  setThemePalette: (palette: ThemeName) => Promise<void>;
  updateSystemScheme: (scheme: ColorSchemeName) => void;
  loadPersistedTheme: () => Promise<void>;
}

const THEME_MODE_KEY = 'montra_theme_mode';
const THEME_PALETTE_KEY = 'montra_theme_palette';

const resolveColors = (
  mode: ThemeMode,
  systemScheme: ColorSchemeName,
  palette: ThemeName
): { colors: ThemeColors; isDark: boolean } => {
  const activeMode = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const isDark = activeMode === 'dark';
  return {
    colors: getThemeColors(palette, isDark),
    isDark,
  };
};

const initialScheme: ColorSchemeName = Appearance.getColorScheme() || 'dark';
const defaultPalette: ThemeName = 'midnight-indigo';
const initialResolved = resolveColors('system', initialScheme, defaultPalette);

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  themePalette: defaultPalette,
  systemScheme: initialScheme,
  colors: initialResolved.colors,
  isDark: initialResolved.isDark,

  setMode: async (mode: ThemeMode) => {
    try {
      await SecureStore.setItemAsync(THEME_MODE_KEY, mode);
    } catch {
      // fallback
    }
    const { systemScheme, themePalette } = get();
    const { colors, isDark } = resolveColors(mode, systemScheme, themePalette);
    set({ mode, colors, isDark });
  },

  setThemePalette: async (palette: ThemeName) => {
    try {
      await SecureStore.setItemAsync(THEME_PALETTE_KEY, palette);
    } catch {
      // fallback
    }
    const { mode, systemScheme } = get();
    const { colors, isDark } = resolveColors(mode, systemScheme, palette);
    set({ themePalette: palette, colors, isDark });
  },

  updateSystemScheme: (systemScheme: ColorSchemeName) => {
    const { mode, themePalette } = get();
    const resolvedScheme = systemScheme || 'dark';
    const { colors, isDark } = resolveColors(mode, resolvedScheme, themePalette);
    set({ systemScheme: resolvedScheme, colors, isDark });
  },

  loadPersistedTheme: async () => {
    try {
      let savedMode = (await SecureStore.getItemAsync(THEME_MODE_KEY)) as ThemeMode | null;
      let savedPalette = (await SecureStore.getItemAsync(THEME_PALETTE_KEY)) as ThemeName | null;

      const validModes: ThemeMode[] = ['dark', 'light', 'system'];
      const validPalettes: ThemeName[] = [
        'midnight-indigo',
        'warm-sand',
        'slate-blue',
        'forest-sage',
        'royal-violet',
        'crimson-rose',
        'aurora-teal',
        'sunset-gold',
        'nordic-mono',
      ];

      const activeMode = savedMode && validModes.includes(savedMode) ? savedMode : 'system';
      const activePalette = savedPalette && validPalettes.includes(savedPalette) ? savedPalette : 'midnight-indigo';

      const { systemScheme } = get();
      const { colors, isDark } = resolveColors(activeMode, systemScheme, activePalette);

      set({
        mode: activeMode,
        themePalette: activePalette,
        colors,
        isDark,
      });
    } catch {
      // ignore
    }
  },
}));

export const useAppTheme = () => {
  const colors = useThemeStore((s) => s.colors);
  const isDark = useThemeStore((s) => s.isDark);
  const mode = useThemeStore((s) => s.mode);
  const themePalette = useThemeStore((s) => s.themePalette);
  const setMode = useThemeStore((s) => s.setMode);
  const setThemePalette = useThemeStore((s) => s.setThemePalette);

  return {
    colors,
    isDark,
    mode,
    themePalette,
    setMode,
    setThemePalette,
  };
};
