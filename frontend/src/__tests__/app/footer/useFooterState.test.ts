/**
 * @file useFooterState.test.ts
 * @module tests/app/footer/useFooterState
 * @what_is_under_test useFooterState
 * @responsibility
 * Guarantees the footer data composition: health passthrough from
 * useHealthCheck and config assembly from appMeta + live i18n language.
 * @out_of_scope
 * Health polling internals (features/health); appMeta build-time injection.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
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

vi.mock('@/config/appMeta', () => ({
  APP_VERSION: '1.0.0',
  BUILD_ID: '4a9c12f',
  APP_ENVIRONMENT: 'Production (Koyeb)',
}));

type I18nLike = { language: string; changeLanguage: () => void };

type Health = {
  status: 'online' | 'offline';
  responseTime: number;
  database: 'online' | 'offline';
};

describe('useFooterState', () => {
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

  it('passes health state through from useHealthCheck', () => {
    const health: Health = { status: 'offline', responseTime: 0, database: 'offline' };
    setHealth(health);

    const { result } = renderHook(() => useFooterState());

    expect(result.current.health).toEqual(health);
  });

  it('assembles config from appMeta constants', () => {
    const { result } = renderHook(() => useFooterState());

    expect(result.current.config.appVersion).toBe('1.0.0');
    expect(result.current.config.buildId).toBe('4a9c12f');
    expect(result.current.config.environment).toBe('Production (Koyeb)');
    expect(result.current.config.region).toBe('DE');
  });

  it('derives currentLanguage from the live i18n language', () => {
    setI18nLanguage('de-DE');

    const { result } = renderHook(() => useFooterState());

    expect(result.current.config.currentLanguage).toBe('DE');
  });

  it('normalizes region-less language codes', () => {
    setI18nLanguage('en');

    const { result } = renderHook(() => useFooterState());

    expect(result.current.config.currentLanguage).toBe('EN');
  });
});
