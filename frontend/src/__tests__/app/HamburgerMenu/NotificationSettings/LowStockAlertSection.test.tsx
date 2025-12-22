/**
 * @file LowStockAlertSection.test.tsx
 * @module __tests__/app/HamburgerMenu/NotificationSettings/LowStockAlertSection
 * @description Tests for low stock alert section component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LowStockAlertSection from '../../../../app/HamburgerMenu/NotificationSettings/LowStockAlertSection';

// Hoisted mocks
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('LowStockAlertSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string, options?: { count?: number }) => {
        if (typeof defaultValue === 'string' && options?.count !== undefined) {
          return defaultValue.replace('{{count}}', String(options.count));
        }
        return defaultValue;
      },
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders low stock alert section', () => {
    render(<LowStockAlertSection lowStockCount={5} />);
    expect(screen.getByText('Low Stock Alert')).toBeInTheDocument();
  });

  it('displays low stock count in message', () => {
    render(<LowStockAlertSection lowStockCount={3} />);
    expect(
      screen.getByText('You have 3 merchandise item(s) with low stock')
    ).toBeInTheDocument();
  });

  it('displays low stock count in chip', () => {
    render(<LowStockAlertSection lowStockCount={7} />);
    expect(screen.getByText('7 items below minimum')).toBeInTheDocument();
  });

  it('renders notification icon', () => {
    const { container } = render(<LowStockAlertSection lowStockCount={5} />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('uses translation for alert title', () => {
    const mockT = vi.fn((key: string, defaultValue: string, options?: { count?: number }) => {
      if (key === 'notifications.lowStockAlert') return 'Niedriger Bestand';
      if (typeof defaultValue === 'string' && options?.count !== undefined) {
        return defaultValue.replace('{{count}}', String(options.count));
      }
      return defaultValue;
    });
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<LowStockAlertSection lowStockCount={5} />);
    expect(screen.getByText('Niedriger Bestand')).toBeInTheDocument();
  });

  it('handles single item count', () => {
    render(<LowStockAlertSection lowStockCount={1} />);
    expect(
      screen.getByText('You have 1 merchandise item(s) with low stock')
    ).toBeInTheDocument();
    expect(screen.getByText('1 items below minimum')).toBeInTheDocument();
  });

  it('handles zero count', () => {
    render(<LowStockAlertSection lowStockCount={0} />);
    expect(
      screen.getByText('You have 0 merchandise item(s) with low stock')
    ).toBeInTheDocument();
  });

  it('handles large count', () => {
    render(<LowStockAlertSection lowStockCount={999} />);
    expect(
      screen.getByText('You have 999 merchandise item(s) with low stock')
    ).toBeInTheDocument();
  });

  it('renders chip component', () => {
    const { container } = render(<LowStockAlertSection lowStockCount={5} />);
    const chip = container.querySelector('.MuiChip-root');
    expect(chip).toBeInTheDocument();
  });
});
