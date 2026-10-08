/**
 * @file NotificationBell.test.tsx
 * @module __tests__/app/layout/header/NotificationBell
 * @testing Vitest + React Testing Library; useDashboardMetrics and the popover body mocked
 * @description
 * Contract of the header bell (FW5 fork 7):
 * - Accessible name "Notifications"; the badge shows the below-minimum count and hides at 0.
 * - Clicking opens a popover with NotificationsMenuSection; Escape closes it.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tEn } from '@/__tests__/test/i18nEn';
import NotificationBell from '@/app/layout/header/NotificationBell';

const mockUseDashboardMetrics = vi.hoisted(() => vi.fn());

vi.mock('@/api/analytics/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => mockUseDashboardMetrics(),
}));
vi.mock('@/app/HamburgerMenu/NotificationsMenuSection', () => ({
  default: () => <div data-testid="notifications-section">Notifications body</div>,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => tEn(key, options) }),
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDashboardMetrics.mockReturnValue({ isLoading: false, data: { lowStockCount: 5 } });
  });

  it('renders a button named Notifications', () => {
    render(<NotificationBell />);
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('shows the below-minimum count in the badge', () => {
    const { container } = render(<NotificationBell />);
    const badge = container.querySelector('.MuiBadge-badge');
    expect(badge).toHaveTextContent('5');
    expect(badge).not.toHaveClass('MuiBadge-invisible');
  });

  it('hides the badge when nothing is below minimum', () => {
    mockUseDashboardMetrics.mockReturnValue({ isLoading: false, data: { lowStockCount: 0 } });
    const { container } = render(<NotificationBell />);
    expect(container.querySelector('.MuiBadge-badge')).toHaveClass('MuiBadge-invisible');
  });

  it('hides the badge while the metrics load', () => {
    mockUseDashboardMetrics.mockReturnValue({ isLoading: true, data: undefined });
    const { container } = render(<NotificationBell />);
    expect(container.querySelector('.MuiBadge-badge')).toHaveClass('MuiBadge-invisible');
  });

  it('opens the notifications popover on click and closes it with Escape', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);
    expect(screen.queryByTestId('notifications-section')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(await screen.findByTestId('notifications-section')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByTestId('notifications-section')).not.toBeInTheDocument());
  });
});
