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
 * - Rail variant: label as a caption under the icon, same link target (FW6 UX-1)
 *
 * Out of scope:
 * - Active route highlighting / selection logic (covered in NavItem.active-state.test.tsx)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderNavItem } from '@/__tests__/app/layout/sidebar/fixtures';

describe('NavItem (rendering)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

    it('swallows clicks while disabled so navigation cannot fire', () => {
      renderNavItem({ to: '/analytics', label: 'Analytics', disabled: true });

      const link = screen.getByText('Analytics').closest('a') as HTMLAnchorElement;
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      link.dispatchEvent(clickEvent);

      // preventDefault marks the event as cancelled: the router never navigates.
      expect(clickEvent.defaultPrevented).toBe(true);
    });
  });

  describe('Rail variant', () => {
    it('renders the label as a caption under the icon when variant is rail', () => {
      const { container } = renderNavItem({ label: 'Inventar', variant: 'rail' });

      const caption = container.querySelector('.MuiTypography-caption');
      expect(caption).toHaveTextContent('Inventar');
      expect(container.querySelector('.MuiListItemIcon-root')).not.toBeInTheDocument();
      expect(container.querySelector('a')).toHaveStyle({ flexDirection: 'column' });
    });

    it('keeps the link target when variant is rail', () => {
      renderNavItem({ to: '/inventory', label: 'Inventar', variant: 'rail' });

      expect(screen.getByRole('link', { name: 'Inventar' })).toHaveAttribute('href', '/inventory');
    });

    it('renders the list row with icon slot and text when no variant is given', () => {
      const { container } = renderNavItem({ label: 'Inventar' });

      expect(container.querySelector('.MuiListItemIcon-root')).toBeInTheDocument();
      expect(container.querySelector('.MuiTypography-caption')).not.toBeInTheDocument();
    });
  });
});
