/**
 * @file NotFoundPage.test.tsx
 * @description
 * Test suite for NotFoundPage component.
 * Verifies rendering, navigation logic based on auth state, and i18n integration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFoundPage from '@/pages/system/NotFoundPage';

// Mock useAuth hook to control authentication state
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock react-i18next for translation
vi.mock('react-i18next', () => ({
  useTranslation: (namespace: string) => ({
    t: (key: string) => `${namespace}:${key}`,
  }),
}));

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { useAuth } from '@/hooks/useAuth';

// Type for mocked useAuth hook
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('NotFoundPage', () => {
  // Helper function to render page with router context
  const renderNotFoundPage = () => {
    return render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('renders 404 title text', () => {
    // Verify that page displays the not found title using i18n key
    mockUseAuth.mockReturnValue({ user: null });
    renderNotFoundPage();
    expect(screen.getByText('system:notFound.title')).toBeInTheDocument();
  });

  it('renders 404 body text', () => {
    // Verify that page displays the not found message body
    mockUseAuth.mockReturnValue({ user: null });
    renderNotFoundPage();
    expect(screen.getByText('system:notFound.body')).toBeInTheDocument();
  });

  it('renders dashboard button when user is logged in', () => {
    // Verify that authenticated users see dashboard navigation option
    mockUseAuth.mockReturnValue({ user: { id: 1, name: 'John' } });
    renderNotFoundPage();
    expect(screen.getByText('common:nav.dashboard')).toBeInTheDocument();
  });

  it('renders sign in button when user is not authenticated', () => {
    // Verify that unauthenticated users see login option
    mockUseAuth.mockReturnValue({ user: null });
    renderNotFoundPage();
    expect(screen.getByText('auth:signIn')).toBeInTheDocument();
  });

  it('navigates to dashboard when authenticated user clicks button', () => {
    // Verify that logged-in user is redirected to dashboard on click
    mockUseAuth.mockReturnValue({ user: { id: 1, name: 'John' } });
    renderNotFoundPage();
    
    const button = screen.getByRole('button', { name: 'common:nav.dashboard' });
    fireEvent.click(button);
    
    // Verify navigate was called with dashboard path and replace flag
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('navigates to login when unauthenticated user clicks button', () => {
    // Verify that non-logged-in user is redirected to login on click
    mockUseAuth.mockReturnValue({ user: null });
    renderNotFoundPage();
    
    const button = screen.getByRole('button', { name: 'auth:signIn' });
    fireEvent.click(button);
    
    // Verify navigate was called with login path and replace flag
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('uses replace navigation option', () => {
    // Verify that navigation uses replace: true to prevent back button access to 404
    mockUseAuth.mockReturnValue({ user: null });
    renderNotFoundPage();
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Verify replace: true option was passed to prevent history stack issues
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ replace: true })
    );
  });

  it('renders outer container', () => {
    // Verify that the outer layout container is present
    mockUseAuth.mockReturnValue({ user: null });
    renderNotFoundPage();

    const outerBox = screen.getByText('system:notFound.title').closest('div')?.closest('div')?.closest('div');
    expect(outerBox).toBeInTheDocument();
  });

  it('renders button with contained variant', () => {
    // Verify that action button has contained styling
    mockUseAuth.mockReturnValue({ user: null });
    renderNotFoundPage();
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('MuiButton-contained');
  });

  it('handles undefined user gracefully', () => {
    // Verify that component renders correctly when user is undefined
    mockUseAuth.mockReturnValue({ user: undefined });
    renderNotFoundPage();
    
    // Should render login button since user is falsy
    expect(screen.getByText('auth:signIn')).toBeInTheDocument();
  });
});
