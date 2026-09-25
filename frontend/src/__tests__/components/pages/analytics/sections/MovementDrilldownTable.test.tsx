/**
 * @file MovementDrilldownTable.test.tsx
 * @module __tests__/components/pages/analytics/sections/MovementDrilldownTable
 * @description Server paging of the movement drilldown: the bar shows for any
 * rows, its arrows follow the total, a page change requests that page, and a
 * filter change returns to the first page.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { tEn } from '../../../../test/i18nEn';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
  }),
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: { numberFormat: 'DE', dateFormat: 'DD.MM.YYYY' },
  }),
}));

const mockGetStockUpdatesPage = vi.fn();
vi.mock('@/api/analytics/updates', () => ({
  getStockUpdatesPage: (...args: unknown[]) => mockGetStockUpdatesPage(...args),
}));

const MovementDrilldownTable = (await import('@/pages/analytics/sections/MovementDrilldownTable')).default;

type Props = React.ComponentProps<typeof MovementDrilldownTable>;

function rows(count: number, prefix: string) {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: `2026-02-0${(i % 9) + 1}T09:00:00`,
    itemName: `${prefix} ${i + 1}`,
    delta: 1,
    reason: 'SOLD',
  }));
}

function setup(props: Props = { from: '2026-01-01', to: '2026-06-30' }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={client}>
      <MovementDrilldownTable {...props} />
    </QueryClientProvider>,
  );
  const rerender = (next: Props) =>
    view.rerender(
      <QueryClientProvider client={client}>
        <MovementDrilldownTable {...next} />
      </QueryClientProvider>,
    );
  return { ...view, rerender };
}

describe('MovementDrilldownTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the bar with both arrows disabled when every row fits on one page', async () => {
    mockGetStockUpdatesPage.mockResolvedValue({ rows: rows(4, 'Item'), total: 4 });
    setup();

    await screen.findByText('Item 1');
    expect(screen.getByText('1–4 of 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
    expect(mockGetStockUpdatesPage).toHaveBeenCalledWith(expect.objectContaining({ page: 0, size: 10 }));
  });

  it('requests the next page when the next arrow is clicked', async () => {
    const user = userEvent.setup();
    mockGetStockUpdatesPage.mockImplementation(async ({ page }: { page: number }) =>
      page === 0 ? { rows: rows(10, 'First'), total: 23 } : { rows: rows(10, 'Second'), total: 23 });
    setup();

    await screen.findByText('First 1');
    expect(screen.getByText('1–10 of 23')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /next page/i }));

    await screen.findByText('Second 1');
    expect(mockGetStockUpdatesPage).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, size: 10 }));
    expect(screen.getByText('11–20 of 23')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous page/i })).toBeEnabled();
  });

  it('returns to the first page when a filter changes', async () => {
    const user = userEvent.setup();
    mockGetStockUpdatesPage.mockResolvedValue({ rows: rows(10, 'Row'), total: 23 });
    const { rerender } = setup();

    await screen.findByText('Row 1');
    await user.click(screen.getByRole('button', { name: /next page/i }));
    await waitFor(() =>
      expect(mockGetStockUpdatesPage).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })));

    rerender({ from: '2026-01-01', to: '2026-06-30', itemName: 'Bolt' });

    await waitFor(() =>
      expect(mockGetStockUpdatesPage).toHaveBeenLastCalledWith(
        expect.objectContaining({ itemName: 'Bolt', page: 0 })));
  });

  it('shows the empty state and no bar when nothing matches', async () => {
    mockGetStockUpdatesPage.mockResolvedValue({ rows: [], total: 0 });
    setup();

    await screen.findByText('No stock changes in this period');
    expect(screen.queryByRole('button', { name: /next page/i })).toBeNull();
  });
});
