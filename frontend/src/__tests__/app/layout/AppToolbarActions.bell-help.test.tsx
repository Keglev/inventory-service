/**
 * @file AppToolbarActions.bell-help.test.tsx
 * @module __tests__/app/layout/AppToolbarActions.bell-help
 * @testing Vitest + React Testing Library; bell, help button and menu mocked
 * @description
 * Tests for AppToolbarActions focused on:
 * - the notification bell, and the absence of a language toggle (FW5 forks 2 and 7)
 * - help button wiring (topic + tooltip/aria-label)
 *
 * Out of scope:
 * - Hamburger menu behavior (covered in AppToolbarActions.hamburger-layout.test.tsx)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppToolbarActions from '@/app/layout/AppToolbarActions';
import { tEn } from '@/__tests__/test/i18nEn';

vi.mock('@/features/help/components/HelpIconButton', () => ({
  HelpIconButton: ({ tooltip, topicId }: { tooltip: string; topicId: string }) => (
    <button type="button" data-testid="help-button" aria-label={tooltip} data-topic={topicId}>
      Help
    </button>
  ),
}));

vi.mock('@/app/layout/header/NotificationBell', () => ({
  default: () => <div data-testid="notification-bell" />,
}));

vi.mock('@/app/HamburgerMenu/HamburgerMenu', () => ({
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

describe('AppToolbarActions (bell + help)', () => {
  const mockOnSettingsOpen = vi.fn();
  const mockOnLogout = vi.fn();

  const baseProps: Props = {
    onSettingsOpen: mockOnSettingsOpen,
    onAboutOpen: vi.fn(),
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

  describe('Notifications and language', () => {
    it('renders the notification bell', () => {
      renderActions();
      expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
    });

    it('renders no language toggle', () => {
      // Language is set in the settings dialog only; the flag button is gone.
      const { container } = renderActions();
      expect(screen.queryByLabelText(tEn('actions.toggleLanguage'))).not.toBeInTheDocument();
      expect(container.querySelector('img')).toBeNull();
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
