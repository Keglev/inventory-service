/**
 * @file LoginPage.test.tsx
 * @module __tests__/components/pages/auth/LoginPage
 * @description Enterprise tests for the public LoginPage (SSO-only authentication entry).
 *
 * Contract under test:
 * - Renders the login card content (title/subtitle) and SSO UX copy (divider + hint).
 * - Google SSO button triggers useAuth().login().
 * - “Continue in Demo Mode” triggers useAuth().loginAsDemo() and redirects to /dashboard (replace navigation).
 * - When `?error=` is present in the URL, an error alert is rendered (severity="error") with a translated title.
 *
 * Test strategy:
 * - useAuth is mocked to assert user-intent actions (login / loginAsDemo).
 * - useNavigate is mocked to assert redirect behavior without real routing.
 * - i18n is mocked deterministically:
 *   - If a defaultValue is provided, it is used (stable UX text assertions for demo label).
 *   - Otherwise, the translation key is returned (stable key-based assertions).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import LoginPage from '../../../../pages/auth/LoginPage';

// -------------------------------------
// Deterministic / hoisted mocks
// -------------------------------------
const mockLogin = vi.hoisted(() => vi.fn());
const mockLoginAsDemo = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    /**
     * Mirrors common i18n usage patterns in the codebase:
     * - If defaultValue is provided, return it (lets us assert user-visible copy).
     * - Otherwise return the key (lets us assert keys without binding to locale JSON).
     */
    t: (key: string, defaultValue?: string | { defaultValue?: string }) => {
      if (typeof defaultValue === 'string') return defaultValue;
      if (typeof defaultValue === 'object' && defaultValue?.defaultValue) return defaultValue.defaultValue;
      return key;
    },
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
function renderLoginPage(initialRoute = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      login: mockLogin,
      loginAsDemo: mockLoginAsDemo,
      logout: vi.fn(),
      setUser: vi.fn(),
      user: null,
      loading: false,
      logoutInProgress: false,
    });
  });

  describe('rendering', () => {
    it('renders title/subtitle and supporting SSO copy', () => {
      renderLoginPage();

      // Card header texts: returned as keys by our i18n mock.
      expect(screen.getByText('signIn')).toBeInTheDocument();
      expect(screen.getByText('welcome')).toBeInTheDocument();

      // Divider + hint copy are also translation keys.
      expect(screen.getByText('or')).toBeInTheDocument();
      expect(screen.getByText('ssoHint')).toBeInTheDocument();
    });

    it('does not render an error alert when no error query param is present', () => {
      renderLoginPage();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('renders an error alert when an error query param is present', () => {
      renderLoginPage('/login?error=oauth');

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('errorTitle')).toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('calls login when the Google SSO button is clicked', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      /**
       * The Google button uses aria-label={t('signInGoogle')}.
       * With our i18n mock, the accessible name becomes "signInGoogle".
       */
      await user.click(screen.getByRole('button', { name: 'signInGoogle' }));

      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(mockLoginAsDemo).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('calls loginAsDemo and redirects to /dashboard when demo mode is clicked', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      /**
       * Demo button uses: t('continueDemo', 'Continue in Demo Mode')
       * Our i18n mock returns the defaultValue, so we assert the real UX label.
       */
      await user.click(screen.getByRole('button', { name: 'Continue in Demo Mode' }));

      expect(mockLoginAsDemo).toHaveBeenCalledTimes(1);
      expect(mockLogin).not.toHaveBeenCalled();

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
});
