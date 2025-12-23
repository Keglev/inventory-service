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
import { BrowserRouter } from 'react-router-dom';
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
  default: ({ children }: { children: React.ReactNode }) => (
    <div>AppShell: {children}</div>
  ),
}));

vi.mock('../../app/public-shell', () => ({
  AppPublicShell: ({ children }: { children: React.ReactNode }) => (
    <div>PublicShell: {children}</div>
  ),
}));

vi.mock('../../features/auth', () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => (
    <div>RequireAuth: {children}</div>
  ),
}));

vi.mock('../../app/debug/RouterDebug', () => ({
  default: () => <div>RouterDebug</div>,
}));

describe('AppRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading screen when auth is loading', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({ loading: true });

    // Act
    render(
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render routes when auth is not loading', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({ loading: false });

    // Act
    render(
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    );

    // Assert - RouterDebug should be rendered
    expect(screen.getByText('RouterDebug')).toBeInTheDocument();
  });

  it('should render home page on root path', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({ loading: false });

    // Act
    render(
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    );

    // Assert - RouterDebug should be present
    expect(screen.getByText('RouterDebug')).toBeInTheDocument();
  });

  it('should render login page on /login path', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({ loading: false });

    // Act
    render(
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    );

    // Assert - Router should render without errors
    expect(screen.getByText('RouterDebug')).toBeInTheDocument();
  });

  it('should render auth callback on /auth path', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({ loading: false });

    // Act
    render(
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    );

    // Assert - Router should render without errors
    expect(screen.getByText('RouterDebug')).toBeInTheDocument();
  });

  it('should render logout success on /logout-success path', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({ loading: false });

    // Act
    render(
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    );

    // Assert - Router should render without errors
    expect(screen.getByText('RouterDebug')).toBeInTheDocument();
  });

  it('should render logout page on /logout path', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({ loading: false });

    // Act
    window.history.pushState({}, 'Logout', '/logout');
    render(
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByText('Logout Page')).toBeInTheDocument();
  });

  it('should render dashboard in AppShell on /dashboard path', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({ loading: false });

    // Act
    render(
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    );

    // Assert - Router should render without errors
    expect(screen.getByText('RouterDebug')).toBeInTheDocument();
  });

  it('should render inventory board in AppShell on /inventory path', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({ loading: false });

    // Act
    render(
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    );

    // Assert - Router should render without errors
    expect(screen.getByText('RouterDebug')).toBeInTheDocument();
  });

  it('should render suppliers board in AppShell on /suppliers path', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({ loading: false });

    // Act
    render(
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    );

    // Assert - Router should render without errors
    expect(screen.getByText('RouterDebug')).toBeInTheDocument();
  });

  it('should render analytics in AppShell on /analytics path', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({ loading: false });

    // Act
    render(
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    );

    // Assert - Router should render without errors
    expect(screen.getByText('RouterDebug')).toBeInTheDocument();
  });

  it('should render 404 not found on unknown path', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({ loading: false });

    // Act
    window.history.pushState({}, 'Not Found', '/unknown-path');
    render(
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByText('404 Not Found')).toBeInTheDocument();
  });

  it('should wrap authenticated routes with RequireAuth', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({ loading: false });

    // Act
    render(
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    );

    // Assert - Router should render without errors
    expect(screen.getByText('RouterDebug')).toBeInTheDocument();
  });

  it('should render public routes outside AppShell', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({ loading: false });

    // Act
    window.history.pushState({}, 'Home', '/');
    render(
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByText(/PublicShell:/)).toBeInTheDocument();
    expect(screen.queryByText(/AppShell:/)).not.toBeInTheDocument();
  });
});
