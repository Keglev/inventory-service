/**
 * @file RequireAuth.test.tsx
 * @module __tests__/features/auth/guards/RequireAuth
 * @description Contract tests for the `RequireAuth` route guard.
 *
 * Contract under test:
 * - While auth is loading, renders `fallback` if provided, otherwise shows a progress indicator.
 * - If unauthenticated, redirects to `/login`.
 * - If logout is in progress and user is null, treats it as a loading state.
 * - DEMO users are allowed only when `allowDemo` is true; otherwise redirected to `/dashboard`.
 * - Authenticated non-demo users see the protected content.
 *
 * Out of scope:
 * - Detailed router behavior (React Router is assumed correct).
 * - `useAuth` implementation details (tested elsewhere).
 *
 * Test strategy:
 * - Use a small MemoryRouter + Routes harness so redirects are observable as rendered routes.
 * - Mock `useAuth` deterministically (no `any` casts).
 */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RequireAuth from '../../../../features/auth/guards/RequireAuth';
import { useAuth } from '../../../../hooks/useAuth';
import type { AuthContextType } from '../../../../context/auth/authTypes';

// Mock the useAuth hook
vi.mock('../../../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);

function renderRoute(ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="/protected" element={ui} />
      </Routes>
    </MemoryRouter>
  );
}

function setAuth(overrides: Partial<AuthContextType>) {
  // `RequireAuth` only depends on these three fields.
  useAuthMock.mockReturnValue({
    user: null,
    loading: false,
    logoutInProgress: false,
    setUser: vi.fn(),
    login: vi.fn(),
    loginAsDemo: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  });
}

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fallback while loading', () => {
    setAuth({ loading: true });
    renderRoute(
      <RequireAuth fallback={<div>Custom Loading</div>}>
        <div>Protected</div>
      </RequireAuth>
    );
    expect(screen.getByText('Custom Loading')).toBeInTheDocument();
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('uses the default loading indicator when loading and no fallback is provided', () => {
    setAuth({ loading: true });
    renderRoute(
      <RequireAuth>
        <div>Protected</div>
      </RequireAuth>
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('treats logoutInProgress with no user as a loading state (prevents login flash)', () => {
    setAuth({ user: null, loading: false, logoutInProgress: true });
    renderRoute(
      <RequireAuth>
        <div>Protected</div>
      </RequireAuth>
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to /login', () => {
    setAuth({ user: null, loading: false, logoutInProgress: false });
    renderRoute(
      <RequireAuth>
        <div>Protected</div>
      </RequireAuth>
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it.each([
    { name: 'regular authenticated user', user: { email: 'u@test.com', fullName: 'U', role: 'USER', isDemo: false } as const, allowDemo: undefined, expected: 'Protected' },
    { name: 'demo user allowed', user: { email: 'd@test.com', fullName: 'D', role: 'DEMO', isDemo: true } as const, allowDemo: true, expected: 'Protected' },
  ])('renders children for $name', ({ user, allowDemo, expected }) => {
    setAuth({ user, loading: false });
    renderRoute(
      <RequireAuth allowDemo={allowDemo}>
        <div>{expected}</div>
      </RequireAuth>
    );
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('redirects demo users to /dashboard when allowDemo is false', () => {
    setAuth({ user: { email: 'd@test.com', fullName: 'D', role: 'DEMO', isDemo: true } });
    renderRoute(
      <RequireAuth allowDemo={false}>
        <div>Protected</div>
      </RequireAuth>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
