/**
 * @file AppRouter.test.tsx
 * @module __tests__/routes/AppRouter
 * @description Contract tests for `AppRouter`.
 *
 * Contract under test:
 * - While auth is bootstrapping (`useAuth().loading === true`), render a progress indicator and do not render routes.
 * - Public routes render under `AppPublicShell` (no `AppShell`).
 * - `/logout` is intentionally public (outside both shells) to avoid guard races during cleanup.
 * - Authenticated routes render under `AppShell` and are wrapped by `RequireAuth`.
 * - Unknown routes fall back to the 404 page.
 *
 * Out of scope:
 * - The internal implementation of `RequireAuth` and the shells.
 * - Page-level behavior (each page has its own tests).
 *
 * Test strategy:
 * - Mock `useAuth` deterministically and render at concrete paths using `MemoryRouter`.
 * - Mock pages/shells as thin components with stable `data-testid` markers.
 */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet } from 'react-router-dom';
import type { AuthContextType } from '../../context/auth/authTypes';
import AppRouter from '../../routes/AppRouter';

const useAuthMock = vi.hoisted(() => vi.fn());
vi.mock('../../hooks/useAuth', () => ({ useAuth: useAuthMock }));

// Vitest hoists `vi.mock()` calls, so any helper referenced by mock factories must
// also be hoisted to avoid TDZ ("Cannot access before initialization") errors.
const page = vi.hoisted(() => (label: string) => () => <div>{label}</div>);

// Pages are mocked as static labels; routing behavior is what we care about here.
vi.mock('../../pages/home/Home', () => ({ default: page('Home Page') }));
vi.mock('../../pages/auth/LoginPage', () => ({ default: page('Login Page') }));
vi.mock('../../pages/auth/AuthCallback', () => ({ default: page('Auth Callback') }));
vi.mock('../../pages/auth/LogoutSuccess', () => ({ default: page('Logout Success') }));
vi.mock('../../pages/auth/LogoutPage', () => ({ default: page('Logout Page') }));
vi.mock('../../pages/system/NotFoundPage', () => ({ default: page('404 Not Found') }));

vi.mock('../../pages/dashboard/Dashboard', () => ({ default: page('Dashboard') }));
vi.mock('../../pages/inventory/InventoryBoard', () => ({ default: page('Inventory Board') }));
vi.mock('../../pages/suppliers/SuppliersBoard', () => ({ default: page('Suppliers Board') }));
vi.mock('../../pages/analytics/Analytics', () => ({ default: page('Analytics') }));

vi.mock('../../app/layout/AppShell', () => ({
  default: () => (
    <div data-testid="app-shell">
      <Outlet />
    </div>
  ),
}));

vi.mock('../../app/public-shell', () => ({
  AppPublicShell: () => (
    <div data-testid="public-shell">
      <Outlet />
    </div>
  ),
}));

vi.mock('../../features/auth', () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="require-auth">{children}</div>
  ),
}));

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
  } satisfies AuthContextType);
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRouter />
    </MemoryRouter>
  );
}

describe('AppRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuth({ loading: false });
  });

  it('renders a progress indicator while auth is loading', () => {
    setAuth({ loading: true });
    renderAt('/');
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it.each([
    ['/', 'Home Page'],
    ['/login', 'Login Page'],
    ['/auth', 'Auth Callback'],
    ['/logout-success', 'Logout Success'],
  ])('renders public route %s under PublicShell', (path, label) => {
    renderAt(path);
    expect(screen.getByTestId('public-shell')).toBeInTheDocument();
    expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('treats /logout as a public route (outside both shells)', () => {
    renderAt('/logout');
    expect(screen.getByText('Logout Page')).toBeInTheDocument();
    expect(screen.queryByTestId('public-shell')).not.toBeInTheDocument();
    expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument();
  });

  it.each([
    ['/dashboard', 'Dashboard'],
    ['/inventory', 'Inventory Board'],
    ['/suppliers', 'Suppliers Board'],
    ['/analytics', 'Analytics'],
    ['/analytics/overview', 'Analytics'],
  ])('renders authenticated route %s under AppShell and RequireAuth', (path, label) => {
    renderAt(path);
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
    expect(screen.getByTestId('require-auth')).toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('renders 404 on unknown paths', () => {
    renderAt('/unknown-path');
    expect(screen.getByText('404 Not Found')).toBeInTheDocument();
  });
});
