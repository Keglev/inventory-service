/**
 * @file ShellPreferencesContext.test.tsx
 * @module __tests__/context/shellPreferences/ShellPreferencesContext
 * @testing Vitest + React Testing Library (renderHook with the provider as wrapper)
 * @description
 * Contract of ShellPreferencesProvider, read through useShellPreferences:
 * - Locale initialises from localStorage, else the normalised i18n language, else German.
 * - setLocale persists, updates state and switches i18next; languageChanged events keep state in sync;
 *   the listener is removed on unmount.
 * - Theme mode initialises from localStorage (only 'dark' selects dark), defaults to light,
 *   and setThemeMode persists; the MUI theme follows the mode.
 * - The hook throws outside the provider.
 * Carries over the cases of the removed public-shell useLocale/useThemeMode specs.
 */
import * as React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

type Listener = (lng: string) => void;

const fake = vi.hoisted(() => {
  const listeners: Array<(lng: string) => void> = [];
  const api = {
    resolvedLanguage: 'de' as string | undefined,
    listeners,
    changeLanguage: vi.fn(async (lng?: string) => {
      api.resolvedLanguage = lng;
      listeners.forEach((fn) => fn(lng ?? 'de'));
    }),
    on: vi.fn((_event: string, cb: (lng: string) => void) => {
      listeners.push(cb);
    }),
    off: vi.fn((_event: string, cb: (lng: string) => void) => {
      const i = listeners.indexOf(cb);
      if (i >= 0) listeners.splice(i, 1);
    }),
  };
  return api;
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: fake }),
}));

import { ShellPreferencesProvider } from '@/context/shellPreferences/ShellPreferencesContext';
import { useShellPreferences } from '@/hooks/useShellPreferences';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ShellPreferencesProvider>{children}</ShellPreferencesProvider>
);

const renderPrefs = () => renderHook(() => useShellPreferences(), { wrapper });

describe('ShellPreferencesProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    fake.resolvedLanguage = 'de';
    fake.listeners.length = 0;
  });

  describe('locale', () => {
    it('initialises from localStorage when a language is stored', () => {
      // Business rule: the persisted choice wins over the i18n resolved language.
      localStorage.setItem('i18nextLng', 'en');
      const { result } = renderPrefs();
      expect(result.current.locale).toBe('en');
    });

    it('normalises the resolved language when storage is empty', () => {
      fake.resolvedLanguage = 'en-US';
      const { result } = renderPrefs();
      expect(result.current.locale).toBe('en');
    });

    it('falls back to German when neither storage nor i18n give a language', () => {
      fake.resolvedLanguage = undefined;
      const { result } = renderPrefs();
      expect(result.current.locale).toBe('de');
    });

    it('persists, updates state and switches i18next when setLocale is called', async () => {
      const { result } = renderPrefs();
      await act(async () => {
        await result.current.setLocale('en');
      });
      expect(result.current.locale).toBe('en');
      expect(localStorage.getItem('i18nextLng')).toBe('en');
      expect(fake.changeLanguage).toHaveBeenCalledWith('en');
    });

    it('follows languageChanged events from i18next', () => {
      const { result } = renderPrefs();
      act(() => {
        fake.listeners.forEach((fn: Listener) => fn('en-GB'));
      });
      expect(result.current.locale).toBe('en');
    });

    it('subscribes on mount and unsubscribes on unmount', () => {
      const { unmount } = renderPrefs();
      expect(fake.on).toHaveBeenCalledWith('languageChanged', expect.any(Function));
      const handler = fake.on.mock.calls[0][1];
      unmount();
      expect(fake.off).toHaveBeenCalledWith('languageChanged', handler);
      expect(fake.listeners).toHaveLength(0);
    });
  });

  describe('theme mode', () => {
    it('defaults to light when storage is empty', () => {
      const { result } = renderPrefs();
      expect(result.current.themeMode).toBe('light');
      expect(result.current.theme.palette.mode).toBe('light');
    });

    it('initialises from the stored theme mode', () => {
      localStorage.setItem('themeMode', 'dark');
      const { result } = renderPrefs();
      expect(result.current.themeMode).toBe('dark');
    });

    it('falls back to light when the stored value is not a known mode', () => {
      // The removed hooks passed any stored string through to buildTheme.
      localStorage.setItem('themeMode', 'sepia');
      const { result } = renderPrefs();
      expect(result.current.themeMode).toBe('light');
    });

    it('persists, updates state and rebuilds the theme when setThemeMode is called', () => {
      const { result } = renderPrefs();
      act(() => {
        result.current.setThemeMode('dark');
      });
      expect(result.current.themeMode).toBe('dark');
      expect(localStorage.getItem('themeMode')).toBe('dark');
      expect(result.current.theme.palette.mode).toBe('dark');
    });
  });

  it('throws when useShellPreferences is used outside the provider', () => {
    // React logs the render error; silence it so the CI log stays readable.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useShellPreferences())).toThrow(
      'useShellPreferences must be used within the corresponding provider',
    );
    spy.mockRestore();
  });
});
