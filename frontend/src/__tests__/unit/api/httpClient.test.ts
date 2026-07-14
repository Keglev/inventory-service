/**
 * @file httpClient.test.ts
 * @module __tests__/unit/api/httpClient
 * @description Singleton Axios client: base-URL resolution, shared
 * defaults, and the cross-cutting 401 response interceptor.
 *
 * Contract under test:
 * - API_BASE falls back to '/api' without a configured env and honors a
 *   set VITE_API_BASE (trailing slash trimmed on the axios baseURL).
 * - Credentialed requests, timeout, and shared headers are set.
 * - Success responses pass through untouched; errors without a response
 *   (network) and non-401 statuses reject unchanged.
 * - 401 handling: demo sessions, public paths, and the /me session probe
 *   reject quietly; any other authenticated-page 401 redirects to /login.
 * - Demo detection tolerates missing, malformed, and non-demo payloads.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AxiosError, AxiosResponse } from 'axios';

import httpClient from '../../../api/httpClient';

type Handler = {
  fulfilled: (res: AxiosResponse) => AxiosResponse;
  rejected: (error: AxiosError) => Promise<never> | undefined;
};

/** The interceptor registered at module load, exposed by Axios internals. */
function interceptor(): Handler {
  const handlers = (
    httpClient.interceptors.response as unknown as { handlers: Handler[] }
  ).handlers;
  return handlers[0];
}

function make401(url?: string): AxiosError {
  return {
    response: { status: 401, config: { url } },
  } as unknown as AxiosError;
}

const originalLocation = window.location;

function stubLocation(pathname: string) {
  const assign = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...originalLocation, pathname, assign },
  });
  return assign;
}

describe('httpClient', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  describe('API_BASE resolution and defaults', () => {
    it('falls back to /api when the base URL env is blank', async () => {
      // CI and local machines may or may not define VITE_API_BASE, so the
      // fallback arm is pinned by stubbing the env and importing fresh.
      vi.resetModules();
      vi.stubEnv('VITE_API_BASE', '   ');

      const fresh = await import('../../../api/httpClient');

      expect(fresh.API_BASE).toBe('/api');
      expect(fresh.default.defaults.baseURL).toBe('/api');

      vi.unstubAllEnvs();
      vi.resetModules();
    });

    it('honors a configured VITE_API_BASE and trims the trailing slash', async () => {
      vi.resetModules();
      vi.stubEnv('VITE_API_BASE', 'https://backend.example.com/');

      const fresh = await import('../../../api/httpClient');

      expect(fresh.API_BASE).toBe('https://backend.example.com/');
      expect(fresh.default.defaults.baseURL).toBe('https://backend.example.com');

      vi.unstubAllEnvs();
      vi.resetModules();
    });

    it('enables credentialed requests with a stable timeout and shared headers', () => {
      expect(httpClient.defaults.withCredentials).toBe(true);
      expect(httpClient.defaults.timeout).toBe(30_000);
      expect(httpClient.defaults.headers.common['Accept']).toBe('application/json');
      expect(httpClient.defaults.headers.common['X-Requested-With']).toBe('XMLHttpRequest');
    });
  });

  describe('401 interceptor', () => {
    it('passes successful responses through untouched', () => {
      const res = { status: 200 } as AxiosResponse;

      expect(interceptor().fulfilled(res)).toBe(res);
    });

    it('rejects network errors (no response) unchanged', async () => {
      const error = { message: 'network down' } as AxiosError;

      await expect(interceptor().rejected(error)).rejects.toBe(error);
    });

    it('rejects non-401 statuses unchanged', async () => {
      const error = { response: { status: 500, config: {} } } as unknown as AxiosError;

      await expect(interceptor().rejected(error)).rejects.toBe(error);
    });

    it('rejects a 401 quietly during a demo session', async () => {
      const assign = stubLocation('/dashboard');
      localStorage.setItem('ssp.demo.session', JSON.stringify({ isDemo: true }));
      const error = make401('/api/items');

      await expect(interceptor().rejected(error)).rejects.toBe(error);
      expect(assign).not.toHaveBeenCalled();
    });

    it.each(['/', '/login', '/auth/callback', '/logout'])(
      'rejects a 401 quietly on the public path %s',
      async (pathname) => {
        const assign = stubLocation(pathname);
        const error = make401('/api/items');

        await expect(interceptor().rejected(error)).rejects.toBe(error);
        expect(assign).not.toHaveBeenCalled();
      },
    );

    it.each(['/api/me', '/me', '/me/session'])(
      'rejects a 401 quietly for the session probe url %s',
      async (url) => {
        const assign = stubLocation('/dashboard');
        const error = make401(url);

        await expect(interceptor().rejected(error)).rejects.toBe(error);
        expect(assign).not.toHaveBeenCalled();
      },
    );

    it('redirects to /login for a 401 on an authenticated page', () => {
      const assign = stubLocation('/dashboard');
      const error = make401('/api/items');

      const result = interceptor().rejected(error);

      expect(result).toBeUndefined();
      expect(assign).toHaveBeenCalledWith('/login');
    });

    it('treats a request without a url string as a non-probe', () => {
      const assign = stubLocation('/dashboard');
      const error = { response: { status: 401, config: {} } } as unknown as AxiosError;

      interceptor().rejected(error);

      expect(assign).toHaveBeenCalledWith('/login');
    });

    it('ignores demo flags that are malformed or not demo sessions', () => {
      const assign = stubLocation('/dashboard');

      // Malformed JSON: the try/catch degrades to non-demo.
      localStorage.setItem('ssp.demo.session', 'not-json{');
      interceptor().rejected(make401('/api/items'));
      expect(assign).toHaveBeenCalledTimes(1);

      // Parsable but not a demo session.
      localStorage.setItem('ssp.demo.session', JSON.stringify({ isDemo: false }));
      interceptor().rejected(make401('/api/items'));
      expect(assign).toHaveBeenCalledTimes(2);
    });
  });
});
