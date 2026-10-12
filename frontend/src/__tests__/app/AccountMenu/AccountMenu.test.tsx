/**
 * @file AccountMenu.test.tsx
 * @module __tests__/app/AccountMenu/AccountMenu
 * @testing Vitest + React Testing Library; real profile section and sign-out item, useAuth mocked
 * @description
 * The avatar menu that replaced the hamburger user menu (FW6 UX-1):
 * - initials from the signed-in user's name, a person icon when there is none
 * - accessible name "Account" and the full name as the button title
 * - menu contents: profile, About, sign-out; no settings entry
 * - About closes the menu before the dialog opens; sign-out calls onLogout
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountMenu from '@/app/AccountMenu/AccountMenu';
import { tEn } from '@/__tests__/test/i18nEn';

const mockUseAuth = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));

vi.mock('react-i18next', () => ({
  useTranslation: (ns?: string | string[]) => {
    const first = Array.isArray(ns) ? ns[0] : ns;
    return {
      t: (key: string, options?: Record<string, unknown>) =>
        tEn(key.includes(':') || !first ? key : `${first}:${key}`, options),
    };
  },
}));

describe('AccountMenu', () => {
  const onAboutOpen = vi.fn();
  const onLogout = vi.fn();

  const signIn = (fullName: string | undefined) =>
    mockUseAuth.mockReturnValue({
      user: { email: 'carlos@example.com', fullName, role: 'ADMIN', isDemo: false },
    });

  const renderMenu = () => render(<AccountMenu onAboutOpen={onAboutOpen} onLogout={onLogout} />);
  const avatarButton = () => screen.getByRole('button', { name: tEn('common:menu.account') });

  beforeEach(() => {
    vi.clearAllMocks();
    signIn('Carlos Keglevich');
  });

  it('shows the first and last initial of the user name', () => {
    renderMenu();

    expect(avatarButton()).toHaveTextContent('CK');
  });

  it('shows one initial for a one-word name and the demo initials for the demo user', () => {
    signIn('Carlos');
    const { unmount } = renderMenu();
    expect(avatarButton()).toHaveTextContent(/^C$/);
    unmount();

    signIn('Demo User');
    renderMenu();
    expect(avatarButton()).toHaveTextContent('DU');
  });

  it('shows a person icon instead of initials when the user has no name', () => {
    signIn(undefined);
    renderMenu();

    expect(avatarButton()).toHaveTextContent('');
    expect(screen.getByTestId('PersonOutlineIcon')).toBeInTheDocument();
  });

  it('names the button Account and puts the full name in its title', () => {
    renderMenu();

    expect(avatarButton()).toHaveAttribute('title', 'Carlos Keglevich');
    expect(avatarButton()).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('opens a menu with the profile, About and sign-out but no settings', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(avatarButton());

    expect(screen.getByText('Carlos Keglevich')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: tEn('common:menu.about') })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: tEn('common:nav.logout') })).toBeInTheDocument();
    expect(screen.queryByText(tEn('common:nav.settings'))).not.toBeInTheDocument();
    // The open menu hides the page from assistive tech, the avatar included.
    expect(screen.getByRole('button', { name: tEn('common:menu.account'), hidden: true })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('closes the menu and opens About when About is chosen', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(avatarButton());
    await user.click(screen.getByRole('menuitem', { name: tEn('common:menu.about') }));

    expect(onAboutOpen).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('calls onLogout when sign-out is chosen', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(avatarButton());
    await user.click(screen.getByRole('menuitem', { name: tEn('common:nav.logout') }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
