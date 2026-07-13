/**
 * @file InventoryTable.test.tsx
 * @module __tests__/components/pages/inventory/InventoryTable
 * @description DataGrid wrapper with server pagination/sorting, row-click
 * selection, stock-level row classing, and the loading overlay.
 *
 * Contract under test:
 * - Forwards rows, columns, rowCount, pagination and sort models to the grid.
 * - getRowClassName derives numeric onHand/minQty per row (nullish -> 0).
 * - onRowClick forwards the clicked row id.
 * - Loading renders the absolute overlay spinner; hidden otherwise.
 * - Row-state sx callbacks resolve theme palette colors for selected /
 *   warning / critical classes.
 *
 * The local DataGrid mock invokes the callback props (unlike the shared
 * inert stub) so the wrapper's own lambdas execute under test.
 */
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import type { InventoryRow } from '../../../../api/inventory/types';

type GridMockProps = {
  rows?: Array<Record<string, unknown>>;
  columns?: unknown[];
  rowCount?: number;
  loading?: boolean;
  paginationModel?: unknown;
  sortModel?: unknown;
  onPaginationModelChange?: (model: unknown) => void;
  onSortModelChange?: (model: unknown) => void;
  getRowClassName?: (params: { row: Record<string, unknown> }) => string;
  onRowClick?: (params: { row: Record<string, unknown> }) => void;
  sx?: Record<string, Record<string, unknown>>;
  children?: ReactNode;
};

// Captures the sx prop so the theme-arrow style callbacks can be exercised.
let lastSx: GridMockProps['sx'] = undefined;

vi.mock('@mui/x-data-grid', () => ({
  DataGrid: (props: GridMockProps) => {
    lastSx = props.sx;
    const rows = props.rows ?? [];
    return (
      <div
        data-testid="grid"
        data-rows={rows.length}
        data-cols={(props.columns ?? []).length}
        data-rowcount={props.rowCount}
        data-loading={String(props.loading)}
      >
        {rows.map((row) => (
          <button
            key={String(row.id)}
            data-testid={`row-${String(row.id)}`}
            data-class={props.getRowClassName?.({ row })}
            onClick={() => props.onRowClick?.({ row })}
          >
            {String(row.name)}
          </button>
        ))}
        <button
          data-testid="paginate"
          onClick={() => props.onPaginationModelChange?.({ page: 1, pageSize: 25 })}
        />
        <button
          data-testid="sort"
          onClick={() => props.onSortModelChange?.([{ field: 'name', sort: 'desc' }])}
        />
      </div>
    );
  },
}));

import { InventoryTable } from '../../../../pages/inventory/components/InventoryTable';

const rows = [
  { id: 'a', name: 'Alpha', onHand: 10, minQty: 2 },
  { id: 'b', name: 'Beta', onHand: null, minQty: undefined },
] as unknown as InventoryRow[];

function setup(overrides: Partial<React.ComponentProps<typeof InventoryTable>> = {}) {
  const onPaginationChange = vi.fn();
  const onSortChange = vi.fn();
  const onRowClick = vi.fn();
  const getRowClassName = vi.fn(() => 'row-warning');

  render(
    <ThemeProvider theme={createTheme()}>
      <InventoryTable
        rows={rows}
        columns={[{ field: 'name' }, { field: 'onHand' }]}
        paginationModel={{ page: 0, pageSize: 10 }}
        onPaginationChange={onPaginationChange}
        sortModel={[]}
        onSortChange={onSortChange}
        selectedId={null}
        onRowClick={onRowClick}
        getRowClassName={getRowClassName}
        loading={false}
        rowCount={2}
        {...overrides}
      />
    </ThemeProvider>
  );

  return { onPaginationChange, onSortChange, onRowClick, getRowClassName };
}

describe('InventoryTable', () => {
  beforeEach(() => {
    lastSx = undefined;
  });

  it('forwards rows, columns, and rowCount to the grid', () => {
    setup();

    const grid = screen.getByTestId('grid');
    expect(grid).toHaveAttribute('data-rows', '2');
    expect(grid).toHaveAttribute('data-cols', '2');
    expect(grid).toHaveAttribute('data-rowcount', '2');
    expect(grid).toHaveAttribute('data-loading', 'false');
  });

  it('derives numeric onHand/minQty per row for the class function (nullish -> 0)', () => {
    const { getRowClassName } = setup();

    expect(screen.getByTestId('row-a')).toHaveAttribute('data-class', 'row-warning');
    expect(getRowClassName).toHaveBeenCalledWith(10, 2);
    // Beta row: null/undefined coerced to 0 before delegation.
    expect(getRowClassName).toHaveBeenCalledWith(0, 0);
  });

  it('forwards the clicked row id', () => {
    const { onRowClick } = setup();

    fireEvent.click(screen.getByTestId('row-b'));

    expect(onRowClick).toHaveBeenCalledWith('b');
  });

  it('forwards pagination and sort model changes', () => {
    const { onPaginationChange, onSortChange } = setup();

    fireEvent.click(screen.getByTestId('paginate'));
    fireEvent.click(screen.getByTestId('sort'));

    expect(onPaginationChange).toHaveBeenCalledWith({ page: 1, pageSize: 25 });
    expect(onSortChange).toHaveBeenCalledWith([{ field: 'name', sort: 'desc' }]);
  });

  it('shows the loading overlay only while loading', () => {
    setup({ loading: true });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('hides the loading overlay when idle', () => {
    setup({ loading: false });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('resolves theme palette colors in the row-state style callbacks', () => {
    setup();
    const theme = createTheme();

    expect(lastSx).toBeDefined();
    const sx = lastSx as NonNullable<GridMockProps['sx']>;
    for (const [cls, palette] of [
      ['& .row-selected', theme.palette.info.main],
      ['& .row-warning', theme.palette.warning.main],
      ['& .row-critical', theme.palette.error.main],
    ] as const) {
      const rules = sx[cls] as Record<string, unknown>;
      const bg = rules.backgroundColor as (t: typeof theme) => string;
      const shadow = rules.boxShadow as (t: typeof theme) => string;
      const hover = (rules['&:hover'] as Record<string, unknown>)
        .backgroundColor as (t: typeof theme) => string;

      expect(bg(theme)).toContain('!important');
      expect(shadow(theme)).toContain(palette);
      expect(hover(theme)).toContain('!important');
    }
  });
});
