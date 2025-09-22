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
                    <Box sx={{ overflow: 'auto' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('analytics:updates.when', 'When')}</TableCell>
                                    <TableCell>{t('analytics:updates.item', 'Item')}</TableCell>
                                    <TableCell align="right">{t('analytics:updates.delta', 'Δ Qty')}</TableCell>
                                    <TableCell>{t('analytics:updates.reason', 'Reason')}</TableCell>
                                    <TableCell>{t('analytics:updates.user', 'User')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {q.data!.map((r, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{r.timestamp}</TableCell>
                                        <TableCell>{r.itemName}</TableCell>
                                        <TableCell align="right">{r.delta >= 0 ? `+${r.delta}` : r.delta}</TableCell>
                                        <TableCell>{r.reason ?? '—'}</TableCell>
                                        <TableCell>{r.user ?? '—'}</TableCell>
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