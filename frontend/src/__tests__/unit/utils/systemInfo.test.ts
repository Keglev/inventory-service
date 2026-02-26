/**
 * @file systemInfo.test.ts
 * @module tests/unit/utils/systemInfo
 * @what_is_under_test getSystemInfo / isProduction / formatUptime
 * @responsibility
 * Guarantees system info helpers translate the health endpoint response into a stable UI-friendly
 * contract (database name, environment, version, and status), with safe fallbacks on failures.
 * @out_of_scope
 * Backend health endpoint correctness and schema stability.
 * @out_of_scope
 * Real network behavior (timeouts, CORS, caching, and proxy/CDN effects).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSystemInfo, isProduction, formatUptime } from '@/utils/systemInfo';

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
          'extracts version and normalizes it with a v-prefix',
          { status: 'UP', version: '2.5.0' },
          { version: 'v2.5.0' },
        ],
        [
          'accepts app-version and adds v-prefix when missing',
          { status: 'UP', 'app-version': '1.0.0' },
          { version: 'v1.0.0' },
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
        expect(info.version).toBe('dev');
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

  describe('isProduction', () => {
    it.each([
      [
        'returns true when the database is Oracle ADB',
        { status: 'UP', components: { db: { details: { database: 'Oracle' } } } },
        true,
      ],
      [
        'returns false when the database is Local H2',
        { status: 'UP', components: { db: { details: { database: 'H2' } } } },
        false,
      ],
    ])('%s', async (_name, payload, expected) => {
      mockFetchOk(payload);

      const result = await isProduction();

      expect(result).toBe(expected);
    });
  });

  describe('formatUptime', () => {
    it.each([
      [3661, '1h 1m 1s'],
      [125, '2m 5s'],
      [45, '45s'],
      [0, '0s'],
      [7200, '2h'],
      [86461, '24h 1m 1s'],
    ])('formats %s seconds as %s', (seconds, expected) => {
      expect(formatUptime(seconds)).toBe(expected);
    });
  });
});
