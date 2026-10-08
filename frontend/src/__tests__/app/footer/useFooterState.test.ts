/**
 * @file useFooterState.test.ts
 * @module tests/app/footer/useFooterState
 * @testing Vitest + React Testing Library (renderHook); useHealthCheck and appMeta mocked
 * @description Contract tests for useFooterState.
 *
 * Contract under test:
 * - Health passes through from useHealthCheck.
 * - Config holds the version and build id from appMeta and nothing else:
 *   environment and language left the footer line (FW5 fork 3).
 *
 * Out of scope:
 * - Health polling internals (features/health); appMeta build-time
 *   injection.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFooterState } from '@/app/footer/useFooterState';

const mockUseHealthCheck = vi.hoisted(() => vi.fn());

vi.mock('@/features/health/hooks/useHealthCheck', () => ({
  useHealthCheck: mockUseHealthCheck,
}));

vi.mock('@/config/appMeta', () => ({
  APP_VERSION: '1.0.0',
  BUILD_ID: '4a9c12f',
  APP_ENVIRONMENT: 'Production (Koyeb)',
}));

type Health = {
  status: 'online' | 'offline';
  responseTime: number;
  database: 'online' | 'offline';
  databaseProduct: string | null;
};

describe('useFooterState', () => {
  const setHealth = (health: Health) => {
    mockUseHealthCheck.mockReturnValue({ health, loading: false, refetch: vi.fn() });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setHealth({ status: 'online', responseTime: 125, database: 'online', databaseProduct: 'Oracle' });
  });

  it('passes health state through from useHealthCheck', () => {
    const health: Health = { status: 'offline', responseTime: 0, database: 'offline', databaseProduct: null };
    setHealth(health);

    const { result } = renderHook(() => useFooterState());

    expect(result.current.health).toEqual(health);
  });

  it('assembles config from the appMeta version and build id only', () => {
    const { result } = renderHook(() => useFooterState());

    expect(result.current.config).toEqual({ appVersion: '1.0.0', buildId: '4a9c12f' });
  });
});
