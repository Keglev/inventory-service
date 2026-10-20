/**
 * @file useSessionTimeout.test.ts
 * @module __tests__/features/auth/hooks/useSessionTimeout
 * @description Contract tests for the `useSessionTimeout` hook.
 *
 * Contract under test:
 * - DEMO users skip the heartbeat.
 * - Non-demo users ping immediately (and on returning to the tab), then on an
 *   interval only after user activity: an idle tab sends nothing, so the
 *   server's session timeout can end the session.
 * - If a ping answers 401, the hook navigates to `/logout` (the logout page
 *   broadcasts to other tabs); a network error or a 5xx keeps the session.
 * - A `storage` event with the force-logout flag triggers navigation to `/logout`.
 *
 * Out of scope:
 * - The LogoutPage cleanup itself.
 * - Exact event listener wiring (tested indirectly via observable effects).
 *
 * Test strategy:
 * - Mock external edges deterministically (`useAuth`, `useNavigate`, `httpClient`, `localStorage`).
 * - Use fake timers only where timing/interval behavior is part of the contract.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { AxiosError, type AxiosResponse } from 'axios';
import { useSessionTimeout } from '@/features/auth/hooks/useSessionTimeout';
import { useAuth } from '@/hooks/useAuth';
import type { AuthContextType } from '@/context/auth/authTypes';

const navigateMock = vi.hoisted(() => vi.fn());
const httpClientMock = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/api/httpClient', () => ({
  default: httpClientMock,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);

const STORAGE_FLAG = 'ssp:forceLogout';

/** A real AxiosError, as httpClient rejects; no status means no response (offline, timeout). */
function pingError(status?: number): AxiosError {
  const response = status === undefined
    ? undefined
    : ({ status, statusText: '', headers: {}, config: {}, data: null } as unknown as AxiosResponse);
  return new AxiosError('ping failed', status === undefined ? 'ERR_NETWORK' : 'ERR_BAD_RESPONSE', undefined, undefined, response);
}

function setAuth(overrides: Partial<AuthContextType>) {
  useAuthMock.mockReturnValue({
    user: null,
    setUser: vi.fn(),
    login: vi.fn(),
    loginAsDemo: vi.fn(),
    logout: vi.fn(),
    loading: false,
    logoutInProgress: false,
    ...overrides,
  });
}

describe('useSessionTimeout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to real timers. Individual tests opt into fake timers when the timer contract matters.
    vi.useRealTimers();

    // JSDOM exposes `visibilityState`, but it's not always configurable in every environment.
    // This hook only runs heartbeat logic when the tab is visible.
    try {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
    } catch {
      // ignore if the environment disallows redefining it
    }

    // Default: authenticated non-demo user so heartbeat runs.
    setAuth({ user: { email: 'user@example.com', fullName: 'Test User', role: 'USER', isDemo: false } });
    httpClientMock.get.mockResolvedValue({ status: 200 });

    // Deterministic localStorage for the cross-tab broadcast.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('skips the heartbeat for demo users', () => {
    setAuth({ user: { email: 'demo@test.local', fullName: 'Demo', role: 'DEMO', isDemo: true } });

    const { unmount } = renderHook(() => useSessionTimeout({ pingIntervalMs: 10_000 }));
    window.dispatchEvent(new Event('pointerdown'));

    expect(httpClientMock.get).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();

    unmount();
  });

  it('pings immediately, then on an interval while the user is active', async () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useSessionTimeout({ pingEndpoint: '/api/me', pingIntervalMs: 10_000 }));

    // Flush effect -> visibility handler -> immediate ping.
    await act(async () => {
      await Promise.resolve();
    });
    // Credentials come from the shared client's default (httpClient.test).
    expect(httpClientMock.get).toHaveBeenCalledWith('/api/me');

    window.dispatchEvent(new Event('keydown'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(httpClientMock.get).toHaveBeenCalledTimes(2);

    unmount();
  });

  it('sends no ping while the user is idle, so the server session can expire', async () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useSessionTimeout({ pingIntervalMs: 10_000 }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(httpClientMock.get).toHaveBeenCalledTimes(1);

    // Thirty idle minutes: no interval tick may refresh the session.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30 * 60_000);
    });
    expect(httpClientMock.get).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('ends an expired session at the first ping after the user returns', async () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useSessionTimeout({ pingIntervalMs: 10_000 }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(31 * 60_000);
    });
    expect(navigateMock).not.toHaveBeenCalled();

    // The server dropped the idle session; the user moves the mouse.
    httpClientMock.get.mockRejectedValue(pingError(401));
    window.dispatchEvent(new Event('mousemove'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(navigateMock).toHaveBeenCalledWith('/logout', { replace: true });

    unmount();
  });

  it('counts one burst of activity for one ping only', async () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useSessionTimeout({ pingIntervalMs: 10_000 }));
    await act(async () => {
      await Promise.resolve();
    });

    window.dispatchEvent(new Event('wheel'));
    window.dispatchEvent(new Event('touchstart'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    // Immediate ping + one for the activity; the two later ticks saw none.
    expect(httpClientMock.get).toHaveBeenCalledTimes(2);

    unmount();
  });

  it('navigates to /logout when the heartbeat ping answers 401', async () => {
    vi.useFakeTimers();
    httpClientMock.get.mockRejectedValue(pingError(401));
    const { unmount } = renderHook(() => useSessionTimeout({ pingIntervalMs: 10_000 }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(navigateMock).toHaveBeenCalledWith('/logout', { replace: true });
    // The other tabs hear it once, from AuthContext.logout on the logout page
    // (LogoutPage and AuthProvider specs), not a second time from here.
    expect(Storage.prototype.setItem).not.toHaveBeenCalled();

    unmount();
  });

  it.each([
    ['a network error', undefined],
    ['a 500', 500],
    ['a 503', 503],
  ])('keeps the session when the heartbeat ping fails with %s', async (_label, status) => {
    vi.useFakeTimers();
    httpClientMock.get.mockRejectedValue(pingError(status));
    const { unmount } = renderHook(() => useSessionTimeout({ pingIntervalMs: 10_000 }));

    await act(async () => {
      await Promise.resolve();
    });
    window.dispatchEvent(new Event('pointerdown'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    // Both pings ran and failed; neither ended the session.
    expect(httpClientMock.get).toHaveBeenCalledTimes(2);
    expect(navigateMock).not.toHaveBeenCalled();
    expect(Storage.prototype.setItem).not.toHaveBeenCalled();

    unmount();
  });

  it('navigates to /logout when receiving the force-logout storage signal', async () => {
    const { unmount } = renderHook(() => useSessionTimeout());

    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_FLAG, newValue: '1' }));
    expect(navigateMock).toHaveBeenCalledWith('/logout', { replace: true });

    unmount();
  });

  it('ignores storage events for other keys or values', () => {
    const { unmount } = renderHook(() => useSessionTimeout());

    window.dispatchEvent(new StorageEvent('storage', { key: 'themeMode', newValue: '1' }));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_FLAG, newValue: '0' }));

    expect(navigateMock).not.toHaveBeenCalled();

    unmount();
  });

  it('pauses the heartbeat while hidden and resumes on visibility', async () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useSessionTimeout({ pingIntervalMs: 10_000 }));

    await act(async () => {
      await Promise.resolve();
    });
    const callsWhileVisible = httpClientMock.get.mock.calls.length;

    // Hide twice: the second stop() finds no timer (idempotent branch).
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    document.dispatchEvent(new Event('visibilitychange'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(httpClientMock.get.mock.calls.length).toBe(callsWhileVisible);

    // Resuming restarts the interval with an immediate ping.
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    await act(async () => {
      await Promise.resolve();
    });
    expect(httpClientMock.get.mock.calls.length).toBeGreaterThan(callsWhileVisible);

    unmount();
  });
});
