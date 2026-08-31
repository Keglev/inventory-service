/**
 * @file apiBase.test.ts
 * @module tests/unit/api/apiBase
 * @description Contract tests for the API origin resolver.
 *
 * Contract under test:
 * - A blank or '/' VITE_API_BASE yields a same-origin (relative) URL.
 * - A configured origin is prefixed and its trailing slashes are trimmed.
 *
 * Out of scope:
 * - httpClient's own base resolution (see httpClient.test.ts).
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiOrigin, apiUrl } from '../../../api/apiBase';

describe('apiBase', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('resolves to a same-origin path when the env value is blank', () => {
    vi.stubEnv('VITE_API_BASE', '   ');

    expect(apiOrigin()).toBe('');
    expect(apiUrl('/api/health')).toBe('/api/health');
  });

  it('resolves to a same-origin path for the development root value', () => {
    vi.stubEnv('VITE_API_BASE', '/');

    expect(apiOrigin()).toBe('');
    expect(apiUrl('/api/health')).toBe('/api/health');
  });

  it('prefixes a configured origin and trims the trailing slash', () => {
    vi.stubEnv('VITE_API_BASE', 'https://backend.example.com/');

    expect(apiOrigin()).toBe('https://backend.example.com');
    expect(apiUrl('/api/health')).toBe('https://backend.example.com/api/health');
  });
});
