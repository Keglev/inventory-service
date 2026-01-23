/**
 * @file LogoutMenuAction.test.tsx
 * @module __tests__/app/HamburgerMenu/MenuContent
 *
 * @description
 * Unit tests for <LogoutMenuAction /> — a menu item that closes the menu and triggers logout.
 *
 * Test strategy:
 * - Verify the menu item renders with the correct label.
 * - Verify interaction calls onClose and onLogout.
 * - Verify call order (close first, then logout) to preserve UI correctness:
 *   menus should close immediately even if logout triggers async navigation.
 * - Verify i18n wiring by mocking translations.
 *
 * Notes:
 * - i18n is mocked to keep tests deterministic and independent of translation catalogs.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LogoutMenuAction from '../../../../app/HamburgerMenu/MenuContent/LogoutMenuAction';

// -----------------------------------------------------------------------------
// i18n mock
// -----------------------------------------------------------------------------
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

type Props = {
  onLogout: () => void;
  onClose: () => void;
};

describe('LogoutMenuAction', () => {
  const mockOnLogout = vi.fn();
  const mockOnClose = vi.fn();

  const defaultProps: Props = {
    onLogout: mockOnLogout,
    onClose: mockOnClose,
  };

  /**
   * Arrange helper: centralizes rendering.
   */
  const arrange = (props?: Partial<Props>) =>
    render(<LogoutMenuAction {...defaultProps} {...props} />);

  /**
   * Query helper: this component is designed to render a menuitem.
   */
  const getMenuItem = () => screen.getByRole('menuitem');

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnLogout.mockReset();
    mockOnClose.mockReset();

    // Deterministic translation stub: return defaultValue for stable assertions.
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  it('renders a menu item', () => {
    arrange();
    expect(getMenuItem()).toBeInTheDocument();
  });

  it('renders the default logout label', () => {
    arrange();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Interaction
  // ---------------------------------------------------------------------------
  it('calls onClose when clicked', async () => {
    const user = userEvent.setup();
    arrange();

    await user.click(getMenuItem());
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onLogout when clicked', async () => {
    const user = userEvent.setup();
    arrange();

    await user.click(getMenuItem());
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  it('calls onClose before onLogout', async () => {
    const user = userEvent.setup();
    const callOrder: Array<'close' | 'logout'> = [];

    const trackingOnClose = vi.fn(() => callOrder.push('close'));
    const trackingOnLogout = vi.fn(() => callOrder.push('logout'));

    arrange({ onClose: trackingOnClose, onLogout: trackingOnLogout });

    await user.click(getMenuItem());

    // UX contract: menu closes immediately, then logout can proceed (possibly async).
    expect(callOrder).toEqual(['close', 'logout']);
  });

  // ---------------------------------------------------------------------------
  // i18n wiring
  // ---------------------------------------------------------------------------
  it('renders translated logout label when provided by i18n', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'nav.logout') return 'Abmelden';
      return defaultValue;
    });

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange();

    expect(screen.getByText('Abmelden')).toBeInTheDocument();
    expect(mockT).toHaveBeenCalledWith('nav.logout', 'Logout');
  });

  // ---------------------------------------------------------------------------
  // Regression: icon presence
  // ---------------------------------------------------------------------------
  it('renders a logout icon', () => {
    // Implementation-level assertion (svg), kept intentionally lightweight.
    const { container } = arrange();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
