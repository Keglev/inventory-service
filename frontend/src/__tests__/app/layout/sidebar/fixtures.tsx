/**
 * @file fixtures.tsx
 * @module __tests__/app/layout/sidebar/fixtures
 * @description Shared fixture (fork 4 A, 2026-10-22): the NavItem render
 * helper both split NavItem suites built. Consumers: NavItem.rendering,
 * NavItem.active-state.
 */
import type * as React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';

import NavItem from '@/app/layout/sidebar/NavItem';

type NavItemTestProps = React.ComponentProps<typeof NavItem>;

/** Renders a Dashboard NavItem under a router at the given entries. */
export function renderNavItem(
  props: Partial<NavItemTestProps> = {},
  initialEntries: string[] = ['/'],
) {
  const merged: NavItemTestProps = {
    to: '/dashboard',
    icon: DashboardIcon,
    label: 'Dashboard',
    ...props,
  } as NavItemTestProps;

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <NavItem {...merged} />
    </MemoryRouter>,
  );
}
