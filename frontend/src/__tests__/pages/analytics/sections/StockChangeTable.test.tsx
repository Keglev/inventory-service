/**
 * @file StockChangeTable.test.tsx
 * @module __tests__/pages/analytics/sections/StockChangeTable
 * @testing StockChangeTable
 * @description The card renders the given columns per row, the skeleton or the
 *   empty message instead of the table, and the pagination bar (hidden without
 *   rows unless asked for). Column helpers: stockChangeColumns.test.ts.
 */
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import StockChangeTable, { type StockChangeTableProps } from '@/pages/analytics/sections/StockChangeTable';

type Row = { id: string; qty: number };

function setup(props: Partial<StockChangeTableProps<Row>> = {}) {
  const handlers = { onPageChange: vi.fn(), onRowsPerPageChange: vi.fn() };
  render(
    <StockChangeTable<Row>
      title="Changes"
      testId="changes"
      loading={false}
      emptyText="Nothing"
      rows={[{ id: 'a', qty: 5 }, { id: 'b', qty: -3 }]}
      rowKey={(row) => row.id}
      columns={[
        { header: 'Id', render: (row) => row.id },
        { header: 'Qty', render: (row) => String(row.qty), align: 'right', sx: (row) => ({ color: row.qty < 0 ? 'red' : 'green' }) },
      ]}
      total={30}
      page={0}
      rowsPerPage={10}
      rowsPerPageOptions={[10, 25]}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe('StockChangeTable', () => {
  it('renders a header and a cell per column for each row', () => {
    setup();
    const card = screen.getByTestId('changes');
    expect(within(card).getByText('Changes')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Id', 'Qty']);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.map((r) => [...r.querySelectorAll('td')].map((c) => c.textContent))).toEqual([['a', '5'], ['b', '-3']]);
    expect(rows[1].querySelectorAll('td')[1]).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });

  it('shows the skeleton while loading', () => {
    setup({ loading: true });
    expect(screen.getByTestId('changes').querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows the empty message and hides the pagination bar without rows', () => {
    setup({ rows: [], total: 0 });
    expect(screen.getByText('Nothing')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText(/1–10 of/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /next page/i })).not.toBeInTheDocument();
  });

  it('keeps the pagination bar without rows when asked to, with its label', () => {
    setup({ rows: [], total: 0, paginationWhenEmpty: true, labelRowsPerPage: 'Per page' });
    expect(screen.getByText('Per page')).toBeInTheDocument();
  });

  it('reports page changes and the new page size as a number', () => {
    const { onPageChange, onRowsPerPageChange } = setup();
    fireEvent.click(screen.getByRole('button', { name: /next page/i }));
    expect(onPageChange).toHaveBeenCalledWith(1);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: '25' }));
    expect(onRowsPerPageChange).toHaveBeenCalledWith(25);
  });
});
