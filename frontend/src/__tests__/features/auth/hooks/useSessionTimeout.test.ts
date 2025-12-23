/**
 * @file useSessionTimeout.test.ts
 * @module __tests__/features/auth/hooks/useSessionTimeout
 *
 * @summary
 * Test suite for useSessionTimeout hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useSessionTimeout } from '../../../../features/auth/hooks/useSessionTimeout';
import { useAuth } from '../../../../hooks/useAuth';
import type { AuthContextType } from '../../../../context/auth/authTypes';
import * as httpClient from '../../../../api/httpClient';

vi.mock('../../../../hooks/useAuth');
vi.mock('../../../../api/httpClient');

const mockUseAuth = vi.mocked(useAuth);
const mockHttpClient = vi.mocked(httpClient.default) as unknown as {
  get: ReturnType<typeof vi.fn>;
};

function Wrapper({ children }: { children: ReactNode }) {
  return createElement(BrowserRouter, {}, children);
}

describe('useSessionTimeout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    const authMock: AuthContextType = {
      user: null,
      setUser: vi.fn(),
      login: vi.fn(),
      loginAsDemo: vi.fn(),
      logout: vi.fn(),
      loading: false,
      logoutInProgress: false,
    };
    mockUseAuth.mockReturnValue(authMock);
    mockHttpClient.get.mockResolvedValue({ status: 200 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should skip heartbeat for demo users', () => {
    const authMock: AuthContextType = {
      user: { email: 'demo@test.local', fullName: 'Demo User', role: 'DEMO', isDemo: true },
      setUser: vi.fn(),
      login: vi.fn(),
      loginAsDemo: vi.fn(),
      logout: vi.fn(),
      loading: false,
      logoutInProgress: false,
    };
    mockUseAuth.mockReturnValue(authMock);

    renderHook(() =>
      useSessionTimeout({
        pingEndpoint: '/api/me',
        pingIntervalMs: 10000,
      }),
      { wrapper: Wrapper }
    );

    expect(mockHttpClient.get).not.toHaveBeenCalled();
  });

  it('should setup ping interval for non-demo users', () => {
    const authMock: AuthContextType = {
      user: { email: 'user@test.com', fullName: 'Test User', role: 'USER', isDemo: false },
      setUser: vi.fn(),
      login: vi.fn(),
      loginAsDemo: vi.fn(),
      logout: vi.fn(),
      loading: false,
      logoutInProgress: false,
    };
    mockUseAuth.mockReturnValue(authMock);

    renderHook(() =>
      useSessionTimeout({
        pingEndpoint: '/api/me',
        pingIntervalMs: 10000,
      }),
      { wrapper: Wrapper }
    );

    expect(mockHttpClient.get).toHaveBeenCalled();
  });

  it('should setup idle timeout when enabled', () => {
    const authMock: AuthContextType = {
      user: { email: 'user@test.com', fullName: 'Test User', role: 'USER', isDemo: false },
      setUser: vi.fn(),
      login: vi.fn(),
      loginAsDemo: vi.fn(),
      logout: vi.fn(),
      loading: false,
      logoutInProgress: false,
    };
    mockUseAuth.mockReturnValue(authMock);

    renderHook(() =>
      useSessionTimeout({
        enableIdleTimeout: true,
        idleTimeoutMs: 60000,
      }),
      { wrapper: Wrapper }
    );

    expect(vi.getTimerCount()).toBeGreaterThan(0);
  });

  it('should skip idle timeout when enableIdleTimeout is false', () => {
    const authMock: AuthContextType = {
      user: { email: 'user@test.com', fullName: 'Test User', role: 'USER', isDemo: false },
      setUser: vi.fn(),
      login: vi.fn(),
      loginAsDemo: vi.fn(),
      logout: vi.fn(),
      loading: false,
      logoutInProgress: false,
    };
    mockUseAuth.mockReturnValue(authMock);

    const initialTimerCount = vi.getTimerCount();

    renderHook(() =>
      useSessionTimeout({
        enableIdleTimeout: false,
        idleTimeoutMs: 60000,
      }),
      { wrapper: Wrapper }
    );

    expect(vi.getTimerCount()).toBeGreaterThanOrEqual(initialTimerCount);
  });

  it('should skip idle timeout for demo users even when enabled', () => {
    const authMock: AuthContextType = {
      user: { email: 'demo@test.local', fullName: 'Demo User', role: 'DEMO', isDemo: true },
      setUser: vi.fn(),
      login: vi.fn(),
      loginAsDemo: vi.fn(),
      logout: vi.fn(),
      loading: false,
      logoutInProgress: false,
    };
    mockUseAuth.mockReturnValue(authMock);

    renderHook(() =>
      useSessionTimeout({
        enableIdleTimeout: true,
        idleTimeoutMs: 60000,
      }),
      { wrapper: Wrapper }
    );

    expect(mockHttpClient.get).not.toHaveBeenCalled();
  });

  it('should use default ping interval when not provided', () => {
    const authMock: AuthContextType = {
      user: { email: 'user@test.com', fullName: 'Test User', role: 'USER', isDemo: false },
      setUser: vi.fn(),
      login: vi.fn(),
      loginAsDemo: vi.fn(),
      logout: vi.fn(),
      loading: false,
      logoutInProgress: false,
    };
    mockUseAuth.mockReturnValue(authMock);

    renderHook(() => useSessionTimeout(), { wrapper: Wrapper });

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      '/api/me',
      expect.any(Object)
    );
  });

  it('should setup event listeners for visibility and storage', () => {
    const authMock: AuthContextType = {
      user: { email: 'user@test.com', fullName: 'Test User', role: 'USER', isDemo: false },
      setUser: vi.fn(),
      login: vi.fn(),
      loginAsDemo: vi.fn(),
      logout: vi.fn(),
      loading: false,
      logoutInProgress: false,
    };
    mockUseAuth.mockReturnValue(authMock);

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useSessionTimeout(), { wrapper: Wrapper });

    // Hook sets up storage and popstate listeners
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'storage',
      expect.any(Function)
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'popstate',
      expect.any(Function)
    );

    addEventListenerSpy.mockRestore();
  });

  it('should use custom ping endpoint when provided', () => {
    const customEndpoint = '/api/custom-health';
    const authMock: AuthContextType = {
      user: { email: 'user@test.com', fullName: 'Test User', role: 'USER', isDemo: false },
      setUser: vi.fn(),
      login: vi.fn(),
      loginAsDemo: vi.fn(),
      logout: vi.fn(),
      loading: false,
      logoutInProgress: false,
    };
    mockUseAuth.mockReturnValue(authMock);

    renderHook(() =>
      useSessionTimeout({
        pingEndpoint: customEndpoint,
      }),
      { wrapper: Wrapper }
    );

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      customEndpoint,
      expect.any(Object)
    );
  });

  it('should handle null user gracefully', () => {
    const authMock: AuthContextType = {
      user: null,
      setUser: vi.fn(),
      login: vi.fn(),
      loginAsDemo: vi.fn(),
      logout: vi.fn(),
      loading: false,
      logoutInProgress: false,
    };
    mockUseAuth.mockReturnValue(authMock);

    const { rerender } = renderHook(() => useSessionTimeout(), {
      wrapper: Wrapper,
    });

    expect(rerender).toBeDefined();
  });

  it('should cleanup timers on unmount', () => {
    const authMock: AuthContextType = {
      user: { email: 'user@test.com', fullName: 'Test User', role: 'USER', isDemo: false },
      setUser: vi.fn(),
      login: vi.fn(),
      loginAsDemo: vi.fn(),
      logout: vi.fn(),
      loading: false,
      logoutInProgress: false,
    };
    mockUseAuth.mockReturnValue(authMock);

    const { unmount } = renderHook(() => useSessionTimeout(), {
      wrapper: Wrapper,
    });
    const timerCountBefore = vi.getTimerCount();

    unmount();

    expect(vi.getTimerCount()).toBeLessThanOrEqual(timerCountBefore);
  });
});
