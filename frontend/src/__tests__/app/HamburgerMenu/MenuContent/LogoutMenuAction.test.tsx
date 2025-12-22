/**
 * @file LogoutMenuAction.test.tsx
 * @module __tests__/app/HamburgerMenu/MenuContent/LogoutMenuAction
 * @description Tests for logout menu action component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LogoutMenuAction from '../../../../app/HamburgerMenu/MenuContent/LogoutMenuAction';

// Hoisted mocks
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('LogoutMenuAction', () => {
  const mockOnLogout = vi.fn();
  const mockOnClose = vi.fn();

  const defaultProps = {
    onLogout: mockOnLogout,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders logout menu item', () => {
    render(<LogoutMenuAction {...defaultProps} />);
    expect(screen.getByRole('menuitem')).toBeInTheDocument();
  });

  it('displays logout text', () => {
    render(<LogoutMenuAction {...defaultProps} />);
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('calls onClose when clicked', async () => {
    const user = userEvent.setup();
    render(<LogoutMenuAction {...defaultProps} />);

    await user.click(screen.getByRole('menuitem'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onLogout when clicked', async () => {
    const user = userEvent.setup();
    render(<LogoutMenuAction {...defaultProps} />);

    await user.click(screen.getByRole('menuitem'));

    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  it('calls onClose before onLogout', async () => {
    const user = userEvent.setup();
    const callOrder: string[] = [];

    const trackingOnClose = vi.fn(() => {
      callOrder.push('close');
    });
    const trackingOnLogout = vi.fn(() => {
      callOrder.push('logout');
    });

    render(
      <LogoutMenuAction
        onLogout={trackingOnLogout}
        onClose={trackingOnClose}
      />
    );

    await user.click(screen.getByRole('menuitem'));

    expect(callOrder).toEqual(['close', 'logout']);
  });

  it('uses translation for logout text', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'nav.logout') return 'Abmelden';
      return defaultValue;
    });
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<LogoutMenuAction {...defaultProps} />);
    expect(screen.getByText('Abmelden')).toBeInTheDocument();
  });

  it('renders logout icon', () => {
    const { container } = render(<LogoutMenuAction {...defaultProps} />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
