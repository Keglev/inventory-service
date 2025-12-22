/**
 * @file systemInfo.test.ts
 * @module utils/systemInfo.test
 * 
 * Unit tests for system information utilities.
 * Tests getSystemInfo, isProduction, and formatUptime functions with mocked fetch.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSystemInfo, isProduction, formatUptime } from '@/utils/systemInfo';

describe('getSystemInfo', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should detect Oracle ADB from health response', async () => {
    const mockResponse = {
      status: 'UP',
      components: {
        db: {
          status: 'UP',
          details: {
            database: 'Oracle Database 19c',
          },
        },
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const info = await getSystemInfo();

    expect(info.database).toBe('Oracle ADB');
    expect(info.environment).toBe('production');
    expect(info.status).toBe('UP');
  });

  it('should detect Local H2 for non-Oracle databases', async () => {
    const mockResponse = {
      status: 'UP',
      components: {
        db: {
          status: 'UP',
          details: {
            database: 'H2',
          },
        },
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const info = await getSystemInfo();

    expect(info.database).toBe('Local H2');
    expect(info.environment).toBe('development');
  });

  it('should return fallback on fetch error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const info = await getSystemInfo();

    expect(info.database).toBe('Local H2');
    expect(info.version).toBe('dev');
    expect(info.environment).toBe('development');
    expect(info.status).toBe('unknown');
  });

  it('should return fallback when health endpoint returns non-ok status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const info = await getSystemInfo();

    expect(info.database).toBe('Local H2');
    expect(info.environment).toBe('development');
  });

  it('should extract version from response', async () => {
    const mockResponse = {
      status: 'UP',
      version: '2.5.0',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const info = await getSystemInfo();

    expect(info.version).toBe('v2.5.0');
  });

  it('should add v prefix to version if missing', async () => {
    const mockResponse = {
      status: 'UP',
      'app-version': '1.0.0',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const info = await getSystemInfo();

    expect(info.version).toBe('v1.0.0');
  });

  it('should detect Oracle from any string containing "ORACLE"', async () => {
    const mockResponse = {
      status: 'UP',
      message: 'Connected to ORACLE database',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const info = await getSystemInfo();

    expect(info.database).toBe('Oracle ADB');
  });
});

describe('isProduction', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return true when database is Oracle ADB', async () => {
    const mockResponse = {
      status: 'UP',
      components: {
        db: {
          details: { database: 'Oracle' },
        },
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await isProduction();
    expect(result).toBe(true);
  });

  it('should return false when database is Local H2', async () => {
    const mockResponse = {
      status: 'UP',
      components: {
        db: {
          details: { database: 'H2' },
        },
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await isProduction();
    expect(result).toBe(false);
  });
});

describe('formatUptime', () => {
  it('should format hours, minutes, and seconds', () => {
    expect(formatUptime(3661)).toBe('1h 1m 1s');
  });

  it('should format only minutes and seconds', () => {
    expect(formatUptime(125)).toBe('2m 5s');
  });

  it('should format only seconds', () => {
    expect(formatUptime(45)).toBe('45s');
  });

  it('should handle zero', () => {
    expect(formatUptime(0)).toBe('0s');
  });

  it('should format exact hours', () => {
    expect(formatUptime(7200)).toBe('2h');
  });

  it('should format large values', () => {
    expect(formatUptime(86461)).toBe('24h 1m 1s');
  });
});
