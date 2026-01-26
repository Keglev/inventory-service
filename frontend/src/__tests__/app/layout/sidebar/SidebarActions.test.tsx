/**
 * @file SidebarActions.test.tsx
 * @module __tests__/app/layout/sidebar/SidebarActions
 * @description
 * Tests for SidebarActions.
 *
 * Scope:
 * - Renders action buttons (theme toggle, language toggle, settings, help)
 * - Delegates user interactions to provided handlers
 * - Wires help topic into HelpIconButton
 *
 * Out of scope:
 * - Settings dialog contents
 * - Help system implementation details
 * - Theme generation / persistence logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SidebarActions from '../../../../app/layout/sidebar/SidebarActions';

/**
 * Help button stub:
 * Exposes tooltip via aria-label and the topic id via a data attribute for stable assertions.
 */
vi.mock('../../../../features/help', () => ({
  HelpIconButton: ({ tooltip, topicId }: { tooltip: string; topicId: string }) => (
    <button type="button" data-testid="help-button" aria-label={tooltip} data-topic={topicId}>
      Help
    </button>
  ),
}));

/**
 * i18n mock:
 * SidebarActions provides default translation values (tooltips). Returning defaultValue
 * keeps tests independent of translation files.
 */
const mockUseTranslation = vi.hoisted(() => vi.fn());
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

type Props = React.ComponentProps<typeof SidebarActions>;

describe('SidebarActions', () => {
  const mockOnThemeModeChange = vi.fn();
  const mockOnLocaleChange = vi.fn();
  const mockOnSettingsOpen = vi.fn();

  const baseProps: Props = {
    themeMode: 'light',
    onThemeModeChange: mockOnThemeModeChange,
    locale: 'en',
    onLocaleChange: mockOnLocaleChange,
    onSettingsOpen: mockOnSettingsOpen,
    helpTopic: 'Dashboard',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
    });
  });

  function renderActions(props: Partial<Props> = {}) {
    return render(<SidebarActions {...baseProps} {...props} />);
  }

  it('renders all action entry points (theme, language, settings, help)', () => {
    // Smoke test: ensures the sidebar footer provides all expected actions.
    renderActions();

    expect(screen.getByLabelText(/dark mode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/toggle language/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/settings/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/help/i)).toBeInTheDocument();
  });

  describe('Theme toggle', () => {
    it('shows "Dark mode" action when themeMode=light', () => {
      // UX contract: the tooltip indicates the action that will happen (switch to dark).
      renderActions({ themeMode: 'light' });

      expect(screen.getByLabelText(/dark mode/i)).toBeInTheDocument();
    });

    it('shows "Light mode" action when themeMode=dark', () => {
      // UX contract: the tooltip indicates the action that will happen (switch to light).
      renderActions({ themeMode: 'dark' });

      expect(screen.getByLabelText(/light mode/i)).toBeInTheDocument();
    });

    it('calls onThemeModeChange with the next mode when clicked', async () => {
      // Behavior contract: clicking toggles to the opposite mode.
      const user = userEvent.setup();
      renderActions({ themeMode: 'light' });

      await user.click(screen.getByLabelText(/dark mode/i));

      expect(mockOnThemeModeChange).toHaveBeenCalledWith('dark');
    });
  });

  describe('Language toggle', () => {
    it('renders the correct flag for the current locale', () => {
      // Visual contract: language toggle shows the currently active locale.
      const { container, rerender } = renderActions({ locale: 'en' });
      expect(container.querySelector('img[alt="English"]')).toBeInTheDocument();

      rerender(<SidebarActions {...baseProps} locale="de" />);
      expect(container.querySelector('img[alt="Deutsch"]')).toBeInTheDocument();
    });

    it('calls onLocaleChange with the next locale when clicked', async () => {
      // Behavior contract: clicking toggles to the opposite locale.
      const user = userEvent.setup();
      renderActions({ locale: 'en' });

      await user.click(screen.getByLabelText(/toggle language/i));

      expect(mockOnLocaleChange).toHaveBeenCalledWith('de');
    });
  });

  describe('Settings', () => {
    it('calls onSettingsOpen when settings button is clicked', async () => {
      // Ensures the settings entry point is wired correctly.
      const user = userEvent.setup();
      renderActions();

      await user.click(screen.getByLabelText(/settings/i));

      expect(mockOnSettingsOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe('Help', () => {
    it('wires the help topic into HelpIconButton', () => {
      // Ensures the contextual help entry point receives the correct topic id.
      renderActions({ helpTopic: 'Inventory' });

      expect(screen.getByTestId('help-button')).toHaveAttribute('data-topic', 'Inventory');
    });

    it('updates help topic when props change', () => {
      // Guards against stale props in memoized components.
      const { rerender } = renderActions({ helpTopic: 'Dashboard' });
      expect(screen.getByTestId('help-button')).toHaveAttribute('data-topic', 'Dashboard');

      rerender(<SidebarActions {...baseProps} helpTopic="Analytics" />);
      expect(screen.getByTestId('help-button')).toHaveAttribute('data-topic', 'Analytics');
    });
  });

  it('renders correctly for a representative prop combination (dark + de)', () => {
    // Regression-style sanity check for a common combination.
    const { container } = renderActions({ themeMode: 'dark', locale: 'de' });

    expect(screen.getByLabelText(/light mode/i)).toBeInTheDocument();
    expect(container.querySelector('img[alt="Deutsch"]')).toBeInTheDocument();
  });
});
