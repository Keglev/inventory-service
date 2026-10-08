/**
 * @file SidebarNavList.test.tsx
 * @module __tests__/app/layout/sidebar/SidebarNavList
 * @description
 * Tests for SidebarNavList.
 *
 * Scope:
 * - Renders navigation items from NAV_ITEMS (navConfig)
 * - Renders no sign-out entry (sign-out lives in the user menu, FW5 fork 1)
 * - Basic list structure (MUI List)
 *
 * Out of scope:
 * - Individual NavItem behavior (covered by NavItem tests)
 * - navConfig authoring and routing configuration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SidebarNavList from '@/app/layout/sidebar/SidebarNavList';

/**
 * NavItem stub:
 * Keeps tests focused on list composition and wiring, not NavItem internals.
 */
vi.mock('@/app/layout/sidebar/NavItem', () => ({
  default: ({ label, to }: { label?: string; to: string }) => (
    <a href={to} data-testid="nav-item">
      {label ?? ''}
    </a>
  ),
}));

/**
 * navConfig stub:
 * Deterministic nav items for assertions.
 */
vi.mock('@/app/layout/navConfig', () => ({
  NAV_ITEMS: [
    { route: '/dashboard', label: 'nav.dashboard', icon: 'DashboardIcon' },
    { route: '/inventory', label: 'nav.inventory', icon: 'InventoryIcon' },
    { route: '/suppliers', label: 'nav.suppliers', icon: 'SuppliersIcon' },
    { route: '/analytics/overview', label: 'nav.analytics', icon: 'AnalyticsIcon' },
  ],
}));

/**
 * i18n mock:
 * Translate a small set of keys to stable display strings.
 * Any unknown key falls back to itself to keep failures obvious.
 */
const mockUseTranslation = vi.hoisted(() => vi.fn());
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('SidebarNavList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'nav.dashboard': 'Dashboard',
          'nav.inventory': 'Inventory',
          'nav.suppliers': 'Suppliers',
          'nav.analytics': 'Analytics',
          'nav.logout': 'Logout',
          'common:actions.logout': 'Logout',
        };
        return translations[key] ?? key;
      },
    });
  });

  function renderNavList() {
    return render(
      <MemoryRouter>
        <SidebarNavList />
      </MemoryRouter>,
    );
  }

  it('renders all navigation items from navConfig', () => {
    // Ensures the configured navigation destinations are visible to the user.
    renderNavList();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Suppliers')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();

    expect(screen.getAllByTestId('nav-item')).toHaveLength(4);
  });

  it('renders the items as an MUI list', () => {
    const { container } = renderNavList();

    expect(container.querySelector('.MuiList-root')).toBeInTheDocument();
  });

  it('renders no sign-out entry', () => {
    // Paired with the presence check: the nav items rendered, the logout button did not.
    renderNavList();

    expect(screen.getAllByTestId('nav-item')).toHaveLength(4);
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });
});
