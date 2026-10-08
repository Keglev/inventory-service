/**
 * @file HamburgerMenu.test.tsx
 * @module __tests__/app/HamburgerMenu
 *
 * @description
 * Unit tests for <HamburgerMenu /> — verifies the menu button, open/close behavior,
 * and correct prop wiring to child menu content renderers.
 *
 * Test strategy:
 * - Smoke: renders the menu button and starts closed.
 * - Interaction: opens popover on click; closes on Escape.
 * - Integration (orchestrator): passes onSettingsOpen, onLogout and onClose to children.
 * - Trigger icon: three lines from md up, a person outline below md (FW5).
 * - i18n: uses translated label for the menu button.
 *
 * Notes:
 * - Child components are mocked to keep tests focused on orchestration behavior.
 * - We avoid brittle assertions on React's internal "second argument" to function components.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HamburgerMenu from '@/app/HamburgerMenu/HamburgerMenu';
import { tEn } from '@/__tests__/test/i18nEn';

// -----------------------------------------------------------------------------
// Minimal child-prop types for safe call extraction
// ----------------------------------------------------
type HamburgerMenuProps = {
  onSettingsOpen: () => void;
  onLogout: () => void;
};

type MenuSectionsRendererProps = {
  onSettingsOpen: () => void;
  onClose: () => void;
};

type LogoutMenuActionProps = {
  onLogout: () => void;
  onClose: () => void;
};

// -----------------------------------------------------------------------------
// Hoisted mocks
// -----------------------------------------------------------------------------
const mockUseTranslation = vi.hoisted(() => vi.fn());
const mockUseMediaQuery = vi.hoisted(() => vi.fn(() => false));

// Vitest generic is <ArgsTuple, ReturnType>
const mockMenuSectionsRenderer = vi.hoisted(() =>
  vi.fn<(props: MenuSectionsRendererProps) => React.ReactElement>(() => <div>Menu Sections</div>),
);

const mockLogoutMenuAction = vi.hoisted(() =>
  vi.fn<(props: LogoutMenuActionProps) => React.ReactElement>(() => <div>Logout Action</div>),
);

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

// Below-md switch for the trigger icon; jsdom has no real media queries.
vi.mock('@mui/material/useMediaQuery', () => ({ default: mockUseMediaQuery }));

// Mock menu content components
vi.mock('@/app/HamburgerMenu/MenuContent/MenuSectionsRenderer', () => ({
  default: mockMenuSectionsRenderer,
}));

vi.mock('@/app/HamburgerMenu/MenuContent/LogoutMenuAction', () => ({
  default: mockLogoutMenuAction,
}));

describe('HamburgerMenu', () => {
  const mockOnSettingsOpen = vi.fn();
  const mockOnLogout = vi.fn();

  const defaultProps: HamburgerMenuProps = {
    onSettingsOpen: mockOnSettingsOpen,
    onLogout: mockOnLogout,
  };

  const arrange = (overrides?: Partial<HamburgerMenuProps>) =>
    render(<HamburgerMenu {...defaultProps} {...overrides} />);

  const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
    const menuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(menuButton);
    await screen.findByText('Menu Sections');
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
      i18n: { changeLanguage: vi.fn() },
    });
  });

  // ---------------------------------------------------------------------------
  // Smoke + initial state
  // ---------------------------------------------------------------------------
  it('renders hamburger menu button', () => {
    arrange();
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
  });

  it('menu is initially closed', () => {
    arrange();
    expect(screen.queryByText('Menu Sections')).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Interaction: open / close
  // ---------------------------------------------------------------------------
  it('opens menu popover when button is clicked', async () => {
    const user = userEvent.setup();
    arrange();

    await openMenu(user);

    expect(screen.getByText('Menu Sections')).toBeInTheDocument();
    expect(screen.getByText('Logout Action')).toBeInTheDocument();
  });

  it('closes menu when pressing Escape', async () => {
    const user = userEvent.setup();
    arrange();

    await openMenu(user);
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByText('Menu Sections')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Orchestrator: prop wiring to child components
  // ---------------------------------------------------------------------------
  it('renders MenuSectionsRenderer with correct props when open', async () => {
    const user = userEvent.setup();
    arrange();

    await openMenu(user);

    const lastProps = mockMenuSectionsRenderer.mock.calls.at(-1)?.[0];
    expect(lastProps).toEqual(expect.objectContaining({ onSettingsOpen: mockOnSettingsOpen }));
  });

  it('renders LogoutMenuAction with correct props when open', async () => {
    const user = userEvent.setup();
    arrange();

    await openMenu(user);

    const lastProps = mockLogoutMenuAction.mock.calls.at(-1)?.[0];
    expect(lastProps).toEqual(expect.objectContaining({ onLogout: mockOnLogout }));
  });

  it('passes onClose callback to MenuSectionsRenderer and LogoutMenuAction', async () => {
    const user = userEvent.setup();
    arrange();

    await openMenu(user);

    const sectionsProps = mockMenuSectionsRenderer.mock.calls.at(-1)?.[0];
    const logoutProps = mockLogoutMenuAction.mock.calls.at(-1)?.[0];

    expect(sectionsProps).toEqual(expect.objectContaining({ onClose: expect.any(Function) }));
    expect(logoutProps).toEqual(expect.objectContaining({ onClose: expect.any(Function) }));
  });

  it('shows the three-line icon from the md breakpoint up', () => {
    arrange();
    expect(screen.getByTestId('MenuIcon')).toBeInTheDocument();
    expect(screen.queryByTestId('PersonOutlineIcon')).not.toBeInTheDocument();
  });

  it('shows a person outline below the md breakpoint', () => {
    // The header shows a three-line drawer toggle there; two identical icons would be ambiguous.
    mockUseMediaQuery.mockReturnValue(true);
    arrange();
    expect(screen.getByTestId('PersonOutlineIcon')).toBeInTheDocument();
    expect(screen.queryByTestId('MenuIcon')).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // i18n wiring
  // ---------------------------------------------------------------------------
  it('uses translation for menu button label', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'actions.menu') return 'Menü';
      return defaultValue;
    });

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange();

    expect(screen.getByRole('button', { name: /menü/i })).toBeInTheDocument();
    expect(mockT).toHaveBeenCalledWith('actions.menu');
  });
});
