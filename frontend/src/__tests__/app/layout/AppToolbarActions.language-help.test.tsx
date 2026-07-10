/**
 * @file AppToolbarActions.language-help.test.tsx
 * @module __tests__/app/layout/AppToolbarActions.language-help
 * @description
 * Tests for AppToolbarActions focused on:
 * - language toggle behavior (flag rendering + locale switching)
 * - help button wiring (topic + tooltip/aria-label)
 *
 * Out of scope:
 * - Hamburger menu behavior (covered in AppToolbarActions.hamburger-layout.test.tsx)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppToolbarActions from '../../../app/layout/AppToolbarActions';
import { tEn } from '../../test/i18nEn';

vi.mock('../../../features/help/components/HelpIconButton', () => ({
  HelpIconButton: ({ tooltip, topicId }: { tooltip: string; topicId: string }) => (
    <button type="button" data-testid="help-button" aria-label={tooltip} data-topic={topicId}>
      Help
    </button>
  ),
}));

vi.mock('../../../app/HamburgerMenu/HamburgerMenu', () => ({
  default: () => <div data-testid="hamburger-menu" />,
}));

/**
 * i18n mock:
 * Return defaultValue for stable and language-file independent assertions.
 */
const mockUseTranslation = vi.hoisted(() => vi.fn());
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

type Props = React.ComponentProps<typeof AppToolbarActions>;

describe('AppToolbarActions (language + help)', () => {
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

  describe('Language toggle', () => {
    it('renders the English flag when locale=en', () => {
      // Ensures locale state is reflected visually.
      const { container } = renderActions({ locale: 'en' });

      expect(container.querySelector('img[alt="English"]')).toBeInTheDocument();
    });

    it('renders the German flag when locale=de', () => {
      // Ensures locale state is reflected visually.
      const { container } = renderActions({ locale: 'de' });

      expect(container.querySelector('img[alt="Deutsch"]')).toBeInTheDocument();
    });

    it('switches from en -> de when the language toggle is clicked', async () => {
      // Verifies the locale toggle delegates the new locale correctly.
      const user = userEvent.setup();
      renderActions({ locale: 'en' });

      await user.click(screen.getByLabelText(/switch language/i));

      expect(mockOnLocaleChange).toHaveBeenCalledWith('de');
    });

    it('switches from de -> en when the language toggle is clicked', async () => {
      // Verifies the locale toggle delegates the new locale correctly.
      const user = userEvent.setup();
      renderActions({ locale: 'de' });

      await user.click(screen.getByLabelText(/switch language/i));

      expect(mockOnLocaleChange).toHaveBeenCalledWith('en');
    });
  });

  describe('Help button', () => {
    it('renders help button with the correct topic id', () => {
      // Ensures AppToolbarActions wires the topic id into the help system entry point.
      renderActions({ helpTopic: 'Inventory' });

      expect(screen.getByTestId('help-button')).toHaveAttribute('data-topic', 'Inventory');
    });

    it('exposes a tooltip via aria-label for accessibility', () => {
      // Ensures the help affordance is accessible for screen readers and testing.
      renderActions();

      expect(screen.getByLabelText(/help/i)).toBeInTheDocument();
    });

    it('updates the help topic when the prop changes', () => {
      // Guards against stale props in memoized components.
      const { rerender } = renderActions({ helpTopic: 'Dashboard' });
      expect(screen.getByTestId('help-button')).toHaveAttribute('data-topic', 'Dashboard');

      rerender(<AppToolbarActions {...baseProps} helpTopic="Analytics" />);
      expect(screen.getByTestId('help-button')).toHaveAttribute('data-topic', 'Analytics');
    });
  });
});
