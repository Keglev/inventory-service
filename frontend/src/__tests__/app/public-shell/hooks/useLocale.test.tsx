/**
 * @file useLocale.test.ts
 * @module __tests__/app/public-shell/hooks/useLocale
 * @description
 * Tests for the useLocale hook.
 *
 * Scope:
 * - Initializes locale from localStorage or i18n resolved language
 * - Normalizes locales (e.g., "en-US" -> "en")
 * - Exposes changeLocale and toggleLocale helpers
 * - Subscribes/unsubscribes to i18n "languageChanged" events
 *
 * Out of scope:
 * - i18next internal behavior and return types of changeLanguage()
 * - toast/UI side effects
 */

import { renderHook, act } from '@testing-library/react';
import type { i18n } from 'i18next';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLocale } from '@/app/public-shell/hooks/useLocale';

type Listener = (lng: string) => void;

/**
 * Minimal i18n surface used by the hook.
 * We avoid binding to the full i18next types because changeLanguage()
 * can be typed differently depending on i18next/react-i18next versions.
 */
type LocaleI18n = {
  resolvedLanguage?: string;
  changeLanguage: (lng?: string) => Promise<unknown>;
  on: (event: string, cb: Listener) => void;
  off: (event: string, cb: Listener) => void;
};

/**
 * Test double that can emit i18n events.
 */
type FakeI18n = LocaleI18n & {
  emit: (event: string, lng: string) => void;
};

function createFakeI18n(resolvedLanguage = 'de'): FakeI18n {
  const listeners: Record<string, Listener[]> = { languageChanged: [] };

  const api: FakeI18n = {
    resolvedLanguage,

    changeLanguage: vi.fn(async (lng?: string) => {
      const next = lng ?? 'de';
      api.resolvedLanguage = next;

      // i18n usually emits languageChanged; we simulate that behavior.
      listeners.languageChanged.forEach((fn) => fn(next));

      // Hook does not consume the resolved return type, so unknown is sufficient.
      return undefined;
    }),

    on: vi.fn((event: string, cb: Listener) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
    }),

    off: vi.fn((event: string, cb: Listener) => {
      listeners[event] = (listeners[event] || []).filter((fn) => fn !== cb);
    }),

    emit(event: string, lng: string) {
      (listeners[event] || []).forEach((fn) => fn(lng));
    },
  };

  return api;
}

describe('useLocale', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes from localStorage when present', () => {
    // Business rule: persisted user choice wins over i18n resolved language.
    localStorage.setItem('i18nextLng', 'en');
    const fake = createFakeI18n('de');

    const { result } = renderHook(() => useLocale(fake as unknown as i18n));

    expect(result.current.locale).toBe('en');
  });

  it('normalizes resolved language when storage is empty', () => {
    // Example: "en-US" should be normalized to "en" for the app locale.
    const fake = createFakeI18n('en-US');

    const { result } = renderHook(() => useLocale(fake as unknown as i18n));

    expect(result.current.locale).toBe('en');
  });

  it('changeLocale updates state, storage, and calls i18n.changeLanguage', () => {
    // Contract: changeLocale updates UI state + persistence + underlying i18n engine.
    const fake = createFakeI18n('de');
    const { result } = renderHook(() => useLocale(fake as unknown as i18n));

    act(() => {
      result.current.changeLocale('en');
    });

    expect(result.current.locale).toBe('en');
    expect(localStorage.getItem('i18nextLng')).toBe('en');
    expect(fake.changeLanguage).toHaveBeenCalledWith('en');
  });

  it('toggleLocale flips between supported locales and persists', () => {
    // Contract: toggleLocale flips de <-> en and persists the resulting value.
    const fake = createFakeI18n('de');
    const { result } = renderHook(() => useLocale(fake as unknown as i18n));

    act(() => {
      result.current.toggleLocale();
    });

    expect(result.current.locale).toBe('en');
    expect(localStorage.getItem('i18nextLng')).toBe('en');
  });

  it('updates when i18n emits languageChanged', () => {
    // Hook must react to external language changes.
    const fake = createFakeI18n('de');
    const { result } = renderHook(() => useLocale(fake as unknown as i18n));

    act(() => {
      fake.emit('languageChanged', 'en');
    });

    expect(result.current.locale).toBe('en');
  });

  it('subscribes on mount and unsubscribes on unmount', () => {
    // Resource contract: no listener leaks across hook lifecycles.
    const fake = createFakeI18n('de');

    const { unmount } = renderHook(() => useLocale(fake as unknown as i18n));

    expect(fake.on).toHaveBeenCalledWith('languageChanged', expect.any(Function));

    unmount();

    expect(fake.off).toHaveBeenCalledWith('languageChanged', expect.any(Function));
  });
});
