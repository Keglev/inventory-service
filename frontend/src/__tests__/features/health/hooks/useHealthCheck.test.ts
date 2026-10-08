/**
 * @file useHealthCheck.test.ts
 * @module __tests__/features/health/hooks/useHealthCheck
 * @description Contract tests for the `useHealthCheck` hook.
 *
 * Contract under test:
 * - Performs an initial health request on mount, prefixed with VITE_API_BASE.
 * - One shared query: several consumers mounted together send one request (FW5 fork 3).
 * - Exposes the backend's databaseProduct, or null when missing or blank.
 * - Requires JSON content-type; non-JSON responses transition to offline.
 * - Validates response shape at runtime; invalid shapes transition to offline.
 * - Polls every 15 minutes.
 * - Exposes `refetch()` to manually trigger a check.
 *
 * Out of scope:
 * - The UI that consumes health state.
 * - Full fidelity of the `Response` object; only the consumed surface is mocked.
 *
 * Test strategy:
 * - Deterministic `fetch`, `performance.now`, `Date.now`, and console spies.
 * - Fake timers only for the polling interval contract.
 * - A fresh QueryClient per test (app defaults: 60 s stale time; no retry needed,
 *   the probe never rejects).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import * as React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHealthCheck } from '@/features/health/hooks/useHealthCheck';

function makeResponse(options: {
  contentType: string;
  json?: unknown;
  text?: string;
}): Response {
  return {
    headers: new Headers({ 'content-type': options.contentType }),
    json: vi.fn(async () => options.json),
    text: vi.fn(async () => options.text ?? ''),
  } as unknown as Response;
}

let queryClient: QueryClient;

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(QueryClientProvider, { client: queryClient }, children);

describe('useHealthCheck', () => {
  const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
  let warnMock: MockInstance<typeof console.warn>;
  let errorMock: MockInstance<typeof console.error>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60_000 } } });
    vi.stubGlobal('fetch', fetchMock);
    // The probe builds its URL from VITE_API_BASE; pin the same-origin arm so
    // the default assertions do not depend on the machine's environment.
    vi.stubEnv('VITE_API_BASE', '');

    // Keep console output deterministic and avoid polluting test logs.
    warnMock = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    errorMock = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    queryClient.clear();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();

    warnMock.mockRestore();
    errorMock.mockRestore();
    vi.restoreAllMocks();
  });

  it('calls /api/health on mount and transitions to online on a valid JSON response', async () => {
    // Stub `performance.now()` deterministically; `spyOn(performance, 'now')` is flaky across environments.
    const now = vi.fn().mockReturnValueOnce(100).mockReturnValueOnce(155);
    vi.stubGlobal('performance', { now } as unknown as Performance);
    fetchMock.mockResolvedValue(
      makeResponse({
        contentType: 'application/json',
        json: { status: 'ok', database: 'ok', timestamp: 123 },
      })
    );

    const { result, unmount } = renderHook(() => useHealthCheck(), { wrapper });

    expect(fetchMock).toHaveBeenCalledWith('/api/health', { credentials: 'include' });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.health).toEqual({
      status: 'online',
      database: 'online',
      databaseProduct: null,
      responseTime: 55,
      timestamp: 123,
    });

    unmount();
  });

  it('targets the configured API origin when one is set', async () => {
    vi.stubEnv('VITE_API_BASE', 'https://backend.example.com/');
    fetchMock.mockResolvedValue(
      makeResponse({
        contentType: 'application/json',
        json: { status: 'ok', database: 'ok', timestamp: 123 },
      })
    );

    const { result, unmount } = renderHook(() => useHealthCheck(), { wrapper });

    expect(fetchMock).toHaveBeenCalledWith('https://backend.example.com/api/health', {
      credentials: 'include',
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    unmount();
  });

  it('treats non-JSON content-type as offline and logs a warning', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(9_999);
    fetchMock.mockResolvedValue(makeResponse({ contentType: 'text/plain', text: 'ok' }));

    const { result, unmount } = renderHook(() => useHealthCheck(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(warnMock).toHaveBeenCalled();
    expect(result.current.health.status).toBe('offline');
    expect(result.current.health.timestamp).toBe(9_999);

    unmount();
  });

  it('treats invalid JSON shape as offline and logs an error', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(12_345);
    fetchMock.mockResolvedValue(makeResponse({ contentType: 'application/json', json: { nope: true } }));

    const { result, unmount } = renderHook(() => useHealthCheck(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(errorMock).toHaveBeenCalled();
    expect(result.current.health.status).toBe('offline');
    expect(result.current.health.timestamp).toBe(12_345);

    unmount();
  });

  it('polls every 15 minutes', async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(
      makeResponse({
        contentType: 'application/json',
        json: { status: 'ok', database: 'ok', timestamp: 1 },
      })
    );

    const { unmount } = renderHook(() => useHealthCheck(), { wrapper });
    await act(async () => {
      // Flush the initial `useEffect` run.
      await Promise.resolve();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15 * 60 * 1000);
      await Promise.resolve();
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    unmount();
  });

  it('exposes refetch() to trigger an immediate check', async () => {
    fetchMock.mockResolvedValue(
      makeResponse({
        contentType: 'application/json',
        json: { status: 'ok', database: 'ok', timestamp: 1 },
      })
    );

    const { result, unmount } = renderHook(() => useHealthCheck(), { wrapper });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await result.current.refetch();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    unmount();
  });

  it('treats a missing content-type header as non-JSON (offline)', async () => {
    fetchMock.mockResolvedValue({
      headers: new Headers(),
      json: vi.fn(async () => ({})),
      text: vi.fn(async () => 'plain'),
    } as unknown as Response);

    const { result, unmount } = renderHook(() => useHealthCheck(), { wrapper });

    await waitFor(() => expect(result.current.health.status).toBe('offline'));

    unmount();
  });

  it('treats a non-object JSON body as an invalid shape (offline)', async () => {
    fetchMock.mockResolvedValue(
      makeResponse({ contentType: 'application/json', json: 'just-a-string' })
    );

    const { result, unmount } = renderHook(() => useHealthCheck(), { wrapper });

    await waitFor(() => expect(result.current.health.status).toBe('offline'));

    unmount();
  });

  it('maps degraded backend and database statuses to offline flags', async () => {
    fetchMock.mockResolvedValue(
      makeResponse({
        contentType: 'application/json',
        json: { status: 'DOWN', database: 'ERROR', timestamp: 1720900000000 },
      })
    );

    const { result, unmount } = renderHook(() => useHealthCheck(), { wrapper });

    await waitFor(() => expect(result.current.health.status).toBe('offline'));
    expect(result.current.health.database).toBe('offline');

    unmount();
  });
  it('sends one request when several consumers mount together', async () => {
    fetchMock.mockResolvedValue(
      makeResponse({ contentType: 'application/json', json: { status: 'ok', database: 'ok', timestamp: 1 } })
    );

    const { result, unmount } = renderHook(
      () => [useHealthCheck(), useHealthCheck(), useHealthCheck()],
      { wrapper }
    );

    await waitFor(() => expect(result.current[0].health.status).toBe('online'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current[1].health).toBe(result.current[0].health);
    expect(result.current[2].health).toBe(result.current[0].health);
    unmount();
  });

  it.each([
    ['Oracle', 'Oracle'],
    ['   ', null],
    [42, null],
    [undefined, null],
  ])('maps databaseProduct %j to %j', async (reported, expected) => {
    fetchMock.mockResolvedValue(
      makeResponse({
        contentType: 'application/json',
        json: { status: 'ok', database: 'ok', databaseProduct: reported, timestamp: 1 },
      })
    );

    const { result, unmount } = renderHook(() => useHealthCheck(), { wrapper });

    await waitFor(() => expect(result.current.health.status).toBe('online'));
    expect(result.current.health.databaseProduct).toBe(expected);
    unmount();
  });

  it('reports databaseProduct null when the probe fails', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    const { result, unmount } = renderHook(() => useHealthCheck(), { wrapper });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.health.timestamp).toBeGreaterThan(0));
    expect(result.current.health).toMatchObject({ status: 'offline', database: 'offline', databaseProduct: null });
    unmount();
  });
});
