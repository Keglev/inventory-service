/**
 * @file MovementDrilldownTable.tsx
 * @module pages/analytics/sections/MovementDrilldownTable
 *
 * @summary
 * Row-level drilldown under the movement charts: recent stock changes for the
 * active window/supplier/item filters, showing direction (signed delta) and
 * reason per row.
 *
 * @enterprise
 * Paged on the server through /api/analytics/stock-updates/page, because the
 * change log is unbounded. The pagination bar is shown whenever there are rows,
 * including a single page, as in the inventory table; its arrows are disabled at
 * either end. A change of any filter returns to the first page.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getStockUpdatesPage, type StockUpdateRow, type StockUpdatesPage } from '../../../api/analytics/updates';
import { useSettings } from '../../../hooks/useSettings';
import StockChangeTable from './StockChangeTable';
import { changeColumn, dateColumn, reasonColumn, type StockChangeColumn } from './stockChangeColumns';

export type MovementDrilldownTableProps = {
  from?: string;
  to?: string;
  supplierId?: string | null;
  /** Applied (debounced) partial item name filter. */
  itemName?: string;
};

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

export default function MovementDrilldownTable({ from, to, supplierId, itemName }: MovementDrilldownTableProps) {
  const { t } = useTranslation(['analytics']);
  const { userPreferences } = useSettings();
  const [rowsPerPage, setRowsPerPage] = React.useState(ROWS_PER_PAGE_OPTIONS[0]);

  // The page belongs to one filter combination; any other combination starts at 0.
  const filterKey = JSON.stringify([from ?? null, to ?? null, supplierId ?? null, itemName ?? null]);
  const [paging, setPaging] = React.useState({ filterKey, page: 0 });
  const page = paging.filterKey === filterKey ? paging.page : 0;
  const setPage = (next: number) => setPaging({ filterKey, page: next });

  const q = useQuery<StockUpdatesPage>({
    queryKey: ['analytics', 'movementDrilldown', from ?? null, to ?? null, supplierId ?? null, itemName ?? null, page, rowsPerPage],
    queryFn: () =>
      getStockUpdatesPage({
        from,
        to,
        supplierId: supplierId ?? undefined,
        itemName: itemName || undefined,
        page,
        size: rowsPerPage,
      }),
    staleTime: 60_000,
    // Keeps the current page visible while the next one loads.
    placeholderData: keepPreviousData,
  });

  const rows = q.data?.rows ?? [];
  const total = q.data?.total ?? 0;

  const columns: StockChangeColumn<StockUpdateRow>[] = [
    dateColumn(t('analytics:stockUpdates.columns.datetime'), (row) => row.timestamp, userPreferences.dateFormat),
    { header: t('analytics:stockUpdates.columns.item'), render: (row) => row.itemName },
    changeColumn(t('analytics:stockUpdates.columns.change'), (row) => row.delta, userPreferences.numberFormat),
    reasonColumn(t('analytics:stockUpdates.columns.reason'), (row) => row.reason, t),
  ];

  return (
    <StockChangeTable
      title={t('analytics:movements.drilldownTitle')}
      testId="movement-drilldown"
      loading={q.isLoading}
      emptyText={t('analytics:movements.empty')}
      rows={rows}
      rowKey={(row, idx) => `${row.timestamp}-${row.itemName}-${idx}`}
      columns={columns}
      total={total}
      page={page}
      onPageChange={setPage}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={(size) => {
        setRowsPerPage(size);
        setPage(0);
      }}
      rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
    />
  );
}
