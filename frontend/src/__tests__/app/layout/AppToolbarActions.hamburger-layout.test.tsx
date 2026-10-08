/**
 * @file AppToolbarActions.hamburger-layout.test.tsx
 * @module __tests__/app/layout/AppToolbarActions.hamburger-layout
 * @description
 * Tests for AppToolbarActions focused on:
 * - user menu presence and callback delegation
 * - overall composition (bell + help + user menu)
 * - basic layout contract (flex row)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppToolbarActions from '@/app/layout/AppToolbarActions';
import { tEn } from '@/__tests__/test/i18nEn';

vi.mock('@/features/help/components/HelpIconButton', () => ({
  HelpIconButton: ({ tooltip }: { tooltip: string }) => (
    <button type="button" aria-label={tooltip}>
      Help
    </button>
  ),
}));

vi.mock('@/app/layout/header/NotificationBell', () => ({
  default: () => <div data-testid="notification-bell" />,
}));

vi.mock('@/app/HamburgerMenu/HamburgerMenu', () => ({
  default: ({
    onLogout,
    onSettingsOpen,
  }: {
    onLogout: () => void;
    onSettingsOpen: () => void;
  }) => (
    <button
      type="button"
      data-testid="hamburger-menu"
      onClick={() => {
        // Simulate a user selecting options inside the hamburger menu.
        onLogout();
        onSettingsOpen();
      }}
    >
      Menu
    </button>
  ),
}));

/**
 * i18n mock:
 * Return defaultValue for stable rendering of labels/tooltips.
 */
const mockUseTranslation = vi.hoisted(() => vi.fn());
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

type Props = React.ComponentProps<typeof AppToolbarActions>;

describe('AppToolbarActions (hamburger + layout)', () => {
  const mockOnSettingsOpen = vi.fn();
  const mockOnLogout = vi.fn();

  const baseProps: Props = {
    onSettingsOpen: mockOnSettingsOpen,
    onAboutOpen: vi.fn(),
    onLogout: mockOnLogout,
    helpTopic: 'Dashboard',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
    });
  });

  function renderActions(props: Partial<Props> = {}) {
    return render(<AppToolbarActions {...baseProps} {...props} />);
  }

  it('renders the hamburger menu entry point', () => {
    // Ensures the user has access to the hamburger menu actions.
    renderActions();

    expect(screen.getByTestId('hamburger-menu')).toBeInTheDocument();
  });

  it('delegates onLogout and onSettingsOpen via the user menu', async () => {
    // Verifies callback wiring from AppToolbarActions down to HamburgerMenu.
    const user = userEvent.setup();
    renderActions();

    await user.click(screen.getByTestId('hamburger-menu'));

    expect(mockOnLogout).toHaveBeenCalledTimes(1);
    expect(mockOnSettingsOpen).toHaveBeenCalledTimes(1);
  });

  it('renders the full toolbar set (bell, help, user menu)', () => {
    // Smoke test to ensure all actions remain present in the toolbar.
    renderActions();

    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
    expect(screen.getByLabelText(/help/i)).toBeInTheDocument();
    expect(screen.getByTestId('hamburger-menu')).toBeInTheDocument();
  });

  it('renders actions in a horizontal flex layout', () => {
    // Layout contract: actions should be aligned horizontally.
    const { container } = renderActions();

    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveStyle({ display: 'flex' });
  });
});
