/**
 * @file useSessionTimeout.test.ts
 * @module __tests__/features/auth/hooks/useSessionTimeout
 * @description Contract tests for the `useSessionTimeout` hook.
 *
 * Contract under test:
 * - DEMO users skip heartbeat and idle timeout behavior.
 * - Non-demo users ping the heartbeat endpoint immediately and on an interval.
 * - If a ping fails, the hook broadcasts cross-tab logout and navigates to `/logout`.
 * - When idle timeout is enabled, inactivity triggers navigation to `/logout`.
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
import { useSessionTimeout } from '../../../../features/auth/hooks/useSessionTimeout';
import { useAuth } from '../../../../hooks/useAuth';
import type { AuthContextType } from '../../../../context/auth/authTypes';

const navigateMock = vi.hoisted(() => vi.fn());
const httpClientMock = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../../../api/httpClient', () => ({
  default: httpClientMock,
}));

vi.mock('../../../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);

const STORAGE_FLAG = 'ssp:forceLogout';

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
    setAuth({ user: { email: 'user@test.com', fullName: 'Test User', role: 'USER', isDemo: false } });
    httpClientMock.get.mockResolvedValue({ status: 200 });

    // Deterministic localStorage for the cross-tab broadcast.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('skips heartbeat and idle logic for demo users', () => {
    setAuth({ user: { email: 'demo@test.local', fullName: 'Demo', role: 'DEMO', isDemo: true } });

    const { unmount } = renderHook(() => useSessionTimeout({ enableIdleTimeout: true, pingIntervalMs: 10_000 }));

    expect(httpClientMock.get).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();

    unmount();
  });

  it('pings immediately and on an interval for non-demo users', async () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useSessionTimeout({ pingEndpoint: '/api/me', pingIntervalMs: 10_000 }));

    // Flush effect -> visibility handler -> immediate ping.
    await act(async () => {
      await Promise.resolve();
    });
    expect(httpClientMock.get).toHaveBeenCalledWith('/api/me', { withCredentials: true });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
      await Promise.resolve();
    });
    expect(httpClientMock.get.mock.calls.length).toBeGreaterThanOrEqual(2);

    unmount();
  });

  it('navigates to /logout and broadcasts when heartbeat ping fails', async () => {
    vi.useFakeTimers();
    httpClientMock.get.mockRejectedValue(new Error('401'));
    const { unmount } = renderHook(() => useSessionTimeout({ pingIntervalMs: 10_000 }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(navigateMock).toHaveBeenCalledWith('/logout', { replace: true });
    expect(Storage.prototype.setItem).toHaveBeenCalledWith(STORAGE_FLAG, '1');
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith(STORAGE_FLAG);

    unmount();
  });

  it('logs out after idleTimeoutMs when idle timeout is enabled', async () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useSessionTimeout({ enableIdleTimeout: true, idleTimeoutMs: 60_000 }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
      await Promise.resolve();
    });

    expect(navigateMock).toHaveBeenCalledWith('/logout', { replace: true });

    unmount();
  });

  it('navigates to /logout when receiving the force-logout storage signal', async () => {
    const { unmount } = renderHook(() => useSessionTimeout());

    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_FLAG, newValue: '1' }));
    expect(navigateMock).toHaveBeenCalledWith('/logout', { replace: true });

    unmount();
  });
});
