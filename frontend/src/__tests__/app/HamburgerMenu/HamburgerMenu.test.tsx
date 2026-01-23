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
 * - Integration (orchestrator): passes theme/locale props and onClose callbacks to children.
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
import HamburgerMenu from '../../../app/HamburgerMenu/HamburgerMenu';

// -----------------------------------------------------------------------------
// Minimal child-prop types for safe call extraction
// ----------------------------------------------------
type ThemeMode = 'light' | 'dark';
type Locale = 'en' | 'de';

type HamburgerMenuProps = {
  themeMode: ThemeMode;
  onThemeModeChange: () => void;
  locale: Locale;
  onLocaleChange: () => void;
  onLogout: () => void;
};

type MenuSectionsRendererProps = {
  themeMode: ThemeMode;
  onThemeModeChange: () => void;
  locale: Locale;
  onLocaleChange: () => void;
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

// Vitest generic is <ArgsTuple, ReturnType>
const mockMenuSectionsRenderer = vi.hoisted(() =>
  vi.fn<[MenuSectionsRendererProps], React.ReactElement>(() => <div>Menu Sections</div>),
);

const mockLogoutMenuAction = vi.hoisted(() =>
  vi.fn<[LogoutMenuActionProps], React.ReactElement>(() => <div>Logout Action</div>),
);

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

// Mock menu content components
vi.mock('../../../app/HamburgerMenu/MenuContent', () => ({
  MenuSectionsRenderer: mockMenuSectionsRenderer,
  LogoutMenuAction: mockLogoutMenuAction,
}));

describe('HamburgerMenu', () => {
  const mockOnThemeModeChange = vi.fn();
  const mockOnLocaleChange = vi.fn();
  const mockOnLogout = vi.fn();

  // IMPORTANT: explicitly type to avoid literal narrowing ("light" only / "en" only).
  const defaultProps: HamburgerMenuProps = {
    themeMode: 'light',
    onThemeModeChange: mockOnThemeModeChange,
    locale: 'en',
    onLocaleChange: mockOnLocaleChange,
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
      t: (_key: string, defaultValue: string) => defaultValue,
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
    expect(lastProps).toEqual(
      expect.objectContaining({
        themeMode: 'light',
        onThemeModeChange: mockOnThemeModeChange,
        locale: 'en',
        onLocaleChange: mockOnLocaleChange,
      }),
    );
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

  it('passes dark theme mode correctly', async () => {
    const user = userEvent.setup();
    arrange({ themeMode: 'dark' });

    await openMenu(user);

    const lastProps = mockMenuSectionsRenderer.mock.calls.at(-1)?.[0];
    expect(lastProps).toEqual(expect.objectContaining({ themeMode: 'dark' }));
  });

  it('passes German locale correctly', async () => {
    const user = userEvent.setup();
    arrange({ locale: 'de' });

    await openMenu(user);

    const lastProps = mockMenuSectionsRenderer.mock.calls.at(-1)?.[0];
    expect(lastProps).toEqual(expect.objectContaining({ locale: 'de' }));
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
    expect(mockT).toHaveBeenCalledWith('actions.menu', expect.any(String));
  });
});
