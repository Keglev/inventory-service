/**
 * @file useShellSettings.test.tsx
 * @module __tests__/app/layout/useShellSettings
 * @description Locale + theme-mode state for the authenticated shell.
 *
 * Contract under test:
 * - Theme mode initializes from localStorage and defaults to light.
 * - Changing the mode persists, notifies (dark/light message variants),
 *   and re-selecting the current mode is a silent no-op.
 * - Locale changes persist, propagate to i18n, and notify.
 * - i18n languageChanged events keep the locale state in sync.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

type LanguageHandler = (lng: string) => void;
const i18nHandlers: LanguageHandler[] = [];
const changeLanguage = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      resolvedLanguage: 'de',
      changeLanguage,
      on: (event: string, handler: LanguageHandler) => {
        if (event === 'languageChanged') i18nHandlers.push(handler);
      },
      off: vi.fn(),
    },
  }),
}));

import { useShellSettings } from '../../../app/layout/useShellSettings';

describe('useShellSettings', () => {
  const notify = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    notify.mockClear();
    changeLanguage.mockClear();
    i18nHandlers.length = 0;
  });

  it('initializes theme mode from localStorage', () => {
    localStorage.setItem('themeMode', 'dark');

    const { result } = renderHook(() => useShellSettings(notify));

    expect(result.current.themeMode).toBe('dark');
  });

  it('defaults to light mode and the i18n locale without stored values', () => {
    const { result } = renderHook(() => useShellSettings(notify));

    expect(result.current.themeMode).toBe('light');
    expect(result.current.locale).toBe('de');
    expect(result.current.theme).toBeTruthy();
  });

  it('persists and notifies on a dark-mode switch', () => {
    const { result } = renderHook(() => useShellSettings(notify));

    act(() => {
      result.current.handleThemeModeChange('dark');
    });

    expect(result.current.themeMode).toBe('dark');
    expect(localStorage.getItem('themeMode')).toBe('dark');
    expect(notify).toHaveBeenCalledWith('common:shell.darkModeEnabled', 'info');
  });

  it('notifies with the light variant when switching back', () => {
    localStorage.setItem('themeMode', 'dark');
    const { result } = renderHook(() => useShellSettings(notify));

    act(() => {
      result.current.handleThemeModeChange('light');
    });

    expect(notify).toHaveBeenCalledWith('common:shell.lightModeEnabled', 'info');
  });

  it('treats re-selecting the current mode as a silent no-op', () => {
    const { result } = renderHook(() => useShellSettings(notify));

    act(() => {
      result.current.handleThemeModeChange('light');
    });

    expect(notify).not.toHaveBeenCalled();
    expect(localStorage.getItem('themeMode')).toBeNull();
  });

  it('persists, propagates, and notifies on locale change', () => {
    const { result } = renderHook(() => useShellSettings(notify));

    act(() => {
      result.current.handleLocaleChange('en');
    });

    expect(result.current.locale).toBe('en');
    expect(localStorage.getItem('i18nextLng')).toBe('en');
    expect(changeLanguage).toHaveBeenCalledWith('en');
    expect(notify).toHaveBeenCalledWith('common:shell.languageChanged', 'info');
  });

  it('follows external i18n language changes', () => {
    const { result } = renderHook(() => useShellSettings(notify));

    act(() => {
      for (const handler of i18nHandlers) handler('en-US');
    });

    expect(result.current.locale).toBe('en');
  });
});
