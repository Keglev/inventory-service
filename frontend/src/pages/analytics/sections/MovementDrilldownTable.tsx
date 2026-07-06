/**
 * @file MovementDrilldownTable.tsx
 * @module pages/analytics/sections/MovementDrilldownTable
 *
 * @summary
 * Row-level drilldown under the movement charts: recent stock changes for the
 * active window/supplier/item filters, showing direction (signed delta) and
 * reason per row. Fed by the existing /api/analytics/stock-updates endpoint —
 * no new backend surface for the drilldown.
 */
import {
  Card, CardContent, Typography, Skeleton, Box,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getStockUpdates, type StockUpdateRow } from '../../../api/analytics/updates';
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

const ROW_LIMIT = 50;

export default function MovementDrilldownTable({ from, to, supplierId, itemName }: MovementDrilldownTableProps) {
  const { t } = useTranslation(['analytics']);
  const { userPreferences } = useSettings();

  const q = useQuery<StockUpdateRow[]>({
    queryKey: ['analytics', 'movementDrilldown', from ?? null, to ?? null, supplierId ?? null, itemName ?? null],
    queryFn: () =>
      getStockUpdates({
        from,
        to,
        supplierId: supplierId ?? undefined,
        itemName: itemName || undefined,
        limit: ROW_LIMIT,
      }),
    staleTime: 60_000,
  });

  const rows = q.data ?? [];

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
      </CardContent>
    </Card>
  );
}
