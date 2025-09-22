/**
* @file StockUpdatesTable.tsx
* @module pages/analytics/blocks/StockUpdatesTable
*
* @summary
* Recent stock updates (auditable changes) for the current filters. Minimal table
* with resilient parsing; shows an empty-state when nothing matches.
*/
import { Card, CardContent, Typography, Skeleton, Box, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getStockUpdates, type StockUpdateRow } from '../../../api/analytics/updates';

// Map backend reason codes to friendly labels
const REASON_LABEL: Record<string, string> = {
  INITIAL_STOCK: 'Purchase',
  INITIAL_STC: 'Purchase',          // seen variant
  INITIAL_ST: 'Purchase',           // extra safety
  ADJUSTMENT: 'Adjustment',
  SALE: 'Sale',
  WRITE_OFF: 'Write-off',
};
const formatReason = (r?: string) => (r ? (REASON_LABEL[r] ?? r) : '—');

export type StockUpdatesTableProps = { from?: string; to?: string; supplierId?: string | null };

export default function StockUpdatesTable({ from, to, supplierId }: StockUpdatesTableProps) {
    const { t } = useTranslation(['analytics']);
    
    
    const q = useQuery<StockUpdateRow[]>({
        queryKey: ['analytics', 'stockUpdates', from, to, supplierId ?? null],
        queryFn: () => getStockUpdates({ from, to, supplierId: supplierId ?? undefined, limit: 25 }),
    });
    return (
        <Card>
            <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('analytics:updates.title', 'Recent stock updates')}</Typography>
                {q.isLoading ? (
                    <Skeleton variant="rounded" height={220} />
                ) : (q.data?.length ?? 0) === 0 ? (
                    <Box sx={{ color: 'text.secondary' }}>{t('analytics:updates.empty', 'No updates in this period.')}</Box>
                ) : (
                    <Box sx={{ overflowX: 'auto', pr: 1 }}>
                        <Table size="small" sx={{ minWidth: 680, tableLayout: 'fixed' }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: 160 }}>{t('analytics:updates.when', 'When')}</TableCell>
                                    <TableCell sx={{ width: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {t('analytics:updates.item', 'Item')}
                                    </TableCell>
                                    <TableCell align="right" sx={{ width: 80 }}>{t('analytics:updates.delta', 'Δ Qty')}</TableCell>
                                    <TableCell sx={{ width: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {t('analytics:updates.reason', 'Reason')}
                                    </TableCell>
                                    <TableCell sx={{ width: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {t('analytics:updates.user', 'User')}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {q.data!.map((r, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{r.timestamp}</TableCell>
                                        <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {r.itemName}
                                        </TableCell>
                                        <TableCell align="right">{r.delta >= 0 ? `+${r.delta}` : r.delta}</TableCell>
                                        <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {formatReason(r.reason)}
                                        </TableCell>
                                        <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {r.user ?? '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}