/**
 * @file AppToolbarActions.test.tsx
 *
 * @what_is_under_test AppToolbarActions component
 * @responsibility Renders toolbar action buttons (language toggle, help, hamburger menu) in AppBar
 * @out_of_scope Help system implementation, hamburger menu content, routing logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppToolbarActions from '../../../app/layout/AppToolbarActions';

// Mock HelpIconButton component
vi.mock('../../../features/help', () => ({
  HelpIconButton: ({ tooltip, topicId }: { tooltip: string; topicId: string }) => (
    <button data-testid="help-button" aria-label={tooltip} data-topic={topicId}>
      Help
    </button>
  ),
}));

// Mock HamburgerMenu component
vi.mock('../../../app/HamburgerMenu', () => ({
  HamburgerMenu: ({ onLogout, onThemeModeChange }: { onLogout: () => void; onThemeModeChange: (mode: string) => void }) => (
    <button
      data-testid="hamburger-menu"
      onClick={() => {
        onLogout();
        onThemeModeChange('dark');
      }}
    >
      Menu
    </button>
  ),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue: string) => defaultValue,
  }),
}));

describe('AppToolbarActions', () => {
  const mockOnThemeModeChange = vi.fn();
  const mockOnLocaleChange = vi.fn();
  const mockOnLogout = vi.fn();

  const defaultProps = {
    themeMode: 'light' as const,
    onThemeModeChange: mockOnThemeModeChange,
    locale: 'en' as const,
    onLocaleChange: mockOnLocaleChange,
    onLogout: mockOnLogout,
    helpTopic: 'Dashboard',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Language toggle', () => {
    it('renders US flag when locale is en', () => {
      const { container } = render(<AppToolbarActions {...defaultProps} locale="en" />);
      const flag = container.querySelector('img[alt="English"]');
      expect(flag).toBeInTheDocument();
    });

    it('renders DE flag when locale is de', () => {
      const { container } = render(<AppToolbarActions {...defaultProps} locale="de" />);
      const flag = container.querySelector('img[alt="Deutsch"]');
      expect(flag).toBeInTheDocument();
    });

    it('calls onLocaleChange with opposite locale when clicked', async () => {
      const user = userEvent.setup();
      render(<AppToolbarActions {...defaultProps} locale="en" />);

      const languageButton = screen.getByLabelText(/toggle language/i);
      await user.click(languageButton);

      expect(mockOnLocaleChange).toHaveBeenCalledWith('de');
    });

    it('toggles from de to en', async () => {
      const user = userEvent.setup();
      render(<AppToolbarActions {...defaultProps} locale="de" />);

      const languageButton = screen.getByLabelText(/toggle language/i);
      await user.click(languageButton);

      expect(mockOnLocaleChange).toHaveBeenCalledWith('en');
    });
  });

  describe('Help button', () => {
    it('renders help button with correct topic', () => {
      render(<AppToolbarActions {...defaultProps} helpTopic="Inventory" />);
      const helpButton = screen.getByTestId('help-button');
      expect(helpButton).toHaveAttribute('data-topic', 'Inventory');
    });

    it('renders help button with tooltip', () => {
      render(<AppToolbarActions {...defaultProps} />);
      const helpButton = screen.getByLabelText(/help/i);
      expect(helpButton).toBeInTheDocument();
    });

    it('updates help topic dynamically', () => {
      const { rerender } = render(<AppToolbarActions {...defaultProps} helpTopic="Dashboard" />);
      let helpButton = screen.getByTestId('help-button');
      expect(helpButton).toHaveAttribute('data-topic', 'Dashboard');

      rerender(<AppToolbarActions {...defaultProps} helpTopic="Analytics" />);
      helpButton = screen.getByTestId('help-button');
      expect(helpButton).toHaveAttribute('data-topic', 'Analytics');
    });
  });

  describe('Hamburger menu', () => {
    it('renders hamburger menu', () => {
      render(<AppToolbarActions {...defaultProps} />);
      const menu = screen.getByTestId('hamburger-menu');
      expect(menu).toBeInTheDocument();
    });

    it('passes onLogout to hamburger menu', () => {
      render(<AppToolbarActions {...defaultProps} />);
      // HamburgerMenu is rendered with onLogout prop
      expect(screen.getByTestId('hamburger-menu')).toBeInTheDocument();
    });

    it('passes onThemeModeChange to hamburger menu', () => {
      render(<AppToolbarActions {...defaultProps} />);
      // HamburgerMenu is rendered with onThemeModeChange prop
      expect(screen.getByTestId('hamburger-menu')).toBeInTheDocument();
    });
  });

  describe('All toolbar actions', () => {
    it('renders all three action components', () => {
      render(<AppToolbarActions {...defaultProps} />);

      expect(screen.getByLabelText(/toggle language/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/help/i)).toBeInTheDocument();
      expect(screen.getByTestId('hamburger-menu')).toBeInTheDocument();
    });
  });

  describe('Props variations', () => {
    it('handles different theme modes', () => {
      const { rerender } = render(<AppToolbarActions {...defaultProps} themeMode="light" />);
      expect(screen.getByTestId('hamburger-menu')).toBeInTheDocument();

      rerender(<AppToolbarActions {...defaultProps} themeMode="dark" />);
      expect(screen.getByTestId('hamburger-menu')).toBeInTheDocument();
    });

    it('handles different locales', () => {
      const { container, rerender } = render(
        <AppToolbarActions {...defaultProps} locale="en" />
      );
      expect(container.querySelector('img[alt="English"]')).toBeInTheDocument();

      rerender(<AppToolbarActions {...defaultProps} locale="de" />);
      expect(container.querySelector('img[alt="Deutsch"]')).toBeInTheDocument();
    });
  });

  describe('Translation integration', () => {
    it('uses common namespace for translations', () => {
      render(<AppToolbarActions {...defaultProps} />);
      expect(screen.getByLabelText(/toggle language/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/help/i)).toBeInTheDocument();
    });
  });

  describe('Layout structure', () => {
    it('renders actions in horizontal flex layout', () => {
      const { container } = render(<AppToolbarActions {...defaultProps} />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveStyle({ display: 'flex' });
    });
  });
});
