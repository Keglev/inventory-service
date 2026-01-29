/**
 * @file LowStockTableRows.test.tsx
 * @module __tests__/components/pages/analytics/blocks/low-stock/LowStockTableRows
 * @description
 * Enterprise unit tests for LowStockTableRows.
 *
 * Contract:
 * - Renders one table row per input item.
 * - Formats numeric cells via formatNumber(quantity/minimum/deficit).
 * - Applies deficit color semantics (error/warning/primary) based on deficit severity.
 * - Delegates status rendering to LowStockStatusCell with the original deficit value.
 *
 * Notes:
 * - We keep a real MUI theme because the component styles use theme palette values.
 * - We mock `formatNumber` to make numeric formatting deterministic.
 * - We mock LowStockStatusCell to verify delegation without re-testing its internals.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import type { LowStockRowWithDeficit } from '@/pages/analytics/blocks/low-stock/LowStockTable.types';

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

const mockFormatNumber = vi.hoisted(() =>
  vi.fn((value: number, format: 'DE' | 'EN_US', decimals = 0) => `fmt-${value}-${format}-${decimals}`),
);

const mockLowStockStatusCell = vi.hoisted(() => vi.fn());

vi.mock('@/utils/formatters', () => ({
  formatNumber: mockFormatNumber,
}));

vi.mock('@/pages/analytics/blocks/low-stock/LowStockStatusCell', () => ({
  LowStockStatusCell: (props: { deficit: number }) => {
    mockLowStockStatusCell(props);
    // Render a stable marker so we can assert presence without depending on MUI Chip internals.
    return <span data-testid="low-stock-status-cell" />;
  },
}));

const { LowStockTableRows } = await import('@/pages/analytics/blocks/low-stock/LowStockTableRows');

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

const theme = createTheme({
  palette: {
    mode: 'light',
    error: { main: '#f44336' },
    warning: { main: '#ffa726' },
    text: { primary: '#212121' },
  },
});

function setup(rows: LowStockRowWithDeficit[], numberFormat: 'DE' | 'EN_US') {
  return render(
    <ThemeProvider theme={theme}>
      <table>
        <LowStockTableRows rows={rows} numberFormat={numberFormat} />
      </table>
    </ThemeProvider>,
  );
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('LowStockTableRows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders formatted values, applies deficit colors, and delegates to status cell', () => {
    const rows: LowStockRowWithDeficit[] = [
      { itemName: 'Critical Widget', quantity: 2, minimumQuantity: 10, deficit: 8 },
      { itemName: 'Warning Widget', quantity: 4, minimumQuantity: 7, deficit: 3 },
      { itemName: 'Stable Widget', quantity: 12, minimumQuantity: 10, deficit: 0 },
    ];

    const { container } = setup(rows, 'EN_US');

    const renderedRows = container.querySelectorAll('tbody tr');
    expect(renderedRows).toHaveLength(rows.length);

    // Row header is the item name (table semantics contract).
    expect(renderedRows[0].querySelector('th')?.textContent).toBe('Critical Widget');

    // Cells: [quantity, minimum, deficit, status]
    const firstRowCells = renderedRows[0].querySelectorAll('td');
    expect(firstRowCells[0].textContent).toBe('fmt-2-EN_US-0');
    expect(firstRowCells[1].textContent).toBe('fmt-10-EN_US-0');
    expect(firstRowCells[2].textContent).toBe('fmt-8-EN_US-0');
    expect(firstRowCells[2]).toHaveStyle({ color: theme.palette.error.main });

    const secondRowCells = renderedRows[1].querySelectorAll('td');
    expect(secondRowCells[2]).toHaveStyle({ color: theme.palette.warning.main });

    const thirdRowCells = renderedRows[2].querySelectorAll('td');
    expect(thirdRowCells[2]).toHaveStyle({ color: theme.palette.text.primary });

    // Delegation contract: each row renders a status cell and receives the row deficit value.
    expect(container.querySelectorAll('[data-testid="low-stock-status-cell"]')).toHaveLength(rows.length);
    expect(mockLowStockStatusCell.mock.calls.map(([args]) => args.deficit)).toEqual([8, 3, 0]);
  });

  it('normalizes non-finite numeric inputs to zero for formatted cell display', () => {
    const rows: LowStockRowWithDeficit[] = [
      {
        itemName: 'Unknown Widget',
        quantity: undefined as unknown as number,
        minimumQuantity: Number.NaN,
        deficit: Number.NaN,
      },
    ];

    const { container } = setup(rows, 'DE');

    const cells = container.querySelectorAll('tbody tr')[0].querySelectorAll('td');

    // Display contract: numeric cells should render as 0 when inputs are not finite.
    expect(cells[0].textContent).toBe('fmt-0-DE-0');
    expect(cells[1].textContent).toBe('fmt-0-DE-0');
    expect(cells[2].textContent).toBe('fmt-0-DE-0');

    // Formatter contract: normalization happens before calling formatNumber.
    expect(mockFormatNumber).toHaveBeenCalledWith(0, 'DE', 0);

    // Delegation contract: status cell still receives the original deficit value (even if NaN).
    // This documents the current behavior without assuming status should normalize NaN.
    expect(mockLowStockStatusCell).toHaveBeenCalledWith(expect.objectContaining({ deficit: Number.NaN }));
  });
});
