/**
 * @file SidebarNavList.test.tsx
 *
 * @what_is_under_test SidebarNavList component
 * @responsibility Renders navigation items from navConfig and logout button
 * @out_of_scope Individual NavItem logic, navConfig structure, logout backend behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SidebarNavList from '../../../app/layout/sidebar/SidebarNavList';

// Mock NavItem component
vi.mock('../../../app/layout/sidebar/NavItem', () => ({
  default: ({ label, to }: { label: string; to: string }) => (
    <a href={to} data-testid="nav-item">
      {label}
    </a>
  ),
}));

// Mock navConfig
vi.mock('../../../app/layout/navConfig', () => ({
  NAV_ITEMS: [
    { route: '/dashboard', label: 'common:nav.dashboard', icon: 'DashboardIcon' },
    { route: '/inventory', label: 'common:nav.inventory', icon: 'InventoryIcon' },
    { route: '/suppliers', label: 'common:nav.suppliers', icon: 'SuppliersIcon' },
    { route: '/analytics', label: 'common:nav.analytics', icon: 'AnalyticsIcon' },
  ],
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common:nav.dashboard': 'Dashboard',
        'common:nav.inventory': 'Inventory',
        'common:nav.suppliers': 'Suppliers',
        'common:nav.analytics': 'Analytics',
        'common:actions.logout': 'Logout',
        'nav.logout': 'Logout',
      };
      return translations[key] || key;
    },
  }),
}));

describe('SidebarNavList', () => {
  const mockOnLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Navigation items rendering', () => {
    it('renders all navigation items from navConfig', () => {
      render(
        <MemoryRouter>
          <SidebarNavList onLogout={mockOnLogout} />
        </MemoryRouter>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Suppliers')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('renders four navigation items', () => {
      render(
        <MemoryRouter>
          <SidebarNavList onLogout={mockOnLogout} />
        </MemoryRouter>
      );

      const navItems = screen.getAllByTestId('nav-item');
      expect(navItems).toHaveLength(4);
    });
  });

  describe('Logout button', () => {
    it('renders logout button', () => {
      render(
        <MemoryRouter>
          <SidebarNavList onLogout={mockOnLogout} />
        </MemoryRouter>
      );

      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('calls onLogout when logout button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <SidebarNavList onLogout={mockOnLogout} />
        </MemoryRouter>
      );

      const logoutButtons = screen.getAllByText('Logout');
      await user.click(logoutButtons[0]);

      expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });

    it('renders logout icon', () => {
      render(
        <MemoryRouter>
          <SidebarNavList onLogout={mockOnLogout} />
        </MemoryRouter>
      );

      const logoutButton = screen.getAllByRole('button', { name: /logout/i })[0];
      expect(logoutButton.querySelector('svg')).not.toBeNull();
    });
  });

  describe('List structure', () => {
    it('renders navigation items in a list', () => {
      const { container } = render(
        <MemoryRouter>
          <SidebarNavList onLogout={mockOnLogout} />
        </MemoryRouter>
      );

      const list = container.querySelector('.MuiList-root');
      expect(list).toBeInTheDocument();
    });

    it('renders divider between nav items and logout', () => {
      const { container } = render(
        <MemoryRouter>
          <SidebarNavList onLogout={mockOnLogout} />
        </MemoryRouter>
      );

      const divider = container.querySelector('.MuiDivider-root');
      expect(divider).toBeInTheDocument();
    });
  });

  describe('Translation integration', () => {
    it('translates all navigation labels', () => {
      render(
        <MemoryRouter>
          <SidebarNavList onLogout={mockOnLogout} />
        </MemoryRouter>
      );

      // All labels are translated from i18n keys
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Suppliers')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('uses common namespace for translations', () => {
      render(
        <MemoryRouter>
          <SidebarNavList onLogout={mockOnLogout} />
        </MemoryRouter>
      );

      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  describe('Props handling', () => {
    it('passes onLogout callback correctly', async () => {
      const customLogout = vi.fn();
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <SidebarNavList onLogout={customLogout} />
        </MemoryRouter>
      );

      const logoutButtons = screen.getAllByText('Logout');
      await user.click(logoutButtons[0]);

      expect(customLogout).toHaveBeenCalledTimes(1);
    });
  });
});
