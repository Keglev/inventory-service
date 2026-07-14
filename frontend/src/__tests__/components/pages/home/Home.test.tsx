/**
 * @file Home.test.tsx
 * @module __tests__/components/pages/home/Home
 * @testing Vitest + Testing Library, MemoryRouter with route targets, mocked useAuth and i18n.
 * @description Enterprise tests for the Home (public landing) page orchestrator.
 *
 * Contract under test:
 * - While auth state is hydrating, renders a progress indicator and no landing content.
 * - If authenticated, redirects to /dashboard using <Navigate replace>.
 * - If unauthenticated, composes the five landing sections in order: hero, features,
 *   how-it-works, engineering callout, final call to action.
 * - Both entry actions are wired identically at the top and the bottom of the page:
 *   demo -> loginAsDemo() + navigate('/dashboard', { replace: true }); sign-in -> navigate('/login').
 *
 * Out of scope:
 * - Section copy and layout (covered by the per-section tests in this directory).
 * - Header and footer chrome, which the public shell owns.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import Home from '../../../../pages/home/Home';
import { tEn } from '../../../test/i18nEn';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../../hooks/useAuth', () => ({ useAuth: mockUseAuth }));

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
        <Route path="/dashboard" element={<div>Dashboard</div>} />
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
      expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    });

    it('redirects to /dashboard when authenticated (Navigate replace)', () => {
      givenAuth({ user: { id: '1', email: 'test@example.com' }, loading: false });

      renderHomeAt('/');

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('landing composition (unauthenticated)', () => {
    beforeEach(() => {
      givenAuth({ user: null, loading: false });
    });

    it('renders the five landing sections in document order', () => {
      renderHomeAt('/');

      const headings = screen
        .getAllByRole('heading', { level: 2 })
        .map((node) => node.textContent);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Know what you hold, what it cost, and what moved.',
      );
      expect(headings).toEqual([
        'What it does',
        'How it works',
        'Built like production software',
        'See it with real data',
      ]);
    });

    it('exposes the demo entry action at the top and the bottom of the page', () => {
      renderHomeAt('/');

      expect(screen.getByRole('button', { name: /explore the live demo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /open the demo/i })).toBeInTheDocument();
    });
  });

  describe('entry actions (unauthenticated)', () => {
    it('starts demo mode and navigates to /dashboard (replace) from the hero', async () => {
      const user = userEvent.setup();
      const loginAsDemo = vi.fn();
      givenAuth({ user: null, loading: false, loginAsDemo });

      renderHomeAt('/');
      await user.click(screen.getByRole('button', { name: /explore the live demo/i }));

      expect(loginAsDemo).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('starts demo mode from the closing call to action as well', async () => {
      const user = userEvent.setup();
      const loginAsDemo = vi.fn();
      givenAuth({ user: null, loading: false, loginAsDemo });

      renderHomeAt('/');
      await user.click(screen.getByRole('button', { name: /open the demo/i }));

      expect(loginAsDemo).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('navigates to /login from the hero sign-in action', async () => {
      const user = userEvent.setup();
      givenAuth({ user: null, loading: false });

      renderHomeAt('/');
      await user.click(screen.getByRole('button', { name: /sign in with google/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
