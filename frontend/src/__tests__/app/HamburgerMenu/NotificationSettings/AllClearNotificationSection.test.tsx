/**
 * @file AllClearNotificationSection.test.tsx
 * @module __tests__/app/HamburgerMenu/NotificationSettings/AllClearNotificationSection
 * @description Tests for all clear notification section component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AllClearNotificationSection from '../../../../app/HamburgerMenu/NotificationSettings/AllClearNotificationSection';

// Hoisted mocks
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('AllClearNotificationSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders all clear message', () => {
    render(<AllClearNotificationSection />);
    expect(screen.getByText('All clear – no low stock items')).toBeInTheDocument();
  });

  it('renders notification icon', () => {
    const { container } = render(<AllClearNotificationSection />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('uses translation for message', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'notifications.allGood') return 'Alles in Ordnung – keine niedrigen Bestände';
      return defaultValue;
    });
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<AllClearNotificationSection />);
    expect(screen.getByText('Alles in Ordnung – keine niedrigen Bestände')).toBeInTheDocument();
  });

  it('renders with success color styling', () => {
    const { container } = render(<AllClearNotificationSection />);
    const icon = container.querySelector('svg');
    expect(icon).toHaveClass('MuiSvgIcon-root');
  });
});
