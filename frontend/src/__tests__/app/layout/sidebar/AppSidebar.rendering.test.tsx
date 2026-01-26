/**
 * @file AppSidebar.rendering.test.tsx
 * @module __tests__/app/layout/AppSidebar.rendering
 * @description
 * Rendering/structure tests for AppSidebar.
 *
 * Scope:
 * - Drawer and title render
 * - Presence of sidebar sections (nav list, profile, env, actions)
 * - User profile fallbacks (user present vs undefined)
 *
 * Out of scope:
 * - Routing behavior and navigation item logic
 * - Callback wiring (covered in AppSidebar.actions.test.tsx)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppSidebar from '../../../../app/layout/AppSidebar';

/**
 * Sidebar subcomponent stubs:
 * Rendering tests focus on AppSidebar composition, not the internals of its children.
 */
vi.mock('../../../../app/layout/sidebar', () => ({
  SidebarNavList: () => <div data-testid="nav-list" />,
  SidebarUserProfile: ({ user }: { user?: { fullName?: string } }) => (
    <div data-testid="user-profile">{user?.fullName || 'No User'}</div>
  ),
  SidebarEnvironment: () => <div data-testid="environment">Environment Info</div>,
  SidebarActions: () => <div data-testid="sidebar-actions" />,
}));

/**
 * i18n mock:
 * AppSidebar commonly provides default translation values; return those defaults for stable assertions.
 */
const mockUseTranslation = vi.hoisted(() => vi.fn());
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

/**
 * navConfig mock:
 * Deterministic help topic lookup (not asserted here, but avoids side effects).
 */
vi.mock('../../../../app/layout/navConfig', () => ({
  getHelpTopicForRoute: vi.fn(() => 'Dashboard'),
}));

type SidebarProps = React.ComponentProps<typeof AppSidebar>;

describe('AppSidebar (rendering)', () => {
  const baseProps: SidebarProps = {
    mobileOpen: false,
    onMobileClose: vi.fn(),
    themeMode: 'light',
    onThemeModeChange: vi.fn(),
    locale: 'en',
    onLocaleChange: vi.fn(),
    onLogout: vi.fn(),
    onSettingsOpen: vi.fn(),
    user: { fullName: 'John Doe', role: 'Admin' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
    });
  });

  function renderSidebar(props: Partial<SidebarProps> = {}) {
    // Router wrapper ensures any internal <Link>/<NavLink> usage is supported.
    return render(
      <MemoryRouter>
        <AppSidebar {...baseProps} {...props} />
      </MemoryRouter>,
    );
  }

  it('renders a MUI Drawer container', () => {
    // Ensures the responsive navigation container exists.
    const { container } = renderSidebar();

    expect(container.querySelector('.MuiDrawer-root')).toBeInTheDocument();
  });

  it('renders the sidebar title', () => {
    // Title is part of the user-facing layout contract.
    renderSidebar();

    expect(screen.getAllByText('Smart Supply Pro').length).toBeGreaterThan(0);
  });

  it('renders the sidebar composition sections', () => {
    // Composition check: these sections must always be present for navigation and context.
    renderSidebar();

    expect(screen.getAllByTestId('nav-list').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('user-profile').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('environment').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('sidebar-actions').length).toBeGreaterThan(0);
  });

  it('displays the provided user name when user is present', () => {
    // Verifies correct user projection into the profile section.
    renderSidebar({ user: { fullName: 'Jane Smith', role: 'Manager' } });

    expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
  });

  it('handles an undefined user gracefully', () => {
    // Guards against null/undefined states (e.g., before auth is fully resolved).
    renderSidebar({ user: undefined });

    expect(screen.getAllByText('No User').length).toBeGreaterThan(0);
  });

  it('renders regardless of mobileOpen state (true/false)', () => {
    // Ensures responsive mode flag does not break rendering.
    const { container: c1 } = renderSidebar({ mobileOpen: false });
    expect(c1.querySelector('.MuiDrawer-root')).toBeInTheDocument();

    const { container: c2 } = renderSidebar({ mobileOpen: true });
    expect(c2.querySelector('.MuiDrawer-root')).toBeInTheDocument();
  });
});
