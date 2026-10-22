/**
 * @file NavItem.active-state.test.tsx
 * @module __tests__/app/layout/sidebar/NavItem.active-state
 * @description
 * Route selection/highlighting tests for NavItem.
 *
 * Scope:
 * - Ensures the "selected" visual state reflects the current route.
 * - Covers exact match and "startsWith" match behavior.
 * - aria-current="page" on the selected entry, so the highlight is not colour-only.
 *
 * Notes:
 * - These assertions intentionally couple to MUI's `.Mui-selected` marker.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderNavItem } from '@/__tests__/app/layout/sidebar/fixtures';

describe('NavItem (active state)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks the item as selected when the current route matches exactly', () => {
    // Business rule: selected state must reflect the current route for UX clarity.
    const { container } = renderNavItem({ to: '/dashboard', label: 'Dashboard' }, ['/dashboard']);

    expect(container.querySelector('.Mui-selected')).toBeInTheDocument();
  });

  it('does not mark as selected when the current route does not match', () => {
    const { container } = renderNavItem({ to: '/dashboard', label: 'Dashboard' }, ['/inventory']);

    expect(container.querySelector('.Mui-selected')).not.toBeInTheDocument();
  });

  it('marks as selected when the current route is a nested path under the item route', () => {
    // Example: /analytics should be selected for /analytics/overview.
    const { container } = renderNavItem({ to: '/analytics', label: 'Analytics' }, ['/analytics/overview']);

    expect(container.querySelector('.Mui-selected')).toBeInTheDocument();
  });

  it('sets aria-current to page on the selected entry only', () => {
    const { container, unmount } = renderNavItem({ to: '/dashboard', label: 'Dashboard' }, ['/dashboard']);
    expect(container.querySelector('a')).toHaveAttribute('aria-current', 'page');
    unmount();

    const other = renderNavItem({ to: '/dashboard', label: 'Dashboard' }, ['/inventory']);
    expect(other.container.querySelector('a')).not.toHaveAttribute('aria-current');
  });

  it('does not treat "/" as selected for non-root routes', () => {
    // Root entry should not appear active while browsing another page.
    const { container } = renderNavItem({ to: '/', label: 'Home' }, ['/dashboard']);

    expect(container.querySelector('.Mui-selected')).not.toBeInTheDocument();
  });
});
