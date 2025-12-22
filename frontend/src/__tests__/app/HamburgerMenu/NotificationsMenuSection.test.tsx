/**
 * @file NotificationsMenuSection.test.tsx
 * @module __tests__/app/HamburgerMenu/NotificationsMenuSection
 * @description Tests for notifications menu section component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotificationsMenuSection from '../../../app/HamburgerMenu/NotificationsMenuSection';

// Hoisted mocks
const mockUseDashboardMetrics = vi.hoisted(() => vi.fn());
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Mock hooks
vi.mock('../../../api/analytics/hooks', () => ({
  useDashboardMetrics: mockUseDashboardMetrics,
}));

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('NotificationsMenuSection', () => {
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

  it('renders loading skeleton when data is loading', () => {
    mockUseDashboardMetrics.mockReturnValue({
      isLoading: true,
      data: null,
    });

    const { container } = render(<NotificationsMenuSection />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders low stock alert when items have low stock', () => {
    mockUseDashboardMetrics.mockReturnValue({
      isLoading: false,
      data: { lowStockCount: 5 },
    });

    render(<NotificationsMenuSection />);
    expect(screen.getByText('Low Stock Alert')).toBeInTheDocument();
  });

  it('displays low stock count in message', () => {
    mockUseDashboardMetrics.mockReturnValue({
      isLoading: false,
      data: { lowStockCount: 3 },
    });

    render(<NotificationsMenuSection />);
    expect(screen.getByText('You have 3 merchandise item(s) with low stock')).toBeInTheDocument();
  });

  it('displays low stock count in chip', () => {
    mockUseDashboardMetrics.mockReturnValue({
      isLoading: false,
      data: { lowStockCount: 7 },
    });

    render(<NotificationsMenuSection />);
    expect(screen.getByText('7 items below minimum')).toBeInTheDocument();
  });

  it('renders all clear message when no low stock', () => {
    mockUseDashboardMetrics.mockReturnValue({
      isLoading: false,
      data: { lowStockCount: 0 },
    });

    render(<NotificationsMenuSection />);
    expect(screen.getByText('All clear – no low stock items')).toBeInTheDocument();
  });

  it('does not show alert when no low stock', () => {
    mockUseDashboardMetrics.mockReturnValue({
      isLoading: false,
      data: { lowStockCount: 0 },
    });

    render(<NotificationsMenuSection />);
    expect(screen.queryByText('Low Stock Alert')).not.toBeInTheDocument();
  });

  it('handles missing data gracefully', () => {
    mockUseDashboardMetrics.mockReturnValue({
      isLoading: false,
      data: null,
    });

    render(<NotificationsMenuSection />);
    expect(screen.getByText('All clear – no low stock items')).toBeInTheDocument();
  });

  it('renders notification icon for low stock', () => {
    mockUseDashboardMetrics.mockReturnValue({
      isLoading: false,
      data: { lowStockCount: 5 },
    });

    const { container } = render(<NotificationsMenuSection />);
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('renders notification icon for all clear', () => {
    mockUseDashboardMetrics.mockReturnValue({
      isLoading: false,
      data: { lowStockCount: 0 },
    });

    const { container } = render(<NotificationsMenuSection />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('uses translations for low stock alert', () => {
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
    mockUseDashboardMetrics.mockReturnValue({
      isLoading: false,
      data: { lowStockCount: 5 },
    });

    render(<NotificationsMenuSection />);
    expect(screen.getByText('Niedriger Bestand')).toBeInTheDocument();
  });
});
