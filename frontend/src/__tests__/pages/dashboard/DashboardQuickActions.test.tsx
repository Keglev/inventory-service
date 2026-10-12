/**
 * @file DashboardQuickActions.test.tsx
 * @module __tests__/pages/dashboard/DashboardQuickActions
 * @testing Vitest + React Testing Library
 * @description Label switch of the dashboard shortcuts: full labels from sm,
 *   navigation labels on phones, same targets in both. Navigation from the
 *   full labels is covered in Dashboard.test.tsx.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DashboardQuickActions from '@/pages/dashboard/DashboardQuickActions';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockUseMediaQuery = vi.hoisted(() => vi.fn(() => false));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// jsdom has no media queries; the hook decides phone versus wider.
vi.mock('@mui/material/useMediaQuery', () => ({ default: mockUseMediaQuery }));

describe('DashboardQuickActions', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseMediaQuery.mockReturnValue(false);
  });

  it('shows the full action labels when the screen is sm or wider', () => {
    render(<DashboardQuickActions />);

    expect(screen.getByRole('button', { name: 'dashboard.actions.manageInventory' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'dashboard.actions.manageSuppliers' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'dashboard.actions.viewAnalytics' })).toBeInTheDocument();
  });

  it('shows the navigation labels and keeps the targets when the screen is a phone', async () => {
    mockUseMediaQuery.mockReturnValue(true);
    const user = userEvent.setup();
    render(<DashboardQuickActions />);

    expect(screen.queryByRole('button', { name: 'dashboard.actions.manageInventory' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'nav.inventory' }));
    await user.click(screen.getByRole('button', { name: 'nav.suppliers' }));
    await user.click(screen.getByRole('button', { name: 'nav.analytics' }));

    expect(mockNavigate.mock.calls.map((call) => call[0])).toEqual([
      '/inventory',
      '/suppliers',
      '/analytics/overview',
    ]);
  });
});
