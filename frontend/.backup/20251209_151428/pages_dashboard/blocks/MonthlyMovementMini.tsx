/**
* @file MonthlyMovementMini.tsx
* @module pages/dashboard/blocks/MonthlyMovementMini
*
* @summary
* Compact monthly stock movement chart for the Dashboard. Reuses the same API
* as Analytics (A2) and defaults to the last 90 days.
*/
import { Card, CardContent, Typography, Skeleton, Box } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { getMonthlyStockMovement } from '../../../api/analytics';
import { getTodayIso, getDaysAgoIso } from '../../../utils/formatters';

export default function MonthlyMovementMini() {
    const { t } = useTranslation('common');
    const from = getDaysAgoIso(90);
    const to = getTodayIso();
    const muiTheme = useMuiTheme();

    const q = useQuery({
        queryKey: ['dashboard', 'movementMini', from, to],
        queryFn: () => getMonthlyStockMovement({ from, to }),
    });
    return (
        <Card>
            <CardContent sx={{ py: 1.5, px: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 0.75 }}>{t('dashboard.kpi.movementTitle', 'Stock movement (90d)')}</Typography>
                {q.isLoading ? (
                    <Skeleton variant="rounded" height={220} />
                ) : (
                    <Box sx={{ height: 240 }}>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart data={q.data ?? []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
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