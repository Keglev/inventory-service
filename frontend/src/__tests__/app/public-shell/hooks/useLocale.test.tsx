import { renderHook, act } from '@testing-library/react';
import type { i18n } from 'i18next';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLocale } from '@/app/public-shell/hooks/useLocale';

// Covers locale persistence, normalization, and i18n event wiring.
type FakeI18n = Pick<i18n, 'resolvedLanguage' | 'changeLanguage' | 'on' | 'off' | 't'> & {
  emit: (event: string, lng: string) => void;
};

const createFakeI18n = (resolvedLanguage = 'de'): i18n & { emit: (event: string, lng: string) => void } => {
  const listeners: Record<string, Array<(lng: string) => void>> = { languageChanged: [] };

  const api: FakeI18n = {
    resolvedLanguage,
    // Minimal t impl to satisfy typing; returns key unchanged
    t: vi.fn((key: string) => key) as unknown as FakeI18n['t'],
    changeLanguage: (vi.fn(async (lng?: string) => {
      const next = lng ?? 'de';
      api.resolvedLanguage = next;
      listeners.languageChanged.forEach((fn) => fn(next));
      return api.t as unknown as ReturnType<NonNullable<i18n['changeLanguage']>>;
    }) as unknown) as FakeI18n['changeLanguage'],
    on: (vi.fn((event: string, cb: (lng: string) => void) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
    }) as unknown) as FakeI18n['on'],
    off: (vi.fn((event: string, cb: (lng: string) => void) => {
      listeners[event] = (listeners[event] || []).filter((fn) => fn !== cb);
    }) as unknown) as FakeI18n['off'],
    emit(event: string, lng: string) {
      (listeners[event] || []).forEach((fn) => fn(lng));
    },
  };

  return api as unknown as i18n & { emit: (event: string, lng: string) => void };
};

describe('useLocale', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initializes from localStorage when present', () => {
    // Ensure stored choice wins over resolved language.
    localStorage.setItem('i18nextLng', 'en');
    const i18n = createFakeI18n('de');

    const { result } = renderHook(() => useLocale(i18n));

    expect(result.current.locale).toBe('en');
  });

  it('normalizes resolved language when storage is empty', () => {
    // Should derive "en" from en-US fallback.
    const i18n = createFakeI18n('en-US');

    const { result } = renderHook(() => useLocale(i18n));

    expect(result.current.locale).toBe('en');
  });

  it('changeLocale updates state, storage, and i18n', () => {
    // Verify downstream side effects fire together.
    const i18n = createFakeI18n('de');
    const { result } = renderHook(() => useLocale(i18n));

    act(() => {
      result.current.changeLocale('en');
    });

    expect(result.current.locale).toBe('en');
    expect(localStorage.getItem('i18nextLng')).toBe('en');
    expect(i18n.changeLanguage).toHaveBeenCalledWith('en');
  });

  it('toggleLocale flips and persists', () => {
    // Toggle should move de -> en and persist the new value.
    const i18n = createFakeI18n('de');
    const { result } = renderHook(() => useLocale(i18n));

    act(() => {
      result.current.toggleLocale();
    });

    expect(result.current.locale).toBe('en');
    expect(localStorage.getItem('i18nextLng')).toBe('en');
  });

  it('updates when i18n emits languageChanged', () => {
    // React to external language changes.
    const i18n = createFakeI18n('de');
    const { result } = renderHook(() => useLocale(i18n));

    act(() => {
      i18n.emit('languageChanged', 'en');
    });

    expect(result.current.locale).toBe('en');
  });
});
