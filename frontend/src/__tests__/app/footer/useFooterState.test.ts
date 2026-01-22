/**
 * @file useFooterState.test.ts
 * @module __tests__/app/footer
 *
 * @description
 * Unit tests for `useFooterState` — footer state + metadata composition hook.
 *
 * Responsibilities of the hook:
 * - Manage UI state (details panel open/closed) via `detailsOpen` + `toggleDetails`.
 * - Compose runtime health information from `useHealthCheck`.
 * - Expose build/runtime metadata (version/build/environment).
 * - Derive localization info (language + region) from i18n state.
 *
 * Test strategy:
 * - Treat the hook as a small "composition layer": verify it passes through data from
 *   dependent hooks and formats it into a UI-friendly config object.
 * - Mock external dependencies (i18n, health) to keep tests deterministic.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFooterState } from '../../../app/footer/useFooterState';

// -----------------------------------------------------------------------------
// Hoisted mocks (must exist before vi.mock factory runs)
// -----------------------------------------------------------------------------
const mockUseTranslation = vi.hoisted(() => vi.fn());
const mockUseHealthCheck = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

vi.mock('../../../features/health', () => ({
  useHealthCheck: mockUseHealthCheck,
}));

type I18nLike = { language: string; changeLanguage: () => void };

type Health = {
  status: 'online' | 'offline';
  responseTime: number;
  database: 'online' | 'offline';
};

describe('useFooterState', () => {
  /**
   * Scenario helpers to reduce duplication and make intent explicit.
   * These create deterministic dependency outputs for the hook under test.
   */
  const setI18nLanguage = (language: string) => {
    const i18n: I18nLike = { language, changeLanguage: vi.fn() };
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n,
    });
  };

  const setHealth = (health: Health) => {
    mockUseHealthCheck.mockReturnValue({ health });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default scenario: production-like metadata + healthy services.
    setI18nLanguage('en-US');
    setHealth({ status: 'online', responseTime: 125, database: 'online' });
  });

  // ---------------------------------------------------------------------------
  // UI state: details toggle
  // ---------------------------------------------------------------------------
  it('returns initial state with details closed', () => {
    // Baseline: the footer details panel is collapsed on initial render.
    const { result } = renderHook(() => useFooterState());
    expect(result.current.detailsOpen).toBe(false);
  });

  it('toggles details open and closed', () => {
    const { result } = renderHook(() => useFooterState());

    act(() => {
      result.current.toggleDetails();
    });
    expect(result.current.detailsOpen).toBe(true);

    act(() => {
      result.current.toggleDetails();
    });
    expect(result.current.detailsOpen).toBe(false);
  });

  it('handles multiple toggle calls (state is consistent)', () => {
    const { result } = renderHook(() => useFooterState());

    // Multiple toggles in one act() is a common UI pattern (rapid user interactions).
    act(() => {
      result.current.toggleDetails();
      result.current.toggleDetails();
      result.current.toggleDetails();
    });

    // Odd number of toggles => final state should be open.
    expect(result.current.detailsOpen).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Health composition
  // ---------------------------------------------------------------------------
  it('exposes health status from useHealthCheck', () => {
    const { result } = renderHook(() => useFooterState());

    expect(result.current.health).toEqual({
      status: 'online',
      responseTime: 125,
      database: 'online',
    });
  });

  it('supports offline health status', () => {
    setHealth({ status: 'offline', responseTime: 0, database: 'offline' });

    const { result } = renderHook(() => useFooterState());

    expect(result.current.health.status).toBe('offline');
    expect(result.current.health.database).toBe('offline');
  });

  // ---------------------------------------------------------------------------
  // Config composition (version/build/environment + locale)
  // ---------------------------------------------------------------------------
  it('returns build/runtime config metadata', () => {
    // These values are typically injected via build-time env/config.
    // This test acts as a regression guard: the hook must expose them for the footer UI.
    const { result } = renderHook(() => useFooterState());

    expect(result.current.config).toMatchObject({
      appVersion: '1.0.0',
      buildId: '4a9c12f',
      environment: 'Production (Koyeb)',
      region: 'DE',
    });
  });

  it('derives current language code from i18n locale (en-US => EN)', () => {
    setI18nLanguage('en-US');

    const { result } = renderHook(() => useFooterState());
    expect(result.current.config.currentLanguage).toBe('EN');
  });

  it('derives current language code from i18n locale (de-DE => DE)', () => {
    setI18nLanguage('de-DE');

    const { result } = renderHook(() => useFooterState());
    expect(result.current.config.currentLanguage).toBe('DE');
  });
});
