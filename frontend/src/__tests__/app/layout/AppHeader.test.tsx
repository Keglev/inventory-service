/**
 * @file AppHeader.test.tsx
 * @module __tests__/app/layout/AppHeader
 * @description
 * Enterprise-level unit tests for the AppHeader layout component.
 *
 * Test goals:
 * - Verify that the header renders the expected title and status badges.
 * - Ensure AppHeader passes the correct props down to AppToolbarActions.
 * - Confirm that user interaction (menu button click) triggers drawer toggle.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AppHeader from '@/app/layout/AppHeader';

/**
 * i18n mock:
 * Returning the translation key makes assertions stable and avoids coupling
 * to specific language files.
 */
const mockUseTranslation = vi.hoisted(() => vi.fn());
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

/**
 * Captured props from the AppToolbarActions mock to verify "prop delegation".
 * This avoids asserting on implementation details of AppToolbarActions itself.
 */
type ToolbarActionsProps = {
  themeMode: 'light' | 'dark';
  locale: 'de' | 'en';
  helpTopic: string;
  onThemeModeChange: (mode: 'light' | 'dark') => void;
  onLocaleChange: (locale: 'de' | 'en') => void;
  onLogout: () => void;
};

let lastToolbarProps: Partial<ToolbarActionsProps> | undefined;

/**
 * AppToolbarActions mock:
 * - Captures received props for verification
 * - Renders a test id so presence can be asserted
 */
vi.mock('@/app/layout/AppToolbarActions', () => ({
  default: (props: Partial<ToolbarActionsProps>) => {
    lastToolbarProps = props;
    return <div data-testid="toolbar-actions" />;
  },
}));

/**
 * Header badge stubs:
 * These are tested as "presence" indicators only, not for their internal logic.
 */
vi.mock('@/app/layout/header', () => ({
  HealthBadge: () => <div data-testid="health-badge" />,
  HeaderDemoBadge: ({ isDemo }: { isDemo: boolean }) => (
    <div data-testid="demo-badge">demo:{String(isDemo)}</div>
  ),
}));

describe('AppHeader', () => {
  const baseProps = {
    themeMode: 'light' as const,
    onThemeModeChange: vi.fn(),
    locale: 'de' as const,
    onLocaleChange: vi.fn(),
    onLogout: vi.fn(),
    helpTopic: 'dashboard',
    isDemo: true,
    onDrawerToggle: vi.fn(),
  };

  beforeEach(() => {
    // Reset mock state to prevent cross-test leakage.
    vi.clearAllMocks();
    lastToolbarProps = undefined;

    // Default translation hook behavior for all tests in this suite.
    mockUseTranslation.mockReturnValue({ t: (key: string) => key });
  });

  it('renders the title, status badges, and toolbar actions container', () => {
    // Ensures the header surface elements are present for the user.
    render(<AppHeader {...baseProps} />);

    expect(screen.getByText('app.title')).toBeInTheDocument();
    expect(screen.getByTestId('health-badge')).toBeInTheDocument();
    expect(screen.getByTestId('demo-badge')).toHaveTextContent('demo:true');
    expect(screen.getByTestId('toolbar-actions')).toBeInTheDocument();
  });

  it('passes the expected configuration props to AppToolbarActions', () => {
    // Validates prop delegation without relying on AppToolbarActions internals.
    render(<AppHeader {...baseProps} />);

    expect(lastToolbarProps).toMatchObject({
      themeMode: 'light',
      locale: 'de',
      helpTopic: 'dashboard',
    });
  });

  it('calls onDrawerToggle when the menu button is clicked', async () => {
    // Simulates a real user click to ensure the drawer toggling interaction works.
    const user = userEvent.setup();
    render(<AppHeader {...baseProps} />);

    // AppHeader should expose exactly one menu trigger button (hamburger icon).
    const menuButton = screen.getByRole('button');
    await user.click(menuButton);

    expect(baseProps.onDrawerToggle).toHaveBeenCalledTimes(1);
  });
});
