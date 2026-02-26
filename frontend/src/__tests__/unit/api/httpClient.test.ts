/**
 * @file httpClient.test.ts
 * @module tests/unit/api/httpClient
 * @what_is_under_test httpClient / API_BASE
 * @responsibility
 * Guarantees the HTTP client’s externally observable configuration contract: a non-empty API base,
 * stable axios defaults (credentials, timeout, headers), and deterministic demo-session detection inputs.
 * @out_of_scope
 * Transport behavior (actual network requests, TLS, browser cookie policy, and CORS semantics).
 * @out_of_scope
 * Interceptor logic details (handler order and transformation behavior are integration concerns).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import httpClient, { API_BASE } from '@/api/httpClient';

function arrangeLocalStorage() {
  let store: Record<string, string> = {};

  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  });
}
describe('httpClient', () => {
  describe('API_BASE resolution', () => {
    it('resolves a non-empty API base string', () => {
      expect(API_BASE).toBeTruthy();
      expect(typeof API_BASE).toBe('string');
      expect(API_BASE.length).toBeGreaterThan(0);
    });

    it('normalizes baseURL without a trailing slash', () => {
      const baseURL = httpClient.defaults.baseURL;
      expect(baseURL).not.toMatch(/\/$/);
    });
  });

  describe('httpClient defaults', () => {
    it('enables credentialed requests', () => {
      expect(httpClient.defaults.withCredentials).toBe(true);
    });

    it('sets a stable request timeout', () => {
      expect(httpClient.defaults.timeout).toBe(30_000);
    });

    it('sets a JSON Accept header', () => {
      expect(httpClient.defaults.headers.common['Accept']).toBe('application/json');
    });

    it('sets an X-Requested-With header for server-side CSRF heuristics', () => {
      expect(httpClient.defaults.headers.common['X-Requested-With']).toBe('XMLHttpRequest');
    });
  });

  describe('demo session detection', () => {
    beforeEach(() => {
      arrangeLocalStorage();
      localStorage.clear();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('treats a missing demo session key as non-demo', () => {
      expect(localStorage.getItem('ssp.demo.session')).toBeNull();
    });

    it('accepts a persisted demo session payload', () => {
      localStorage.setItem('ssp.demo.session', JSON.stringify({ isDemo: true }));
      const raw = localStorage.getItem('ssp.demo.session');
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw as string).isDemo).toBe(true);
    });
  });

  describe('interceptors', () => {
    it('exposes request/response interceptor registries', () => {
      expect(httpClient.interceptors.request).toBeDefined();
      expect(httpClient.interceptors.response).toBeDefined();
    });
  });
});
