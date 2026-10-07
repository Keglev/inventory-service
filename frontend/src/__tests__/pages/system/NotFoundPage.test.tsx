/**
 * @file NotFoundPage.test.tsx
 * @module __tests__/components/pages/system/NotFoundPage
 * @description Contract tests for the `NotFoundPage` route component.
 *
 * Contract under test:
 * - Renders the i18n-backed title and body copy.
 * - Renders exactly one primary action button.
 * - Routes the user to:
 *   - `/dashboard` when authenticated
 *   - `/login` when unauthenticated
 *   using `{ replace: true }`.
 *
 * Out of scope:
 * - MUI styling/classes and layout implementation details.
 * - i18n translation correctness (we mock translation deterministically).
 *
 * Test strategy:
 * - Mock `useAuth` to control authenticated vs unauthenticated states.
 * - Mock `useNavigate` and assert on navigation target + replace flag.
 * - Assert observable behavior via text and accessible button roles.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotFoundPage from '@/pages/system/NotFoundPage';
import { useAuth } from '@/hooks/useAuth';
import type { AppUser, AuthContextType } from '@/context/auth/authTypes';

// Deterministic i18n: return "namespace:key" so assertions are stable.
vi.mock('react-i18next', () => ({
  useTranslation: (namespace: string) => ({
    t: (key: string) => `${namespace}:${key}`,
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockedUseAuth = vi.mocked(useAuth);

const userFixture = (overrides: Partial<AppUser> = {}): AppUser => ({
  email: 'user@example.com',
  fullName: 'Test User',
  role: 'USER',
  isDemo: false,
  ...overrides,
});

/**
 * `NotFoundPage` only reads `{ user }` from the auth context.
 * We keep the mock payload minimal and centralize the cast.
 */
const setAuthUser = (user: AppUser | null) => {
  mockedUseAuth.mockReturnValue((({ user } as Pick<AuthContextType, 'user'>) as AuthContextType));
};

const renderPage = () => render(<NotFoundPage />);

describe('NotFoundPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the i18n-backed title and body copy', () => {
    setAuthUser(null);
    renderPage();

    expect(screen.getByText('system:notFound.title')).toBeInTheDocument();
    expect(screen.getByText('system:notFound.body')).toBeInTheDocument();
  });

  it.each([
    {
      name: 'unauthenticated: shows sign-in label and navigates to /login',
      user: null,
      buttonLabel: 'auth:signIn',
      expectedPath: '/login',
    },
    {
      name: 'authenticated: shows dashboard label and navigates to /dashboard',
      user: userFixture(),
      buttonLabel: 'common:nav.dashboard',
      expectedPath: '/dashboard',
    },
  ])('$name', async ({ user, buttonLabel, expectedPath }) => {
    const ui = userEvent.setup();
    setAuthUser(user);

    renderPage();

    const button = screen.getByRole('button', { name: buttonLabel });
    expect(button).toHaveAttribute('type', 'button');

    await ui.click(button);
    expect(mockNavigate).toHaveBeenCalledWith(expectedPath, { replace: true });
  });
});
