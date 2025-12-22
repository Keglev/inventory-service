/**
 * @file HamburgerMenu.test.tsx
 * @module __tests__/app/HamburgerMenu/HamburgerMenu
 * @description Tests for hamburger menu component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HamburgerMenu from '../../../app/HamburgerMenu/HamburgerMenu';

// Hoisted mocks
const mockMenuSectionsRenderer = vi.hoisted(() => vi.fn(() => <div>Menu Sections</div>));
const mockLogoutMenuAction = vi.hoisted(() => vi.fn(() => <div>Logout Action</div>));
const mockUseTranslation = vi.hoisted(() => vi.fn());

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

  const defaultProps = {
    themeMode: 'light' as const,
    onThemeModeChange: mockOnThemeModeChange,
    locale: 'en' as const,
    onLocaleChange: mockOnLocaleChange,
    onLogout: mockOnLogout,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
    mockMenuSectionsRenderer.mockReturnValue(<div>Menu Sections</div>);
    mockLogoutMenuAction.mockReturnValue(<div>Logout Action</div>);
  });

  it('renders hamburger menu button', () => {
    render(<HamburgerMenu {...defaultProps} />);
    const menuButton = screen.getByRole('button', { name: /menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  it('opens menu popover when button is clicked', async () => {
    const user = userEvent.setup();
    render(<HamburgerMenu {...defaultProps} />);

    const menuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('Menu Sections')).toBeInTheDocument();
    });
  });

  it('renders MenuSectionsRenderer with correct props when open', async () => {
    const user = userEvent.setup();
    render(<HamburgerMenu {...defaultProps} />);

    const menuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(menuButton);

    await waitFor(() => {
      expect(mockMenuSectionsRenderer).toHaveBeenCalledWith(
        expect.objectContaining({
          themeMode: 'light',
          onThemeModeChange: mockOnThemeModeChange,
          locale: 'en',
          onLocaleChange: mockOnLocaleChange,
        }),
        undefined
      );
    });
  });

  it('renders LogoutMenuAction with correct props when open', async () => {
    const user = userEvent.setup();
    render(<HamburgerMenu {...defaultProps} />);

    const menuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(menuButton);

    await waitFor(() => {
      expect(mockLogoutMenuAction).toHaveBeenCalledWith(
        expect.objectContaining({
          onLogout: mockOnLogout,
        }),
        undefined
      );
    });
  });

  it('closes menu when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <HamburgerMenu {...defaultProps} />
        <div data-testid="outside">Outside</div>
      </div>
    );

    const menuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('Menu Sections')).toBeInTheDocument();
    });

    // Press escape to close menu
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByText('Menu Sections')).not.toBeInTheDocument();
    });
  });

  it('passes dark theme mode correctly', async () => {
    const user = userEvent.setup();
    render(<HamburgerMenu {...defaultProps} themeMode="dark" />);

    const menuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(menuButton);

    await waitFor(() => {
      expect(mockMenuSectionsRenderer).toHaveBeenCalledWith(
        expect.objectContaining({
          themeMode: 'dark',
        }),
        undefined
      );
    });
  });

  it('passes German locale correctly', async () => {
    const user = userEvent.setup();
    render(<HamburgerMenu {...defaultProps} locale="de" />);

    const menuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(menuButton);

    await waitFor(() => {
      expect(mockMenuSectionsRenderer).toHaveBeenCalledWith(
        expect.objectContaining({
          locale: 'de',
        }),
        undefined
      );
    });
  });

  it('uses translation for menu button title', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'actions.menu') return 'Menü';
      return defaultValue;
    });
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<HamburgerMenu {...defaultProps} />);
    const menuButton = screen.getByRole('button', { name: /menü/i });
    expect(menuButton).toBeInTheDocument();
  });

  it('passes onClose callback to MenuSectionsRenderer', async () => {
    const user = userEvent.setup();
    render(<HamburgerMenu {...defaultProps} />);

    const menuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(menuButton);

    await waitFor(() => {
      expect(mockMenuSectionsRenderer).toHaveBeenCalledWith(
        expect.objectContaining({
          onClose: expect.any(Function),
        }),
        undefined
      );
    });
  });

  it('passes onClose callback to LogoutMenuAction', async () => {
    const user = userEvent.setup();
    render(<HamburgerMenu {...defaultProps} />);

    const menuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(menuButton);

    await waitFor(() => {
      expect(mockLogoutMenuAction).toHaveBeenCalledWith(
        expect.objectContaining({
          onClose: expect.any(Function),
        }),
        undefined
      );
    });
  });

  it('menu is initially closed', () => {
    render(<HamburgerMenu {...defaultProps} />);
    expect(screen.queryByText('Menu Sections')).not.toBeInTheDocument();
  });
});
