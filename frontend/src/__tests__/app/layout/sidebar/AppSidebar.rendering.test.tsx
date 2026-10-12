/**
 * @file AppSidebar.rendering.test.tsx
 * @module __tests__/app/layout/AppSidebar.rendering
 * @description
 * Rendering/structure tests for AppSidebar.
 *
 * Scope:
 * - Desktop rail (88 px, rail tiles) and phone drawer (list rows) (FW6 UX-1)
 * - Contents: navigation list plus one settings entry, no product title (FW6)
 * - Settings wiring, closing the phone drawer first
 *
 * Out of scope:
 * - Routing behavior and navigation item logic (SidebarNavList.test.tsx)
 * - Rail tile rendering of a single entry (NavItem.rendering.test.tsx)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AppSidebar from '@/app/layout/AppSidebar';
import { tEn } from '@/__tests__/test/i18nEn';

vi.mock('@/app/layout/sidebar/SidebarNavList', () => ({
  default: ({ variant }: { variant: string }) => <div data-testid="nav-list" data-variant={variant} />,
}));

/** i18n mock: English strings from the real locale file. */
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
  const onMobileClose = vi.fn();
  const onSettingsOpen = vi.fn();

  const baseProps: SidebarProps = {
    mobileOpen: false,
    onMobileClose,
    onSettingsOpen,
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

  const railPaper = (container: HTMLElement) =>
    container.querySelector('.MuiDrawer-docked .MuiDrawer-paper') as HTMLElement;

  it('renders the desktop drawer as an 88 px rail of rail tiles', () => {
    const { container } = renderSidebar();

    const rail = railPaper(container);
    expect(rail).toHaveStyle({ width: '88px' });
    expect(within(rail).getByTestId('nav-list')).toHaveAttribute('data-variant', 'rail');
  });

  it('renders the phone drawer with list rows when it is open', () => {
    renderSidebar({ mobileOpen: true });

    const phoneDrawer = screen.getByRole('presentation');
    expect(within(phoneDrawer).getByTestId('nav-list')).toHaveAttribute('data-variant', 'list');
  });

  it('renders the navigation list and a settings entry but no product title', () => {
    const { container } = renderSidebar();

    const rail = railPaper(container);
    expect(within(rail).getByRole('button', { name: tEn('nav.settings') })).toBeInTheDocument();
    expect(within(rail).getAllByRole('button')).toHaveLength(1);
    expect(rail.textContent).not.toContain('Smart Supply Pro');
  });

  it('opens settings from the rail without touching the phone drawer', async () => {
    const user = userEvent.setup();
    const { container } = renderSidebar();

    await user.click(within(railPaper(container)).getByRole('button', { name: tEn('nav.settings') }));

    expect(onSettingsOpen).toHaveBeenCalledTimes(1);
    expect(onMobileClose).not.toHaveBeenCalled();
  });

  it('closes the phone drawer before opening settings from it', async () => {
    const user = userEvent.setup();
    renderSidebar({ mobileOpen: true });

    await user.click(within(screen.getByRole('presentation')).getByRole('button', { name: tEn('nav.settings') }));

    expect(onMobileClose).toHaveBeenCalledTimes(1);
    expect(onSettingsOpen).toHaveBeenCalledTimes(1);
    expect(onMobileClose.mock.invocationCallOrder[0]).toBeLessThan(onSettingsOpen.mock.invocationCallOrder[0]);
  });
});
