/**
* @file StockValueCard.tsx
* @module pages/analytics/blocks/StockValueCard
*
* @summary
* Card that renders the stock value over time (A1).
* Fetching is resilient and sorts data client-side for deterministic charts.
*/
import * as React from 'react';
import { Card, CardContent, Typography, Skeleton, Box } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { getStockValueOverTime, type StockValuePoint } from '../../../api/analytics/stock';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import { useSettings } from '../../../hooks/useSettings';
import { formatDate, formatNumber } from '../../../utils/formatters';


export type StockValueCardProps = { from?: string; to?: string; supplierId?: string | null };


export default function StockValueCard({ from, to, supplierId }: StockValueCardProps) {
    const { t } = useTranslation(['analytics']);
    const muiTheme = useMuiTheme();
    const { userPreferences } = useSettings();
    
    
    const q = useQuery<StockValuePoint[]>({
        queryKey: ['analytics', 'stockValue', from, to, supplierId ?? null],
        queryFn: () => getStockValueOverTime({ from, to, supplierId: supplierId ?? undefined }),
        staleTime: 60_000,
        retry: 0,
    });
    
    
    const data = React.useMemo(
        () => [...(q.data ?? [])].sort((a, b) => (a?.date ?? '').localeCompare(b?.date ?? '')),
        [q.data]
    );
    const formatDateLabel = React.useCallback(
        (value: string | number) => {
            const str = String(value);
            const formatted = formatDate(str, userPreferences.dateFormat);
            return formatted || str;
        },
        [userPreferences.dateFormat]
    );
    
    return (
        <Card>
        <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {t('analytics:cards.stockValue')}
        </Typography>
        {q.isLoading ? (
            <Skeleton variant="rounded" height={220} />
        ) : data.length === 0 ? (
            <Box sx={{ height: 260, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
            {t('analytics:cards.noData')}
            </Box>
        ) : (
            <Box sx={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={formatDateLabel}
                        />
                        <YAxis
                            domain={['auto', 'auto']}
                            tickFormatter={(value) => formatNumber(Number(value), userPreferences.numberFormat, 2)}
                        />
                        <Tooltip
                            labelFormatter={(value) => formatDateLabel(value as string)}
                            formatter={(value: number | string) =>
                                typeof value === 'number'
                                    ? formatNumber(value, userPreferences.numberFormat, 2)
                                    : value
                            }
                        />
            <Line
            type="monotone"
            dataKey="totalValue"
            stroke={muiTheme.palette.primary.main}
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
            connectNulls
            isAnimationActive={false}
            />
            </LineChart>
            </ResponsiveContainer>
            </Box>
        )}
        </CardContent>
        </Card>
    );
}