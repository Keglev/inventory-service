/**
 * @file LowStockTable.test.tsx
 * @module __tests__/components/pages/analytics/blocks/LowStockTable
 * @description Low-stock table for a selected supplier.
 *
 * Contract under test:
 * - Guard states: no supplier (prompt), loading (skeleton), error, empty.
 * - Renders one LowStockTableRow per visible derived row.
 * - "Showing n of m" footer appears only when the cap trims the list.
 * - formatQty formats numbers per user preference and coerces non-numeric
 *   values to 0.
 *
 * Row derivation (deficit, ordering, cap) is covered by useLowStockRows'
 * own test; the hook is mocked here.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { LowStockDerivedRow } from '../../../../../pages/analytics/hooks/useLowStockRows';
import { useLowStockRows } from '../../../../../pages/analytics/hooks/useLowStockRows';
import LowStockTable from '../../../../../pages/analytics/blocks/LowStockTable';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options && 'n' in options ? `${key} ${options.n}/${options.m}` : key,
  }),
}));

vi.mock('../../../../../hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: { dateFormat: 'DD/MM/YYYY', numberFormat: 'DE' },
  }),
}));

vi.mock('../../../../../pages/analytics/hooks/useLowStockRows', () => ({
  useLowStockRows: vi.fn(),
}));

// Renders the formatted quantity so formatQty's branches execute per row.
vi.mock('../../../../../pages/analytics/blocks/LowStockTableRow', () => ({
  LowStockTableRow: ({
    row,
    formatQty,
  }: {
    row: LowStockDerivedRow;
    formatQty: (v: number | undefined | null) => string;
  }) => (
    <tr data-testid="low-stock-row">
      <td>{row.itemName}</td>
      <td data-testid={`qty-${row.itemName}`}>{formatQty(row.quantity)}</td>
    </tr>
  ),
}));

const useLowStockRowsMock = vi.mocked(useLowStockRows);

function makeRow(overrides: Partial<LowStockDerivedRow>): LowStockDerivedRow {
  return {
    itemName: 'Widget',
    quantity: 1,
    minimumQuantity: 5,
    deficit: 4,
    ...overrides,
  } as LowStockDerivedRow;
}

function hookState(overrides: Partial<ReturnType<typeof useLowStockRows>>) {
  return {
    enabled: true,
    isLoading: false,
    isError: false,
    visible: [],
    total: 0,
    ...overrides,
  };
}

function setup(props: Partial<React.ComponentProps<typeof LowStockTable>> = {}) {
  return render(<LowStockTable supplierId="sup-1" {...props} />);
}

describe('LowStockTable', () => {
  beforeEach(() => {
    useLowStockRowsMock.mockReset();
  });

  it('prompts for a supplier when the query is disabled', () => {
    useLowStockRowsMock.mockReturnValue(hookState({ enabled: false }));

    setup({ supplierId: '' });

    expect(screen.getByText('analytics:selectSupplier')).toBeInTheDocument();
  });

  it('shows a skeleton while loading', () => {
    useLowStockRowsMock.mockReturnValue(hookState({ isLoading: true }));

    const { container } = setup();

    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('shows the error state when the query fails', () => {
    useLowStockRowsMock.mockReturnValue(hookState({ isError: true }));

    setup();

    expect(screen.getByText('common:error')).toBeInTheDocument();
  });

  it('shows the supplier-specific empty state when nothing is low', () => {
    useLowStockRowsMock.mockReturnValue(hookState({ visible: [], total: 0 }));

    setup();

    expect(screen.getByText('analytics:lowStock.noneForSupplier')).toBeInTheDocument();
  });

  it('renders headers, one row per visible entry, and formatted quantities', () => {
    useLowStockRowsMock.mockReturnValue(
      hookState({
        visible: [
          makeRow({ itemName: 'Widget', quantity: 1234 }),
          makeRow({ itemName: 'Bolt', quantity: undefined }),
        ],
        total: 2,
      })
    );

    setup();

    expect(screen.getAllByTestId('low-stock-row')).toHaveLength(2);
    for (const col of ['item', 'quantity', 'minimum', 'deficit', 'status']) {
      expect(screen.getByText(`analytics:lowStock.columns.${col}`)).toBeInTheDocument();
    }
    // de-DE grouping and undefined -> 0 coercion.
    expect(screen.getByTestId('qty-Widget')).toHaveTextContent('1.234');
    expect(screen.getByTestId('qty-Bolt')).toHaveTextContent('0');
    // Not capped: no footer.
    expect(screen.queryByText(/lowStock\.shownNOfM/)).not.toBeInTheDocument();
  });

  it('shows the "Showing n of m" footer when the cap trims the list', () => {
    useLowStockRowsMock.mockReturnValue(
      hookState({
        visible: [makeRow({ itemName: 'Widget' }), makeRow({ itemName: 'Bolt' })],
        total: 5,
      })
    );

    setup({ limit: 2 });

    expect(useLowStockRowsMock).toHaveBeenCalledWith('sup-1', undefined, undefined, 2);
    expect(screen.getByText('analytics:lowStock.shownNOfM 2/5')).toBeInTheDocument();
  });

  it('passes the date range and default limit to the rows hook', () => {
    useLowStockRowsMock.mockReturnValue(hookState({}));

    setup({ from: '2026-01-01', to: '2026-06-30' });

    expect(useLowStockRowsMock).toHaveBeenCalledWith('sup-1', '2026-01-01', '2026-06-30', 12);
  });
});
