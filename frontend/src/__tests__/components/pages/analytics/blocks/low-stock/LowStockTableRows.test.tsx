/**
 * @file LowStockTableRows.test.tsx
 * @module __tests__/pages/analytics/low-stock/LowStockTableRows
 *
 * @summary
 * Tests rendering and formatting logic for LowStockTableRows.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { LowStockRowWithDeficit } from '../../../../../../pages/analytics/blocks/low-stock/LowStockTable.types';

const mockFormatNumber = vi.fn(
  (value: number, format: 'DE' | 'EN_US', decimals = 0) => `fmt-${value}-${format}-${decimals}`
);

const mockLowStockStatusCell = vi.fn((props: { deficit: number }) => props);

vi.mock('../../../../../../utils/formatters', () => ({
  formatNumber: mockFormatNumber,
}));

vi.mock('../../../../../../pages/analytics/blocks/low-stock/LowStockStatusCell', () => ({
  LowStockStatusCell: (props: { deficit: number }) => {
    mockLowStockStatusCell(props);
    return <span data-testid={`status-${props.deficit}`}>status-{props.deficit}</span>;
  },
}));

const { LowStockTableRows } = await import('../../../../../../pages/analytics/blocks/low-stock/LowStockTableRows');

describe('LowStockTableRows', () => {
  const theme = createTheme({
    palette: {
      mode: 'light',
      error: { main: '#f44336' },
      warning: { main: '#ffa726' },
      text: { primary: '#212121' },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderRows = (rows: LowStockRowWithDeficit[], numberFormat: 'DE' | 'EN_US') =>
    render(
      <ThemeProvider theme={theme}>
        <table>
          <LowStockTableRows rows={rows} numberFormat={numberFormat} />
        </table>
      </ThemeProvider>
    );

  it('renders formatted quantities, applies deficit colors, and delegates to status cell', () => {
    const rows: LowStockRowWithDeficit[] = [
      { itemName: 'Critical Widget', quantity: 2, minimumQuantity: 10, deficit: 8 },
      { itemName: 'Warning Widget', quantity: 4, minimumQuantity: 7, deficit: 3 },
      { itemName: 'Stable Widget', quantity: 12, minimumQuantity: 10, deficit: 0 },
    ];

    const { container } = renderRows(rows, 'EN_US');

    const renderedRows = container.querySelectorAll('tbody tr');
    expect(renderedRows).toHaveLength(rows.length);

    const firstRowHeader = renderedRows[0].querySelector('th');
    expect(firstRowHeader?.textContent).toBe('Critical Widget');

    const firstRowCells = renderedRows[0].querySelectorAll('td');
    expect(firstRowCells[0].textContent).toBe('fmt-2-EN_US-0');
    expect(firstRowCells[1].textContent).toBe('fmt-10-EN_US-0');
    expect(firstRowCells[2].textContent).toBe('fmt-8-EN_US-0');
    expect(firstRowCells[2]).toHaveStyle({ color: theme.palette.error.main });
    expect(firstRowCells[3].textContent).toBe('status-8');

    const secondRowCells = renderedRows[1].querySelectorAll('td');
    expect(secondRowCells[0].textContent).toBe('fmt-4-EN_US-0');
    expect(secondRowCells[1].textContent).toBe('fmt-7-EN_US-0');
    expect(secondRowCells[2]).toHaveStyle({ color: theme.palette.warning.main });

    const thirdRowCells = renderedRows[2].querySelectorAll('td');
    expect(thirdRowCells[2]).toHaveStyle({ color: theme.palette.text.primary });

    expect(mockLowStockStatusCell.mock.calls.map(([args]) => args.deficit)).toEqual([8, 3, 0]);
  });

  it('normalizes non-numeric inputs to zero using formatter', () => {
    const rows: LowStockRowWithDeficit[] = [
      {
        itemName: 'Unknown Widget',
        quantity: undefined as unknown as number,
        minimumQuantity: Number.NaN,
        deficit: Number.NaN,
      },
    ];

    const { container } = renderRows(rows, 'DE');

    const cells = container.querySelectorAll('tbody tr')[0].querySelectorAll('td');
    expect(cells[0].textContent).toBe('fmt-0-DE-0');
    expect(cells[1].textContent).toBe('fmt-0-DE-0');
    expect(cells[2].textContent).toBe('fmt-0-DE-0');

    expect(mockFormatNumber).toHaveBeenCalledWith(0, 'DE', 0);
    expect(screen.getByTestId('status-NaN')).toBeInTheDocument();
  });
});
