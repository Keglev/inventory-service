/**
 * @file AppRouter.test.tsx
 * @module __tests__/routes/AppRouter
 *
 * @summary
 * Test suite for AppRouter component.
 * Tests: route rendering, public/authenticated route separation, loading state, 404 handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet } from 'react-router-dom';
import AppRouter from '../../routes/AppRouter';
import { useAuth } from '../../hooks/useAuth';

// Mock the auth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock all page components
vi.mock('../../pages/home/Home', () => ({
  default: () => <div>Home Page</div>,
}));

vi.mock('../../pages/auth/LoginPage', () => ({
  default: () => <div>Login Page</div>,
}));

vi.mock('../../pages/auth/AuthCallback', () => ({
  default: () => <div>Auth Callback</div>,
}));

vi.mock('../../pages/auth/LogoutSuccess', () => ({
  default: () => <div>Logout Success</div>,
}));

vi.mock('../../pages/auth/LogoutPage', () => ({
  default: () => <div>Logout Page</div>,
}));

vi.mock('../../pages/system/NotFoundPage', () => ({
  default: () => <div>404 Not Found</div>,
}));

vi.mock('../../pages/dashboard/Dashboard', () => ({
  default: () => <div>Dashboard</div>,
}));

vi.mock('../../pages/inventory/InventoryBoard', () => ({
  default: () => <div>Inventory Board</div>,
}));

vi.mock('../../pages/suppliers/SuppliersBoard', () => ({
  default: () => <div>Suppliers Board</div>,
}));

vi.mock('../../pages/analytics/Analytics', () => ({
  default: () => <div>Analytics</div>,
}));

vi.mock('../../app/layout/AppShell', () => ({
  default: () => (
    <div>
      AppShell: <Outlet />
    </div>
  ),
}));

vi.mock('../../app/public-shell', () => ({
  AppPublicShell: () => (
    <div>
      PublicShell: <Outlet />
    </div>
  ),
}));

vi.mock('../../features/auth', () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => (
    <div>RequireAuth: {children}</div>
  ),
}));

const mockUseAuth = useAuth as unknown as { mockReturnValue: (value: unknown) => void };

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRouter />
    </MemoryRouter>
  );

const setAuthLoading = (loading: boolean) => {
  mockUseAuth.mockReturnValue({ loading });
};

describe('AppRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading screen when auth is loading', () => {
    // Arrange
    setAuthLoading(true);

    // Act
    renderAt('/');

    // Assert
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render routes when auth is not loading', () => {
    // Arrange
    setAuthLoading(false);

    // Act
    renderAt('/');

    // Assert
    expect(screen.getByText(/PublicShell:/)).toBeInTheDocument();
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('should render home page on root path', () => {
    // Arrange
    setAuthLoading(false);

    // Act
    renderAt('/');

    // Assert
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('should render login page on /login path', () => {
    // Arrange
    setAuthLoading(false);

    // Act
    renderAt('/login');

    // Assert
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should render auth callback on /auth path', () => {
    // Arrange
    setAuthLoading(false);

    // Act
    renderAt('/auth');

    // Assert
    expect(screen.getByText('Auth Callback')).toBeInTheDocument();
  });

  it('should render logout success on /logout-success path', () => {
    // Arrange
    setAuthLoading(false);

    // Act
    renderAt('/logout-success');

    // Assert
    expect(screen.getByText('Logout Success')).toBeInTheDocument();
  });

  it('should render logout page on /logout path', () => {
    // Arrange
    setAuthLoading(false);

    // Act
    renderAt('/logout');

    // Assert
    expect(screen.getByText('Logout Page')).toBeInTheDocument();
  });

  it('should render dashboard in AppShell on /dashboard path', () => {
    // Arrange
    setAuthLoading(false);

    // Act
    renderAt('/dashboard');

    // Assert
    expect(screen.getByText(/AppShell:/)).toBeInTheDocument();
    expect(screen.getByText(/RequireAuth:/)).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should render inventory board in AppShell on /inventory path', () => {
    // Arrange
    setAuthLoading(false);

    // Act
    renderAt('/inventory');

    // Assert
    expect(screen.getByText(/AppShell:/)).toBeInTheDocument();
    expect(screen.getByText(/RequireAuth:/)).toBeInTheDocument();
    expect(screen.getByText('Inventory Board')).toBeInTheDocument();
  });

  it('should render suppliers board in AppShell on /suppliers path', () => {
    // Arrange
    setAuthLoading(false);

    // Act
    renderAt('/suppliers');

    // Assert
    expect(screen.getByText(/AppShell:/)).toBeInTheDocument();
    expect(screen.getByText(/RequireAuth:/)).toBeInTheDocument();
    expect(screen.getByText('Suppliers Board')).toBeInTheDocument();
  });

  it('should render analytics in AppShell on /analytics path', () => {
    // Arrange
    setAuthLoading(false);

    // Act
    renderAt('/analytics');

    // Assert
    expect(screen.getByText(/AppShell:/)).toBeInTheDocument();
    expect(screen.getByText(/RequireAuth:/)).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('should render 404 not found on unknown path', () => {
    // Arrange
    setAuthLoading(false);

    // Act
    renderAt('/unknown-path');

    // Assert
    expect(screen.getByText('404 Not Found')).toBeInTheDocument();
  });

  it('should wrap authenticated routes with RequireAuth', () => {
    // Arrange
    setAuthLoading(false);

    // Act
    renderAt('/dashboard');

    // Assert
    expect(screen.getByText(/RequireAuth:/)).toBeInTheDocument();
  });

  it('should render public routes outside AppShell', () => {
    // Arrange
    setAuthLoading(false);

    // Act
    renderAt('/');

    // Assert
    expect(screen.getByText(/PublicShell:/)).toBeInTheDocument();
    expect(screen.queryByText(/AppShell:/)).not.toBeInTheDocument();
  });
});
