/**
 * @file NotificationsMenuSection.test.tsx
 * @module __tests__/app/HamburgerMenu
 *
 * @description
 * Unit tests for <NotificationsMenuSection /> — verifies the notification area in the
 * hamburger menu reacts to dashboard metrics:
 * - Loading → skeleton state
 * - lowStockCount > 0 → low-stock alert content
 * - lowStockCount === 0 or missing → all-clear content
 *
 * Notes:
 * - useDashboardMetrics is mocked so tests stay deterministic and fast.
 * - i18n translation is mocked with minimal interpolation support ({{count}}).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotificationsMenuSection from '../../../app/HamburgerMenu/NotificationsMenuSection';

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------
const mockUseDashboardMetrics = vi.hoisted(() => vi.fn());
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('../../../api/analytics/hooks', () => ({
  useDashboardMetrics: mockUseDashboardMetrics,
}));

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

type MetricsState =
  | { isLoading: true; data: null }
  | { isLoading: false; data: { lowStockCount: number } }
  | { isLoading: false; data: null };

describe('NotificationsMenuSection', () => {
  const arrange = (state: MetricsState) => {
    mockUseDashboardMetrics.mockReturnValue(state);
    return render(<NotificationsMenuSection />);
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Minimal i18n mock:
    // - returns defaultValue
    // - supports {{count}} interpolation when options.count is provided
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

  it('renders loading skeleton when dashboard metrics are loading', () => {
    const { container } = arrange({ isLoading: true, data: null });
    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
  });

  it('renders low stock alert when lowStockCount is greater than zero', () => {
    arrange({ isLoading: false, data: { lowStockCount: 5 } });
    expect(screen.getByText('Low Stock Alert')).toBeInTheDocument();
  });

  it('renders all-clear message when lowStockCount is zero', () => {
    arrange({ isLoading: false, data: { lowStockCount: 0 } });
    expect(screen.getByText('All clear – no low stock items')).toBeInTheDocument();
  });

  it('falls back to all-clear message when metrics data is missing', () => {
    arrange({ isLoading: false, data: null });
    expect(screen.getByText('All clear – no low stock items')).toBeInTheDocument();
  });

  it('does not render low-stock alert title when lowStockCount is zero', () => {
    arrange({ isLoading: false, data: { lowStockCount: 0 } });
    expect(screen.queryByText('Low Stock Alert')).not.toBeInTheDocument();
  });

  it('interpolates the low stock count into the user-facing message', () => {
    arrange({ isLoading: false, data: { lowStockCount: 3 } });
    expect(screen.getByText('You have 3 merchandise item(s) with low stock')).toBeInTheDocument();
  });

  it('renders the low stock count in the chip label', () => {
    arrange({ isLoading: false, data: { lowStockCount: 7 } });
    expect(screen.getByText('7 items below minimum')).toBeInTheDocument();
  });

  it('renders an icon for the low-stock alert variant', () => {
    const { container } = arrange({ isLoading: false, data: { lowStockCount: 5 } });
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders an icon for the all-clear variant', () => {
    const { container } = arrange({ isLoading: false, data: { lowStockCount: 0 } });
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('uses translated title for the low stock alert when provided', () => {
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

    arrange({ isLoading: false, data: { lowStockCount: 5 } });

    expect(screen.getByText('Niedriger Bestand')).toBeInTheDocument();
  });
});
