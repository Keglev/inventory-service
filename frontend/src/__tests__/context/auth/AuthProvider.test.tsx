/**
 * @file AuthProvider.test.tsx
 * @module __tests__/context/auth/AuthProvider
 * @description Contract tests for the `AuthProvider` implementation (session hydration + auth actions).
 *
 * Contract under test:
 * - Renders children while hydrating session state.
 * - If a DEMO session exists in localStorage, restores it and skips the `/api/me` request.
 * - Otherwise, hydrates from `/api/me` and settles `loading` to false (success or failure).
 * - `loginAsDemo()` sets a demo user and persists it.
 * - `logout()` clears user state, broadcasts cross-tab logout, clears demo persistence, and toggles `logoutInProgress`.
 *
 * Out of scope:
 * - HTTP client behavior beyond "called / not called" (covered by API layer tests).
 * - OAuth server configuration; redirect destinations are treated as integration details.
 *
 * Test strategy:
 * - Use a probe component that consumes the context and exposes observable state via test ids.
 * - Mock `httpClient.get` and localStorage deterministically (no implicit globals).
 * - Use fake timers only for the explicit logout safety timer.
 */

import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AppUser } from '../../../context/auth/authTypes';
import { AuthContext } from '../../../context/auth/AuthContext';
import AuthProvider from '../../../context/auth/AuthProvider';

const DEMO_KEY = 'ssp.demo.session';
const STORAGE_FLAG = 'ssp:forceLogout';

const httpClientMock = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('../../../api/httpClient', () => ({
  default: httpClientMock,
  API_BASE: 'http://api.example.com',
}));

function AuthProbe() {
  const ctx = React.useContext(AuthContext);

  if (!ctx) {
    return <div data-testid="auth-probe">missing-provider</div>;
  }

  return (
    <div data-testid="auth-probe">
      <div data-testid="loading">{String(ctx.loading)}</div>
      <div data-testid="logout-in-progress">{String(ctx.logoutInProgress)}</div>
      <div data-testid="user-email">{ctx.user?.email ?? ''}</div>
      <div data-testid="user-role">{ctx.user?.role ?? ''}</div>
      <div data-testid="user-is-demo">{String(Boolean(ctx.user?.isDemo))}</div>

      <button type="button" onClick={ctx.loginAsDemo}>
        loginAsDemo
      </button>
      <button type="button" onClick={ctx.logout}>
        logout
      </button>
    </div>
  );
}

function renderAuth(ui?: React.ReactNode) {
  return render(<AuthProvider>{ui ?? <AuthProbe />}</AuthProvider>);
}

function demoUserJson(overrides: Partial<AppUser> = {}) {
  const demo: AppUser = {
    email: 'demo@smartsupplypro.local',
    fullName: 'Demo User',
    role: 'DEMO',
    isDemo: true,
    ...overrides,
  };
  return JSON.stringify(demo);
}

beforeEach(() => {
  httpClientMock.get.mockReset();

  // Explicitly stub localStorage primitives to keep tests deterministic.
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => undefined);
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('AuthProvider', () => {
  it('renders children while session hydration runs', () => {
    // Keep hydration pending so the test only covers the "children render immediately" contract.
    httpClientMock.get.mockImplementation(() => new Promise<never>(() => {}));
    renderAuth(<div data-testid="child">content</div>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('restores demo session from localStorage and skips /api/me', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => (key === DEMO_KEY ? demoUserJson() : null));
    httpClientMock.get.mockResolvedValue({
      data: { email: 'server@example.com', fullName: 'Server User', role: 'USER' },
    });

    renderAuth();

    // Demo restore is synchronous (no network) and should settle loading quickly.
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('user-role')).toHaveTextContent('DEMO');
    expect(httpClientMock.get).not.toHaveBeenCalled();
  });

  it('hydrates from /api/me when no demo session exists (success)', async () => {
    httpClientMock.get.mockResolvedValue({
      data: { email: 'test@example.com', fullName: 'Test User', role: 'USER' },
    });

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(httpClientMock.get).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    expect(screen.getByTestId('user-role')).toHaveTextContent('USER');
  });

  it('hydrates from /api/me when no demo session exists (failure)', async () => {
    httpClientMock.get.mockRejectedValue(new Error('network'));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('user-email')).toHaveTextContent('');
    expect(screen.getByTestId('user-role')).toHaveTextContent('');
  });

  it('loginAsDemo() sets demo user and persists it', async () => {
    httpClientMock.get.mockResolvedValue({
      data: { email: 'test@example.com', fullName: 'Test User', role: 'USER' },
    });
    const user = userEvent.setup();

    renderAuth();
    await user.click(screen.getByRole('button', { name: 'loginAsDemo' }));

    expect(screen.getByTestId('user-role')).toHaveTextContent('DEMO');
    expect(screen.getByTestId('user-is-demo')).toHaveTextContent('true');

    // Persistence is a key part of the demo/deep-link contract.
    expect(Storage.prototype.setItem).toHaveBeenCalledWith(DEMO_KEY, expect.any(String));
  });

  it('logout() clears user, broadcasts cross-tab flag, and resets logoutInProgress after the safety timeout', async () => {
    vi.useFakeTimers();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => (key === DEMO_KEY ? demoUserJson() : null));

    renderAuth();

    // Demo restore happens inside an effect; flush it explicitly so we don't rely on real timers.
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('user-role')).toHaveTextContent('DEMO');

    // Under fake timers, `userEvent` can hang depending on environment. `fireEvent` is sufficient here
    // because we're verifying provider contracts (state + timers), not pointer/keyboard semantics.
    fireEvent.click(screen.getByRole('button', { name: 'logout' }));

    // Immediately after logout, user is cleared and logout is marked in-progress.
    expect(screen.getByTestId('user-role')).toHaveTextContent('');
    expect(screen.getByTestId('logout-in-progress')).toHaveTextContent('true');

    // Cross-tab broadcast uses a set/remove toggle pattern.
    expect(Storage.prototype.setItem).toHaveBeenCalledWith(STORAGE_FLAG, '1');
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith(STORAGE_FLAG);
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith(DEMO_KEY);

    // Safety valve: reset the flag after the timer elapses.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });

    expect(screen.getByTestId('logout-in-progress')).toHaveTextContent('false');
  });
});
