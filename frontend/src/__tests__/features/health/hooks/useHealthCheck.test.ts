/**
 * @file useHealthCheck.test.ts
 * @module __tests__/features/health/hooks/useHealthCheck
 * @description Contract tests for the `useHealthCheck` hook.
 *
 * Contract under test:
 * - Performs an initial `/api/health` request on mount.
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
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useHealthCheck } from '../../../../features/health/hooks/useHealthCheck';

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

describe('useHealthCheck', () => {
  const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>();
  let warnMock: MockInstance<Parameters<typeof console.warn>, void>;
  let errorMock: MockInstance<Parameters<typeof console.error>, void>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);

    // Keep console output deterministic and avoid polluting test logs.
    warnMock = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    errorMock = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();

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

    const { result, unmount } = renderHook(() => useHealthCheck());

    expect(fetchMock).toHaveBeenCalledWith('/api/health', { credentials: 'include' });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.health).toEqual({
      status: 'online',
      database: 'online',
      responseTime: 55,
      timestamp: 123,
    });

    unmount();
  });

  it('treats non-JSON content-type as offline and logs a warning', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(9_999);
    fetchMock.mockResolvedValue(makeResponse({ contentType: 'text/plain', text: 'ok' }));

    const { result, unmount } = renderHook(() => useHealthCheck());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(warnMock).toHaveBeenCalled();
    expect(result.current.health.status).toBe('offline');
    expect(result.current.health.timestamp).toBe(9_999);

    unmount();
  });

  it('treats invalid JSON shape as offline and logs an error', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(12_345);
    fetchMock.mockResolvedValue(makeResponse({ contentType: 'application/json', json: { nope: true } }));

    const { result, unmount } = renderHook(() => useHealthCheck());

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

    const { unmount } = renderHook(() => useHealthCheck());
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

    const { result, unmount } = renderHook(() => useHealthCheck());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await result.current.refetch();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    unmount();
  });
});
