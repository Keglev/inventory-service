/**
 * @file systemInfo.test.ts
 * @module tests/unit/utils/systemInfo
 * @what_is_under_test getSystemInfo
 * @responsibility
 * Guarantees system info helpers translate the health endpoint response into a stable UI-friendly
 * contract (database name, environment, and status), with safe fallbacks on failures.
 * @out_of_scope
 * Backend health endpoint correctness and schema stability.
 * @out_of_scope
 * Real network behavior (timeouts, CORS, caching, and proxy/CDN effects).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSystemInfo } from '@/utils/systemInfo';

function arrangeFetchStub() {
  vi.stubGlobal('fetch', vi.fn());
}

function mockFetchOk(payload: unknown) {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => payload,
  } as Response);
}

function mockFetchNotOk(status: number) {
  vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status } as Response);
}

function mockFetchReject(error: unknown) {
  vi.mocked(fetch).mockRejectedValueOnce(error);
}

describe('systemInfo', () => {
  beforeEach(() => {
    arrangeFetchStub();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getSystemInfo', () => {
    describe('success paths', () => {
      it.each([
        [
          'detects Oracle ADB from a health response',
          {
            status: 'UP',
            components: {
              db: {
                status: 'UP',
                details: { database: 'Oracle Database 19c' },
              },
            },
          },
          { database: 'Oracle ADB', environment: 'production', status: 'UP' },
        ],
        [
          'detects Local H2 for non-Oracle databases',
          {
            status: 'UP',
            components: {
              db: {
                status: 'UP',
                details: { database: 'H2' },
              },
            },
          },
          { database: 'Local H2', environment: 'development' },
        ],
        [
          'detects Oracle from any string containing "ORACLE"',
          { status: 'UP', message: 'Connected to ORACLE database' },
          { database: 'Oracle ADB' },
        ],
      ])('%s', async (_name, payload, expectedPartial) => {
        mockFetchOk(payload);

        const info = await getSystemInfo();

        expect(info).toMatchObject(expectedPartial);
      });
    });

    describe('failure paths', () => {
      it('returns fallback values when fetch rejects', async () => {
        mockFetchReject(new Error('Network error'));

        const info = await getSystemInfo();

        expect(info.database).toBe('Local H2');
        expect(info.environment).toBe('development');
        expect(info.status).toBe('unknown');
      });

      it('returns fallback values when the health endpoint is not ok', async () => {
        mockFetchNotOk(500);

        const info = await getSystemInfo();

        expect(info.database).toBe('Local H2');
        expect(info.environment).toBe('development');
      });
    });
  });
});
