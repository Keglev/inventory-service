/**
* @file MonthlyMovementCard.tsx
* @module pages/analytics/blocks/MonthlyMovementCard
*
* @summary
* Card that renders monthly stock movement (A2).
*/
import { useCallback } from 'react';
import { Card, CardContent, Typography, Skeleton, Box } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getMonthlyStockMovement, type MonthlyMovement } from '../../../api/analytics/stock';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { useSettings } from '../../../hooks/useSettings';
import { formatDate, formatNumber } from '../../../utils/formatters';


export type MonthlyMovementCardProps = { from?: string; to?: string; supplierId?: string | null };


export default function MonthlyMovementCard({ from, to, supplierId }: MonthlyMovementCardProps) {
    const { t } = useTranslation(['analytics']);
    const muiTheme = useMuiTheme();
    const { userPreferences } = useSettings();
    const formatDateLabel = useCallback(
        (value: string | number) => {
            const str = String(value);
            const formatted = formatDate(str, userPreferences.dateFormat);
            return formatted || str;
        },
        [userPreferences.dateFormat]
    );
    
    
    const q = useQuery<MonthlyMovement[]>({
        queryKey: ['analytics', 'movement', from, to, supplierId ?? null],
        queryFn: () => getMonthlyStockMovement({ from, to, supplierId: supplierId ?? undefined }),
    });
    
    
    return (
        <Card>
        <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {t('analytics:cards.monthlyMovement')}
        </Typography>
        {q.isLoading ? (
            <Skeleton variant="rounded" height={220} />
        ) : (
            <Box sx={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={q.data ?? []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickFormatter={formatDateLabel} />
                        <YAxis tickFormatter={(value) => formatNumber(Number(value), userPreferences.numberFormat, 0)} />
                        <Tooltip
                            labelFormatter={(value) => formatDateLabel(value as string)}
                            formatter={(value: number | string) =>
                                typeof value === 'number'
                                    ? formatNumber(value, userPreferences.numberFormat, 0)
                                    : value
                            }
                        />
            <Legend />
            <Bar dataKey="stockIn" fill={muiTheme.palette.success.main} />
            <Bar dataKey="stockOut" fill={muiTheme.palette.error.main} />
            </BarChart>
            </ResponsiveContainer>
            </Box>
        )}
        </CardContent>
        </Card>
    );
}