/**
 * @file MovementDrilldownTable.tsx
 * @module pages/analytics/sections/MovementDrilldownTable
 *
 * @summary
 * Row-level drilldown under the movement charts: recent stock changes for the
 * active window/supplier/item filters, showing direction (signed delta) and
 * reason per row. Paged on the server through /api/analytics/stock-updates/page.
 * The pagination bar is shown whenever there are rows, including a single page,
 * as in the inventory table; its arrows are disabled at either end. A change of
 * any filter returns to the first page.
 */
import * as React from 'react';
import {
  Card, CardContent, Typography, Skeleton, Box,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, TablePagination,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getStockUpdatesPage, type StockUpdatesPage } from '../../../api/analytics/updates';
import { useSettings } from '../../../hooks/useSettings';
import { formatDate, formatNumber } from '../../../utils/formatters';
import { reasonLabel } from './reasonLabels';

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

  return (
    <Card data-testid="movement-drilldown">
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {t('analytics:movements.drilldownTitle')}
        </Typography>

        {q.isLoading ? (
          <Skeleton variant="rounded" height={180} />
        ) : rows.length === 0 ? (
          <Box sx={{ height: 120, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
            {t('analytics:movements.empty')}
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 360 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>{t('analytics:stockUpdates.columns.datetime')}</TableCell>
                  <TableCell>{t('analytics:stockUpdates.columns.item')}</TableCell>
                  <TableCell align="right">{t('analytics:stockUpdates.columns.change')}</TableCell>
                  <TableCell>{t('analytics:stockUpdates.columns.reason')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={`${row.timestamp}-${row.itemName}-${idx}`} hover>
                    <TableCell>{formatDate(row.timestamp, userPreferences.dateFormat) || row.timestamp}</TableCell>
                    <TableCell>{row.itemName}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: row.delta < 0 ? 'error.main' : 'success.main', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {(row.delta > 0 ? '+' : '') + formatNumber(row.delta, userPreferences.numberFormat, 0)}
                    </TableCell>
                    <TableCell>{row.reason ? reasonLabel(t, row.reason) : ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {rows.length > 0 && (
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_e, next) => setPage(next)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          />
        )}
      </CardContent>
    </Card>
  );
}
