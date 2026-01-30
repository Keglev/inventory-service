/**
 * @file Home.test.tsx
 * @module __tests__/components/pages/home/Home
 * @description Enterprise tests for the Home (root landing) page.
 *
 * Contract under test:
 * - While auth state is hydrating, renders a progress indicator.
 * - If authenticated, redirects to /dashboard using <Navigate replace>.
 * - If unauthenticated, renders a landing card with:
 *   - "Sign in" → navigates to /login
 *   - "Continue in Demo Mode" → calls loginAsDemo() and navigates to /dashboard (replace)
 * - Renders supporting copy ("welcome", "or", "ssoHint") and branding.
 *
 * Test strategy:
 * - useAuth is mocked to simulate loading/authenticated/unauthenticated states deterministically.
 * - Router is exercised using <MemoryRouter> + <Routes> to validate <Navigate> redirects.
 * - useNavigate is mocked only for imperative navigation triggered by button clicks.
 * - i18n is mocked to prefer defaultValue when provided and otherwise return translation keys.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import Home from '../../../../pages/home/Home';

// -------------------------------------
// Deterministic / hoisted mocks
// -------------------------------------
const mockNavigate = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue ?? key,
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

// -------------------------------------
// Helpers
// -------------------------------------
function givenAuth(state: { user: unknown; loading: boolean; loginAsDemo?: () => void }) {
  mockUseAuth.mockReturnValue({
    user: state.user,
    loading: state.loading,
    loginAsDemo: state.loginAsDemo ?? vi.fn(),
  });
}

function renderHomeAt(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Target route for <Navigate> redirect assertions */}
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        {/* Target route for sign-in navigation */}
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('auth gating', () => {
    it('shows a loading spinner while auth is hydrating', () => {
      givenAuth({ user: null, loading: true });

      renderHomeAt('/');

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('redirects to /dashboard when authenticated (Navigate replace)', () => {
      givenAuth({ user: { id: '1', email: 'test@example.com' }, loading: false });

      renderHomeAt('/');

      // Home returns <Navigate to="/dashboard" replace />, so we assert router outcome.
      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      // No imperative navigation should be required for this path.
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('landing experience (unauthenticated)', () => {
    beforeEach(() => {
      givenAuth({ user: null, loading: false });
    });

    it('renders branding, supporting copy, and primary actions', () => {
      renderHomeAt('/');

      expect(screen.getByText('SmartSupplyPro')).toBeInTheDocument();
      expect(screen.getByText('welcome')).toBeInTheDocument();
      expect(screen.getByText('or')).toBeInTheDocument();
      expect(screen.getByText('ssoHint')).toBeInTheDocument();

      expect(screen.getByRole('button', { name: /signIn/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Continue in Demo Mode/i })).toBeInTheDocument();
    });

    it('navigates to /login when "sign in" is clicked', async () => {
      const user = userEvent.setup();
      renderHomeAt('/');

      await user.click(screen.getByRole('button', { name: /signIn/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('starts demo mode and navigates to /dashboard (replace) when demo is clicked', async () => {
      const user = userEvent.setup();
      const loginAsDemo = vi.fn();

      givenAuth({ user: null, loading: false, loginAsDemo });

      renderHomeAt('/');

      await user.click(screen.getByRole('button', { name: /Continue in Demo Mode/i }));

      expect(loginAsDemo).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
});
