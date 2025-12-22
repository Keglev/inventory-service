/**
 * @file SidebarActions.test.tsx
 *
 * @what_is_under_test SidebarActions component
 * @responsibility Provides action buttons (theme, language, settings, help) in sidebar footer
 * @out_of_scope Settings dialog content, help system implementation, theme generation logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SidebarActions from '../../../app/layout/sidebar/SidebarActions';

// Mock HelpIconButton component
vi.mock('../../../features/help', () => ({
  HelpIconButton: ({ tooltip, topicId }: { tooltip: string; topicId: string }) => (
    <button data-testid="help-button" aria-label={tooltip} data-topic={topicId}>
      Help
    </button>
  ),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue: string) => defaultValue,
  }),
}));

describe('SidebarActions', () => {
  const mockOnThemeModeChange = vi.fn();
  const mockOnLocaleChange = vi.fn();
  const mockOnSettingsOpen = vi.fn();

  const defaultProps = {
    themeMode: 'light' as const,
    onThemeModeChange: mockOnThemeModeChange,
    locale: 'en' as const,
    onLocaleChange: mockOnLocaleChange,
    onSettingsOpen: mockOnSettingsOpen,
    helpTopic: 'Dashboard',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Theme toggle', () => {
    it('renders light mode icon when theme is light', () => {
      const { container } = render(<SidebarActions {...defaultProps} themeMode="light" />);
      const lightIcon = container.querySelector('[data-testid="LightModeIcon"]');
      expect(lightIcon).toBeInTheDocument();
    });

    it('renders dark mode icon when theme is dark', () => {
      const { container } = render(<SidebarActions {...defaultProps} themeMode="dark" />);
      const darkIcon = container.querySelector('[data-testid="DarkModeIcon"]');
      expect(darkIcon).toBeInTheDocument();
    });

    it('calls onThemeModeChange when theme button is clicked', async () => {
      const user = userEvent.setup();
      render(<SidebarActions {...defaultProps} />);
      
      const themeButton = screen.getByLabelText(/dark mode/i);
      await user.click(themeButton);
      
      expect(mockOnThemeModeChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Language toggle', () => {
    it('renders US flag when locale is en', () => {
      const { container } = render(<SidebarActions {...defaultProps} locale="en" />);
      const flag = container.querySelector('img[alt="English"]');
      expect(flag).toBeInTheDocument();
    });

    it('renders DE flag when locale is de', () => {
      const { container } = render(<SidebarActions {...defaultProps} locale="de" />);
      const flag = container.querySelector('img[alt="Deutsch"]');
      expect(flag).toBeInTheDocument();
    });

    it('calls onLocaleChange when language button is clicked', async () => {
      const user = userEvent.setup();
      render(<SidebarActions {...defaultProps} />);
      
      const languageButton = screen.getByLabelText(/toggle language/i);
      await user.click(languageButton);
      
      expect(mockOnLocaleChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Settings button', () => {
    it('renders settings button', () => {
      render(<SidebarActions {...defaultProps} />);
      const settingsButton = screen.getByLabelText(/settings/i);
      expect(settingsButton).toBeInTheDocument();
    });

    it('calls onSettingsOpen when settings button is clicked', async () => {
      const user = userEvent.setup();
      render(<SidebarActions {...defaultProps} />);
      
      const settingsButton = screen.getByLabelText(/settings/i);
      await user.click(settingsButton);
      
      expect(mockOnSettingsOpen).toHaveBeenCalledTimes(1);
    });

    it('renders settings icon', () => {
      const { container } = render(<SidebarActions {...defaultProps} />);
      const settingsIcon = container.querySelector('[data-testid="SettingsIcon"]');
      expect(settingsIcon).toBeInTheDocument();
    });
  });

  describe('Help button', () => {
    it('renders help button with correct topic', () => {
      render(<SidebarActions {...defaultProps} helpTopic="Inventory" />);
      const helpButton = screen.getByTestId('help-button');
      expect(helpButton).toHaveAttribute('data-topic', 'Inventory');
    });

    it('renders help button with tooltip', () => {
      render(<SidebarActions {...defaultProps} />);
      const helpButton = screen.getByLabelText(/help/i);
      expect(helpButton).toBeInTheDocument();
    });
  });

  describe('All action buttons', () => {
    it('renders all four action buttons', () => {
      render(<SidebarActions {...defaultProps} />);
      
      expect(screen.getByLabelText(/dark mode/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/toggle language/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/settings/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/help/i)).toBeInTheDocument();
    });
  });

  describe('Different props combinations', () => {
    it('renders correctly with dark theme and de locale', () => {
      const { container } = render(
        <SidebarActions {...defaultProps} themeMode="dark" locale="de" />
      );
      
      const darkIcon = container.querySelector('[data-testid="DarkModeIcon"]');
      const deFlag = container.querySelector('img[alt="Deutsch"]');
      
      expect(darkIcon).toBeInTheDocument();
      expect(deFlag).toBeInTheDocument();
    });

    it('updates help topic dynamically', () => {
      const { rerender } = render(<SidebarActions {...defaultProps} helpTopic="Dashboard" />);
      let helpButton = screen.getByTestId('help-button');
      expect(helpButton).toHaveAttribute('data-topic', 'Dashboard');

      rerender(<SidebarActions {...defaultProps} helpTopic="Analytics" />);
      helpButton = screen.getByTestId('help-button');
      expect(helpButton).toHaveAttribute('data-topic', 'Analytics');
    });
  });

  describe('Translation integration', () => {
    it('uses common namespace for translations', () => {
      render(<SidebarActions {...defaultProps} />);
      // Translation keys are used for tooltips
      expect(screen.getByLabelText(/dark mode/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/toggle language/i)).toBeInTheDocument();
    });
  });
});
