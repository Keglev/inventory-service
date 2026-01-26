/**
 * @file SidebarNavList.test.tsx
 * @module __tests__/app/layout/sidebar/SidebarNavList
 * @description
 * Tests for SidebarNavList.
 *
 * Scope:
 * - Renders navigation items from NAV_ITEMS (navConfig)
 * - Renders a logout action and delegates clicks to onLogout
 * - Basic list structure (MUI List + divider)
 *
 * Out of scope:
 * - Individual NavItem behavior (covered by NavItem tests)
 * - navConfig authoring and routing configuration
 * - logout backend behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SidebarNavList from '../../../../app/layout/sidebar/SidebarNavList';

/**
 * NavItem stub:
 * Keeps tests focused on list composition and wiring, not NavItem internals.
 */
vi.mock('../../../../app/layout/sidebar/NavItem', () => ({
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
vi.mock('../../../../app/layout/navConfig', () => ({
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

  function renderNavList(onLogout = vi.fn()) {
    return render(
      <MemoryRouter>
        <SidebarNavList onLogout={onLogout} />
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

  it('renders list structure with a divider separating navigation and logout', () => {
    // Layout contract: items are presented as a list with a clear separation before logout.
    const { container } = renderNavList();

    expect(container.querySelector('.MuiList-root')).toBeInTheDocument();
    expect(container.querySelector('.MuiDivider-root')).toBeInTheDocument();
  });

  it('renders a logout button with an icon', () => {
    // Ensures the logout affordance is present and visually identifiable.
    renderNavList();

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toBeInTheDocument();
    expect(logoutButton.querySelector('svg')).not.toBeNull();
  });

  it('calls onLogout when the logout button is clicked', async () => {
    // Verifies callback delegation for the logout action.
    const user = userEvent.setup();
    const onLogout = vi.fn();
    renderNavList(onLogout);

    await user.click(screen.getByRole('button', { name: /logout/i }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
