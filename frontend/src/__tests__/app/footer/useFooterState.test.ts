/**
 * @file useFooterState.test.ts
 * @module __tests__/app/footer/useFooterState
 * @description Tests for footer state management hook.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFooterState } from '../../../app/footer/useFooterState';

// Hoisted mocks
const mockUseTranslation = vi.hoisted(() => vi.fn());
const mockUseHealthCheck = vi.hoisted(() => vi.fn());

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

// Mock health feature
vi.mock('../../../features/health', () => ({
  useHealthCheck: mockUseHealthCheck,
}));

describe('useFooterState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { language: 'en-US', changeLanguage: vi.fn() },
    });
    mockUseHealthCheck.mockReturnValue({
      health: { status: 'online', responseTime: 125, database: 'online' },
    });
  });

  it('returns initial state with details closed', () => {
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

  it('returns health status from useHealthCheck', () => {
    const { result } = renderHook(() => useFooterState());
    expect(result.current.health).toEqual({
      status: 'online',
      responseTime: 125,
      database: 'online',
    });
  });

  it('returns config with app version', () => {
    const { result } = renderHook(() => useFooterState());
    expect(result.current.config.appVersion).toBe('1.0.0');
  });

  it('returns config with build ID', () => {
    const { result } = renderHook(() => useFooterState());
    expect(result.current.config.buildId).toBe('4a9c12f');
  });

  it('returns config with environment', () => {
    const { result } = renderHook(() => useFooterState());
    expect(result.current.config.environment).toBe('Production (Koyeb)');
  });

  it('extracts current language from i18n', () => {
    mockUseTranslation.mockReturnValue({
      t: vi.fn(),
      i18n: { language: 'en-US', changeLanguage: vi.fn() },
    });

    const { result } = renderHook(() => useFooterState());
    expect(result.current.config.currentLanguage).toBe('EN');
  });

  it('extracts language code from different locale', () => {
    mockUseTranslation.mockReturnValue({
      t: vi.fn(),
      i18n: { language: 'de-DE', changeLanguage: vi.fn() },
    });

    const { result } = renderHook(() => useFooterState());
    expect(result.current.config.currentLanguage).toBe('DE');
  });

  it('returns region code', () => {
    const { result } = renderHook(() => useFooterState());
    expect(result.current.config.region).toBe('DE');
  });

  it('handles offline health status', () => {
    mockUseHealthCheck.mockReturnValue({
      health: { status: 'offline', responseTime: 0, database: 'offline' },
    });

    const { result } = renderHook(() => useFooterState());
    expect(result.current.health.status).toBe('offline');
    expect(result.current.health.database).toBe('offline');
  });

  it('handles multiple toggle calls', () => {
    const { result } = renderHook(() => useFooterState());

    act(() => {
      result.current.toggleDetails();
      result.current.toggleDetails();
      result.current.toggleDetails();
    });

    expect(result.current.detailsOpen).toBe(true);
  });
});
