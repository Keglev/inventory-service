/**
 * @file AppToolbarActions.account-layout.test.tsx
 * @module __tests__/app/layout/AppToolbarActions.account-layout
 * @testing Vitest + React Testing Library; bell, help button and avatar menu mocked
 * @description
 * Tests for AppToolbarActions focused on:
 * - the avatar menu as the last action and its callback wiring (About, logout)
 * - the absence of the removed hamburger user menu (FW6 UX-1)
 * - the horizontal layout contract
 * Sibling spec: AppToolbarActions.bell-help.test.tsx (bell and help button).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppToolbarActions from '@/app/layout/AppToolbarActions';
import { tEn } from '@/__tests__/test/i18nEn';

vi.mock('@/features/help/components/HelpIconButton', () => ({
  HelpIconButton: ({ tooltip }: { tooltip: string }) => (
    <button type="button" data-testid="help-button" aria-label={tooltip}>
      Help
    </button>
  ),
}));

vi.mock('@/app/layout/header/NotificationBell', () => ({
  default: () => <div data-testid="notification-bell" />,
}));

vi.mock('@/app/AccountMenu/AccountMenu', () => ({
  default: ({ onAboutOpen, onLogout }: { onAboutOpen: () => void; onLogout: () => void }) => (
    <div data-testid="account-menu">
      <button type="button" onClick={onAboutOpen}>about</button>
      <button type="button" onClick={onLogout}>logout</button>
    </div>
  ),
}));

const mockUseTranslation = vi.hoisted(() => vi.fn());
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

type Props = React.ComponentProps<typeof AppToolbarActions>;

describe('AppToolbarActions (avatar menu + layout)', () => {
  const mockOnAboutOpen = vi.fn();
  const mockOnLogout = vi.fn();

  const baseProps: Props = {
    onAboutOpen: mockOnAboutOpen,
    onLogout: mockOnLogout,
    helpTopic: 'Dashboard',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
    });
  });

  function renderActions() {
    return render(<AppToolbarActions {...baseProps} />);
  }

  it('renders the bell, the help button and the avatar menu in that order', () => {
    const { container } = renderActions();

    const order = Array.from(container.firstElementChild?.children ?? []).map(
      (el) => el.getAttribute('data-testid'),
    );
    expect(order).toEqual(['notification-bell', 'help-button', 'account-menu']);
  });

  it('passes the About and logout callbacks to the avatar menu', async () => {
    const user = userEvent.setup();
    renderActions();

    await user.click(screen.getByRole('button', { name: 'about' }));
    await user.click(screen.getByRole('button', { name: 'logout' }));

    expect(mockOnAboutOpen).toHaveBeenCalledTimes(1);
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  it('renders no hamburger menu button when the toolbar is shown', () => {
    renderActions();

    expect(screen.queryByTestId('MenuIcon')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument();
  });

  it('renders actions in a horizontal flex layout', () => {
    const { container } = renderActions();

    expect(container.firstElementChild).toHaveStyle({ display: 'flex' });
  });
});
