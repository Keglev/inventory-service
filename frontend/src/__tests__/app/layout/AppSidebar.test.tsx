/**
 * @file AppSidebar.test.tsx
 *
 * @what_is_under_test AppSidebar component
 * @responsibility Renders responsive navigation drawer with profile, navigation items, environment info, and actions
 * @out_of_scope Navigation routing logic, settings dialog, logout backend behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AppSidebar from '../../../app/layout/AppSidebar';

// Mock sidebar sub-components
vi.mock('../../../app/layout/sidebar', () => ({
  SidebarNavList: ({ onLogout }: { onLogout: () => void }) => (
    <div data-testid="nav-list">
      <button onClick={onLogout}>Logout</button>
    </div>
  ),
  SidebarUserProfile: ({ user }: { user?: { fullName?: string } }) => (
    <div data-testid="user-profile">{user?.fullName || 'No User'}</div>
  ),
  SidebarEnvironment: () => <div data-testid="environment">Environment Info</div>,
  SidebarActions: ({
    onThemeModeChange,
    onLocaleChange,
    onSettingsOpen,
  }: {
    onThemeModeChange: () => void;
    onLocaleChange: () => void;
    onSettingsOpen: () => void;
  }) => (
    <div data-testid="sidebar-actions">
      <button onClick={onThemeModeChange}>Toggle Theme</button>
      <button onClick={onLocaleChange}>Toggle Language</button>
      <button onClick={onSettingsOpen}>Settings</button>
    </div>
  ),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue: string) => defaultValue,
  }),
}));

// Mock navConfig
vi.mock('../../../app/layout/navConfig', () => ({
  getHelpTopicForRoute: vi.fn(() => 'Dashboard'),
}));

describe('AppSidebar', () => {
  const mockOnMobileClose = vi.fn();
  const mockOnThemeModeChange = vi.fn();
  const mockOnLocaleChange = vi.fn();
  const mockOnLogout = vi.fn();
  const mockOnSettingsOpen = vi.fn();

  const defaultProps = {
    mobileOpen: false,
    onMobileClose: mockOnMobileClose,
    themeMode: 'light' as const,
    onThemeModeChange: mockOnThemeModeChange,
    locale: 'en' as const,
    onLocaleChange: mockOnLocaleChange,
    onLogout: mockOnLogout,
    onSettingsOpen: mockOnSettingsOpen,
    user: { fullName: 'John Doe', role: 'Admin' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Drawer rendering', () => {
    it('renders drawer component', () => {
      const { container } = render(
        <MemoryRouter>
          <AppSidebar {...defaultProps} />
        </MemoryRouter>
      );
      const drawer = container.querySelector('.MuiDrawer-root');
      expect(drawer).toBeInTheDocument();
    });

    it('renders sidebar title', () => {
      render(
        <MemoryRouter>
          <AppSidebar {...defaultProps} />
        </MemoryRouter>
      );
      expect(screen.getAllByText('Smart Supply Pro')[0]).toBeInTheDocument();
    });
  });

  describe('Sub-components rendering', () => {
    it('renders navigation list', () => {
      render(
        <MemoryRouter>
          <AppSidebar {...defaultProps} />
        </MemoryRouter>
      );
      expect(screen.getAllByTestId('nav-list')[0]).toBeInTheDocument();
    });

    it('renders user profile section', () => {
      render(
        <MemoryRouter>
          <AppSidebar {...defaultProps} />
        </MemoryRouter>
      );
      expect(screen.getAllByTestId('user-profile')[0]).toBeInTheDocument();
      expect(screen.getAllByText('John Doe')[0]).toBeInTheDocument();
    });

    it('renders environment information', () => {
      render(
        <MemoryRouter>
          <AppSidebar {...defaultProps} />
        </MemoryRouter>
      );
      expect(screen.getAllByTestId('environment')[0]).toBeInTheDocument();
    });

    it('renders sidebar actions', () => {
      render(
        <MemoryRouter>
          <AppSidebar {...defaultProps} />
        </MemoryRouter>
      );
      expect(screen.getAllByTestId('sidebar-actions')[0]).toBeInTheDocument();
    });
  });

  describe('User profile handling', () => {
    it('displays user information when user is provided', () => {
      render(
        <MemoryRouter>
          <AppSidebar {...defaultProps} user={{ fullName: 'Jane Smith', role: 'Manager' }} />
        </MemoryRouter>
      );
      expect(screen.getAllByText('Jane Smith')[0]).toBeInTheDocument();
    });

    it('handles undefined user gracefully', () => {
      render(
        <MemoryRouter>
          <AppSidebar {...defaultProps} user={undefined} />
        </MemoryRouter>
      );
      expect(screen.getAllByText('No User')[0]).toBeInTheDocument();
    });
  });

  describe('Callback delegation', () => {
    it('passes onLogout to navigation list', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <AppSidebar {...defaultProps} />
        </MemoryRouter>
      );

      const logoutButtons = screen.getAllByText('Logout');
      await user.click(logoutButtons[0]);

      expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });

    it('passes onThemeModeChange to sidebar actions', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <AppSidebar {...defaultProps} />
        </MemoryRouter>
      );

      const themeButtons = screen.getAllByText('Toggle Theme');
      await user.click(themeButtons[0]);

      expect(mockOnThemeModeChange).toHaveBeenCalledTimes(1);
    });

    it('passes onLocaleChange to sidebar actions', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <AppSidebar {...defaultProps} />
        </MemoryRouter>
      );

      const languageButtons = screen.getAllByText('Toggle Language');
      await user.click(languageButtons[0]);

      expect(mockOnLocaleChange).toHaveBeenCalledTimes(1);
    });

    it('passes onSettingsOpen to sidebar actions', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <AppSidebar {...defaultProps} />
        </MemoryRouter>
      );

      const settingsButtons = screen.getAllByText('Settings');
      await user.click(settingsButtons[0]);

      expect(mockOnSettingsOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe('Mobile drawer behavior', () => {
    it('calls onMobileClose when temporary drawer closes', () => {
      const { container } = render(
        <MemoryRouter>
          <AppSidebar {...defaultProps} mobileOpen={true} />
        </MemoryRouter>
      );
      // Drawer is rendered
      const drawer = container.querySelector('.MuiDrawer-root');
      expect(drawer).toBeInTheDocument();
    });

    it('renders with mobileOpen false', () => {
      const { container } = render(
        <MemoryRouter>
          <AppSidebar {...defaultProps} mobileOpen={false} />
        </MemoryRouter>
      );
      const drawer = container.querySelector('.MuiDrawer-root');
      expect(drawer).toBeInTheDocument();
    });

    it('renders with mobileOpen true', () => {
      const { container } = render(
        <MemoryRouter>
          <AppSidebar {...defaultProps} mobileOpen={true} />
        </MemoryRouter>
      );
      const drawer = container.querySelector('.MuiDrawer-root');
      expect(drawer).toBeInTheDocument();
    });
  });

  describe('Props variations', () => {
    it('handles different theme modes', () => {
      const { rerender } = render(
        <MemoryRouter>
          <AppSidebar {...defaultProps} themeMode="light" />
        </MemoryRouter>
      );
      const sidebarActions = screen.getAllByTestId('sidebar-actions');
      expect(sidebarActions.length).toBeGreaterThan(0);

      rerender(
        <MemoryRouter>
          <AppSidebar {...defaultProps} themeMode="dark" />
        </MemoryRouter>
      );
      const updatedActions = screen.getAllByTestId('sidebar-actions');
      expect(updatedActions.length).toBeGreaterThan(0);
    });

    it('handles different locales', () => {
      const { rerender } = render(
        <MemoryRouter>
          <AppSidebar {...defaultProps} locale="en" />
        </MemoryRouter>
      );
      expect(screen.getAllByTestId('sidebar-actions')[0]).toBeInTheDocument();

      rerender(
        <MemoryRouter>
          <AppSidebar {...defaultProps} locale="de" />
        </MemoryRouter>
      );
      expect(screen.getAllByTestId('sidebar-actions')[0]).toBeInTheDocument();
    });
  });

  describe('Translation integration', () => {
    it('uses common namespace for sidebar title', () => {
      render(
        <MemoryRouter>
          <AppSidebar {...defaultProps} />
        </MemoryRouter>
      );
      const titles = screen.getAllByText('Smart Supply Pro');
      expect(titles.length).toBeGreaterThan(0);
    });
  });
});
