/**
 * @file AppToolbarActions.hamburger-layout.test.tsx
 * @module __tests__/app/layout/AppToolbarActions.hamburger-layout
 * @description
 * Tests for AppToolbarActions focused on:
 * - hamburger menu presence and callback delegation
 * - overall composition (language toggle + help + hamburger)
 * - basic layout contract (flex row)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppToolbarActions from '../../../app/layout/AppToolbarActions';
import { tEn } from '../../test/i18nEn';

vi.mock('../../../features/help/components/HelpIconButton', () => ({
  HelpIconButton: ({ tooltip }: { tooltip: string }) => (
    <button type="button" aria-label={tooltip}>
      Help
    </button>
  ),
}));

vi.mock('../../../app/HamburgerMenu/HamburgerMenu', () => ({
  default: ({
    onLogout,
    onThemeModeChange,
  }: {
    onLogout: () => void;
    onThemeModeChange: (mode: 'light' | 'dark') => void;
  }) => (
    <button
      type="button"
      data-testid="hamburger-menu"
      onClick={() => {
        // Simulate a user selecting options inside the hamburger menu.
        onLogout();
        onThemeModeChange('dark');
      }}
    >
      Menu
    </button>
  ),
}));

/**
 * i18n mock:
 * Return defaultValue for stable rendering of labels/tooltips.
 */
const mockUseTranslation = vi.hoisted(() => vi.fn());
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

type Props = React.ComponentProps<typeof AppToolbarActions>;

describe('AppToolbarActions (hamburger + layout)', () => {
  const mockOnThemeModeChange = vi.fn();
  const mockOnLocaleChange = vi.fn();
  const mockOnLogout = vi.fn();

  const baseProps: Props = {
    themeMode: 'light',
    onThemeModeChange: mockOnThemeModeChange,
    locale: 'en',
    onLocaleChange: mockOnLocaleChange,
    onLogout: mockOnLogout,
    helpTopic: 'Dashboard',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
    });
  });

  function renderActions(props: Partial<Props> = {}) {
    return render(<AppToolbarActions {...baseProps} {...props} />);
  }

  it('renders the hamburger menu entry point', () => {
    // Ensures the user has access to the hamburger menu actions.
    renderActions();

    expect(screen.getByTestId('hamburger-menu')).toBeInTheDocument();
  });

  it('delegates onLogout and onThemeModeChange via the hamburger menu', async () => {
    // Verifies callback wiring from AppToolbarActions down to HamburgerMenu.
    const user = userEvent.setup();
    renderActions();

    await user.click(screen.getByTestId('hamburger-menu'));

    expect(mockOnLogout).toHaveBeenCalledTimes(1);
    expect(mockOnThemeModeChange).toHaveBeenCalledWith('dark');
  });

  it('renders the full toolbar set (language toggle, help, hamburger)', () => {
    // Smoke test to ensure all actions remain present in the toolbar.
    renderActions();

    expect(screen.getByLabelText(/switch language/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/help/i)).toBeInTheDocument();
    expect(screen.getByTestId('hamburger-menu')).toBeInTheDocument();
  });

  it('renders actions in a horizontal flex layout', () => {
    // Layout contract: actions should be aligned horizontally.
    const { container } = renderActions();

    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveStyle({ display: 'flex' });
  });
});
