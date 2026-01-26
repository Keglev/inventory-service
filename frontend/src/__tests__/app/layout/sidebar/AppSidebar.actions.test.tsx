/**
 * @file AppSidebar.actions.test.tsx
 * @module __tests__/app/layout/AppSidebar.actions
 * @description
 * Interaction/callback wiring tests for AppSidebar.
 *
 * Scope:
 * - Ensures AppSidebar delegates callbacks to child components:
 *   logout, theme toggle, locale toggle, settings open
 *
 * Out of scope:
 * - Visual layout and composition (covered in AppSidebar.rendering.test.tsx)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AppSidebar from '../../../../app/layout/AppSidebar';

/**
 * Sidebar subcomponent stubs with "action buttons":
 * We simulate user interactions at the edges (buttons) to validate callback delegation.
 */
vi.mock('../../../../app/layout/sidebar', () => ({
  SidebarNavList: ({ onLogout }: { onLogout: () => void }) => (
    <div data-testid="nav-list">
      <button type="button" onClick={onLogout}>
        Logout
      </button>
    </div>
  ),
  SidebarUserProfile: () => <div data-testid="user-profile" />,
  SidebarEnvironment: () => <div data-testid="environment" />,
  SidebarActions: ({
    onThemeModeChange,
    onLocaleChange,
    onSettingsOpen,
  }: {
    onThemeModeChange: () => void;
    onLocaleChange: () => void;
    onSettingsOpen: () => void;
  }) => (
    <div data-testid="sidebar-actions">
      <button type="button" onClick={onThemeModeChange}>
        Toggle Theme
      </button>
      <button type="button" onClick={onLocaleChange}>
        Toggle Language
      </button>
      <button type="button" onClick={onSettingsOpen}>
        Settings
      </button>
    </div>
  ),
}));

/**
 * i18n mock:
 * Keep text stable; buttons in these tests come from stubs anyway.
 */
const mockUseTranslation = vi.hoisted(() => vi.fn());
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

vi.mock('../../../../app/layout/navConfig', () => ({
  getHelpTopicForRoute: vi.fn(() => 'Dashboard'),
}));

type SidebarProps = React.ComponentProps<typeof AppSidebar>;

describe('AppSidebar (actions)', () => {
  const mockOnMobileClose = vi.fn();
  const mockOnThemeModeChange = vi.fn();
  const mockOnLocaleChange = vi.fn();
  const mockOnLogout = vi.fn();
  const mockOnSettingsOpen = vi.fn();

  const baseProps: SidebarProps = {
    mobileOpen: false,
    onMobileClose: mockOnMobileClose,
    themeMode: 'light',
    onThemeModeChange: mockOnThemeModeChange,
    locale: 'en',
    onLocaleChange: mockOnLocaleChange,
    onLogout: mockOnLogout,
    onSettingsOpen: mockOnSettingsOpen,
    user: { fullName: 'John Doe', role: 'Admin' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
    });
  });

  function renderSidebar(props: Partial<SidebarProps> = {}) {
    return render(
      <MemoryRouter>
        <AppSidebar {...baseProps} {...props} />
      </MemoryRouter>,
    );
  }

  it('delegates logout action to the onLogout handler', async () => {
    // Ensures the nav section uses the provided logout callback.
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole('button', { name: /logout/i }));

    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  it('delegates theme toggle action to the onThemeModeChange handler', async () => {
    // Ensures the actions section uses the provided theme callback.
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole('button', { name: /toggle theme/i }));

    expect(mockOnThemeModeChange).toHaveBeenCalledTimes(1);
  });

  it('delegates locale toggle action to the onLocaleChange handler', async () => {
    // Ensures the actions section uses the provided locale callback.
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole('button', { name: /toggle language/i }));

    expect(mockOnLocaleChange).toHaveBeenCalledTimes(1);
  });

  it('delegates settings action to the onSettingsOpen handler', async () => {
    // Ensures the settings entry point is wired correctly.
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole('button', { name: /settings/i }));

    expect(mockOnSettingsOpen).toHaveBeenCalledTimes(1);
  });
});
