/**
 * @file systemInfo.test.ts
 * @module tests/unit/utils/systemInfo
 * @what_is_under_test getSystemInfo
 * @responsibility
 * Guarantees the health-probe contract against the real flat /api/health
 * response: databaseProduct passthrough, build-time environment, status
 * passthrough, and 'unknown' fallbacks for HTTP failure, network failure,
 * and missing fields.
 * @out_of_scope
 * Backend health semantics; SettingsContext consumption.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSystemInfo } from '../../../utils/systemInfo';

vi.mock('@/config/appMeta', () => ({
  APP_ENVIRONMENT: 'Production (Koyeb)',
}));

vi.mock('../../../utils/logger', () => ({
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

const fetchMock = vi.fn();

describe('getSystemInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const okResponse = (body: unknown) => ({
    ok: true,
    json: async () => body,
  });

  it('returns the backend databaseProduct and build-time environment', async () => {
    fetchMock.mockResolvedValue(
      okResponse({ status: 'ok', database: 'ok', databaseProduct: 'Oracle', timestamp: 1 })
    );

    const info = await getSystemInfo();

    expect(info).toEqual({
      database: 'Oracle',
      environment: 'Production (Koyeb)',
      status: 'ok',
    });
  });

  it('falls back to unknown database when databaseProduct is missing', async () => {
    fetchMock.mockResolvedValue(okResponse({ status: 'ok', database: 'ok', timestamp: 1 }));

    const info = await getSystemInfo();

    expect(info.database).toBe('unknown');
    expect(info.environment).toBe('Production (Koyeb)');
    expect(info.status).toBe('ok');
  });

  it('returns the fallback on non-OK HTTP status', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });

    const info = await getSystemInfo();

    expect(info).toEqual({
      database: 'unknown',
      environment: 'Production (Koyeb)',
      status: 'unknown',
    });
  });

  it('returns the fallback on network failure', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    const info = await getSystemInfo();

    expect(info).toEqual({
      database: 'unknown',
      environment: 'Production (Koyeb)',
      status: 'unknown',
    });
  });
});
