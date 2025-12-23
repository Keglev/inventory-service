/**
 * @file RequireAuth.test.tsx
 * @module __tests__/features/auth/guards/RequireAuth
 *
 * @summary
 * Test suite for RequireAuth authorization guard component.
 * Tests: authenticated/unauthenticated routing, demo user handling, loading state, fallback UI.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RequireAuth from '../../../../features/auth/guards/RequireAuth';
import { useAuth } from '../../../../hooks/useAuth';

// Mock the useAuth hook
vi.mock('../../../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state when auth is loading', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({
      user: null,
      loading: true,
      logoutInProgress: false,
    });

    // Act
    render(
      <BrowserRouter>
        <RequireAuth>
          <div>Protected Content</div>
        </RequireAuth>
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when user is authenticated', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({
      user: { id: '123', email: 'test@example.com', isDemo: false },
      loading: false,
      logoutInProgress: false,
    });

    // Act
    render(
      <BrowserRouter>
        <RequireAuth>
          <div>Protected Content</div>
        </RequireAuth>
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should show loading when logout is in progress', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({
      user: null,
      loading: false,
      logoutInProgress: true,
    });

    // Act
    render(
      <BrowserRouter>
        <RequireAuth>
          <div>Protected Content</div>
        </RequireAuth>
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should allow demo users when allowDemo is true', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({
      user: { id: 'demo-123', email: 'demo@example.com', isDemo: true },
      loading: false,
      logoutInProgress: false,
    });

    // Act
    render(
      <BrowserRouter>
        <RequireAuth allowDemo={true}>
          <div>Protected Content</div>
        </RequireAuth>
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect demo users when allowDemo is false or not set', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({
      user: { id: 'demo-123', email: 'demo@example.com', isDemo: true },
      loading: false,
      logoutInProgress: false,
    });

    // Act
    render(
      <BrowserRouter>
        <RequireAuth allowDemo={false}>
          <div>Protected Content</div>
        </RequireAuth>
      </BrowserRouter>
    );

    // Assert
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should use custom fallback UI when loading', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({
      user: null,
      loading: true,
      logoutInProgress: false,
    });

    const customFallback = <div>Custom Loading...</div>;

    // Act
    render(
      <BrowserRouter>
        <RequireAuth fallback={customFallback}>
          <div>Protected Content</div>
        </RequireAuth>
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should use default fallback UI when loading and no custom fallback provided', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({
      user: null,
      loading: true,
      logoutInProgress: false,
    });

    // Act
    render(
      <BrowserRouter>
        <RequireAuth>
          <div>Protected Content</div>
        </RequireAuth>
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render children for authenticated regular users', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuth as any).mockReturnValue({
      user: { id: '456', email: 'user@example.com', isDemo: false, name: 'John' },
      loading: false,
      logoutInProgress: false,
    });

    // Act
    render(
      <BrowserRouter>
        <RequireAuth>
          <div>Protected Content for John</div>
        </RequireAuth>
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByText('Protected Content for John')).toBeInTheDocument();
  });
});
