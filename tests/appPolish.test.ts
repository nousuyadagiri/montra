import { THEME_OPTIONS, THEMES, getThemeColors } from '../src/theme/colors';
import { getErrorMessage } from '../src/utils/errors';
import { toast, useToastStore } from '../src/store/toastStore';

describe('Theme palettes', () => {
  it('provides 9 curated minimalist themes including Electric Indigo, Oceanic Slate, and Aurora Teal with light and dark tokens', () => {
    expect(THEME_OPTIONS).toHaveLength(9);
    const names = THEME_OPTIONS.map((o) => o.name);
    expect(names).toEqual(
      expect.arrayContaining(['Electric Indigo', 'Oceanic Slate', 'Aurora Teal'])
    );
    expect(new Set(THEME_OPTIONS.map((o) => o.id)).size).toBe(THEME_OPTIONS.length);

    for (const option of THEME_OPTIONS) {
      expect(THEMES[option.id]).toBeDefined();
      const light = getThemeColors(option.id, false);
      const dark = getThemeColors(option.id, true);
      expect(light.background).toBeTruthy();
      expect(dark.background).toBeTruthy();
      expect(light.primary).toBeTruthy();
      expect(dark.primary).toBeTruthy();
      expect(light.onPrimary).toBeTruthy();
      expect(dark.onPrimary).toBeTruthy();
    }
  });
});

describe('getErrorMessage', () => {
  it('maps Postgres RLS and FK codes to friendly messages', () => {
    expect(getErrorMessage({ code: '42P17', message: 'infinite recursion detected' })).toMatch(
      /permission policy/i
    );
    expect(getErrorMessage({ code: '23503', message: 'foreign key violation' })).toMatch(
      /profile record/i
    );
    expect(getErrorMessage({ message: 'Network request failed' })).toMatch(/internet connection/i);
    expect(getErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
  });
});

describe('toastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ current: null, queue: [] });
  });

  it('shows and queues toast notifications cleanly and avoids identical duplicate stacking', () => {
    toast.success('Group created!', 'Success');
    expect(useToastStore.getState().current?.variant).toBe('success');
    expect(useToastStore.getState().current?.message).toBe('Group created!');

    // Identical duplicate does not bloat queue
    toast.success('Group created!', 'Success');
    expect(useToastStore.getState().queue).toHaveLength(0);

    // Different toast queues cleanly and advances on dismiss
    toast.error('Network unavailable');
    expect(useToastStore.getState().queue).toHaveLength(1);

    toast.dismiss();
    expect(useToastStore.getState().current?.variant).toBe('error');
    expect(useToastStore.getState().queue).toHaveLength(0);

    toast.dismiss();
    expect(useToastStore.getState().current).toBeNull();
  });
});

