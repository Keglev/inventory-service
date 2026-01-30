/**
 * @file AuthCallback.test.tsx
 * @module __tests__/components/pages/auth/AuthCallback
 * @description Enterprise integration tests for the AuthCallback page (OAuth redirect target).
 *
 * Contract under test:
 * - On mount, calls GET /api/me to verify the session.
 * - While verification is pending, shows a centered loading UI.
 * - On success, hydrates auth state via useAuth().setUser and redirects to /dashboard (replace navigation).
 * - On failure (any rejected request), redirects to /login?error=session (replace navigation) and does not set user.
 * - If the component unmounts before the request resolves, it must not mutate auth state or navigate.
 *
 * Test strategy:
 * - Router navigation is mocked via useNavigate (no real route transitions).
 * - AuthContext is mocked via useAuth (only setUser is asserted).
 * - i18n is mocked to return defaultValue to keep text assertions stable across languages.
 * - httpClient.get is mocked deterministically (no network).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import AuthCallback from '../../../../pages/auth/AuthCallback';
import httpClient from '../../../../api/httpClient';

// -------------------------------------
// Deterministic / hoisted mocks
// -------------------------------------
const mockNavigate = vi.hoisted(() => vi.fn());
const mockSetUser = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Prefer defaultValue so tests stay stable if translation keys change.
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../../../../api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

// -------------------------------------
// Test helpers
// -------------------------------------
function renderAuthCallback() {
  return render(
    <MemoryRouter>
      <AuthCallback />
    </MemoryRouter>,
  );
}

describe('AuthCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Provide a stable auth context contract (only setUser is asserted in this suite).
    mockUseAuth.mockReturnValue({
      setUser: mockSetUser,
      user: null,
      loading: false,
      login: vi.fn(),
      loginAsDemo: vi.fn(),
      logout: vi.fn(),
      logoutInProgress: false,
    });
  });

  describe('loading UI', () => {
    it('renders a progress indicator and message while verifying the session', () => {
      renderAuthCallback();

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Verifying your login…')).toBeInTheDocument();
    });
  });

  describe('verification flow', () => {
    it('verifies session and redirects to dashboard on success', async () => {
      const userData = {
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'USER',
      };

      vi.mocked(httpClient.get).mockResolvedValue({ data: userData });

      renderAuthCallback();

      // Ensure the verification request was executed (part of the component contract).
      await waitFor(() => {
        expect(httpClient.get).toHaveBeenCalledWith('/api/me');
      });

      // On success: hydrate auth state and redirect (replace navigation).
      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(userData);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('redirects to login with session error on failure and does not set user', async () => {
      vi.mocked(httpClient.get).mockRejectedValue(new Error('Unauthorized'));

      renderAuthCallback();

      // Failure path must redirect and must not mutate auth state.
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login?error=session', { replace: true });
      });

      expect(mockSetUser).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('does not update auth state or navigate after unmount', async () => {
      let resolvePromise!: (value: { data: unknown }) => void;

      const pending = new Promise<{ data: unknown }>((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(httpClient.get).mockReturnValue(pending as never);

      const { unmount } = renderAuthCallback();

      // Simulate the cleanup/cancellation path inside the effect.
      unmount();

      // Resolve after unmount: component must ignore this result.
      resolvePromise({
        data: { email: 'test@example.com', fullName: 'Test User', role: 'USER' },
      });

      await waitFor(() => {
        expect(httpClient.get).toHaveBeenCalledWith('/api/me');
      });

      expect(mockSetUser).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
