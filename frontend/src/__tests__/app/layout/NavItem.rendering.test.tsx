/**
 * @file NavItem.rendering.test.tsx
 * @module __tests__/app/layout/sidebar/NavItem.rendering
 * @description
 * Rendering and non-routing behavior tests for NavItem.
 *
 * Scope:
 * - Basic rendering (label, icon, link target)
 * - Disabled state rendering + optional tooltip usage
 * - Label edge cases (undefined, long text)
 *
 * Out of scope:
 * - Active route highlighting / selection logic (covered in NavItem.active-state.test.tsx)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NavItem from '../../../app/layout/sidebar/NavItem';

type Props = React.ComponentProps<typeof NavItem>;

describe('NavItem (rendering)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderNavItem(
    props: Partial<Props> = {},
    initialEntries: string[] = ['/'],
  ) {
    const merged: Props = {
      to: '/dashboard',
      icon: DashboardIcon,
      label: 'Dashboard',
      ...props,
    } as Props;

    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <NavItem {...merged} />
      </MemoryRouter>,
    );
  }

  describe('Basic rendering', () => {
    it('renders the navigation label', () => {
      // Ensures the user-facing label is visible.
      renderNavItem({ label: 'Dashboard' });

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders an icon element', () => {
      // Ensures an icon is displayed when provided.
      const { container } = renderNavItem();

      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders as a link targeting the provided route', () => {
      // Ensures correct wiring of the navigation href.
      const { container } = renderNavItem({ to: '/dashboard' });

      expect(container.querySelector('a[href="/dashboard"]')).toBeInTheDocument();
    });
  });

  describe('Disabled state', () => {
    it('renders a disabled navigation item when disabled=true', () => {
      // Disabled state is used for feature-gated or not-yet-available destinations.
      const { container } = renderNavItem({ to: '/reports', label: 'Reports', disabled: true });

      expect(container.querySelector('.Mui-disabled')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });

    it('still renders the label when disabled and tooltip text is provided', () => {
      // Tooltip wrapping should not break label visibility.
      renderNavItem({
        to: '/reports',
        label: 'Reports',
        disabled: true,
        tooltip: 'Feature coming soon',
      });

      expect(screen.getByText('Reports')).toBeInTheDocument();
    });
  });

  describe('Label variations', () => {
    it('does not crash when label is undefined', () => {
      // Defensive rendering: label may be conditionally omitted.
      const { container } = renderNavItem({ label: undefined });

      expect(container).toBeInTheDocument();
    });

    it('renders a long label without truncation errors', () => {
      // Ensures long labels do not break rendering.
      renderNavItem({
        to: '/analytics',
        label: 'Analytics and Reporting Dashboard',
      });

      expect(screen.getByText('Analytics and Reporting Dashboard')).toBeInTheDocument();
    });
  });
});
