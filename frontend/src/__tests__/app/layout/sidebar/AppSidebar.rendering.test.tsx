/**
 * @file AppSidebar.rendering.test.tsx
 * @module __tests__/app/layout/AppSidebar.rendering
 * @description
 * Rendering/structure tests for AppSidebar.
 *
 * Scope:
 * - Drawer and title render
 * - Navigation only: the nav list and nothing else (FW5 fork 1)
 *
 * Out of scope:
 * - Routing behavior and navigation item logic (SidebarNavList.test.tsx)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppSidebar from '@/app/layout/AppSidebar';
import { tEn } from '@/__tests__/test/i18nEn';

vi.mock('@/app/layout/sidebar/SidebarNavList', () => ({
  default: () => <div data-testid="nav-list" />,
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
vi.mock('@/app/layout/navConfig', () => ({
  getHelpTopicForRoute: vi.fn(() => 'Dashboard'),
}));

type SidebarProps = React.ComponentProps<typeof AppSidebar>;

describe('AppSidebar (rendering)', () => {
  const baseProps: SidebarProps = {
    mobileOpen: false,
    onMobileClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
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

  it('renders the navigation list and nothing else besides the title', () => {
    // Navigation only: no profile, environment, version, toggles, settings, help or sign-out.
    renderSidebar();
    const lists = screen.getAllByTestId('nav-list');
    expect(lists.length).toBeGreaterThan(0);
    for (const list of lists) {
      const paper = list.closest('.MuiDrawer-paper');
      expect(paper?.textContent).toBe('Smart Supply Pro');
    }
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('renders regardless of mobileOpen state (true/false)', () => {
    // Ensures responsive mode flag does not break rendering.
    const { container: c1 } = renderSidebar({ mobileOpen: false });
    expect(c1.querySelector('.MuiDrawer-root')).toBeInTheDocument();

    const { container: c2 } = renderSidebar({ mobileOpen: true });
    expect(c2.querySelector('.MuiDrawer-root')).toBeInTheDocument();
  });
});
