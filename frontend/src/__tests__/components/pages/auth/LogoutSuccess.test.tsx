/**
 * @file LogoutSuccess.test.tsx
 * @module __tests__/components/pages/auth/LogoutSuccess
 * @description Enterprise tests for the LogoutSuccess page.
 *
 * Contract under test:
 * - Renders a success confirmation message after server-side logout completes.
 * - Provides a primary call-to-action to return to the login screen.
 * - Clicking the CTA navigates to `/login` using replace navigation to avoid back navigation into logout flow.
 *
 * Test strategy:
 * - i18n is mocked deterministically to return keys (stable assertions).
 * - Router navigation is mocked via useNavigate (no real routing side effects).
 * - Avoids brittle MUI styling/tag assertions (implementation details).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import LogoutSuccess from '../../../../pages/auth/LogoutSuccess';

// -------------------------------------
// Deterministic / hoisted mocks
// -------------------------------------
const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Return translation keys to keep tests stable and language-agnostic.
    t: (key: string) => key,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// -------------------------------------
// Helpers
// -------------------------------------
function renderLogoutSuccess() {
  return render(
    <MemoryRouter>
      <LogoutSuccess />
    </MemoryRouter>,
  );
}

describe('LogoutSuccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders success title and body copy', () => {
    renderLogoutSuccess();

    expect(screen.getByText('logoutSuccessTitle')).toBeInTheDocument();
    expect(screen.getByText('logoutSuccessBody')).toBeInTheDocument();
  });

  it('renders a sign-in call-to-action button', () => {
    renderLogoutSuccess();

    // The exact label depends on translations; we match the intent ("signIn" key).
    expect(screen.getByRole('button', { name: /signIn/i })).toBeInTheDocument();
  });

  it('navigates to /login with replace when the sign-in button is clicked', async () => {
    const user = userEvent.setup();
    renderLogoutSuccess();

    await user.click(screen.getByRole('button', { name: /signIn/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
