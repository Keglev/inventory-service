/**
* @file MonthlyMovementMini.tsx
* @module pages/dashboard/blocks/MonthlyMovementMini
*
* @summary
* Compact monthly stock movement chart for the Dashboard. Reuses the same API
* as Analytics (A2) and defaults to the last 90 days.
*/
import { Card, CardContent, Typography, Skeleton, Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { getMonthlyStockMovement } from '../../../api/analytics';

function todayIso(): string { const d = new Date(); const p=(n:number)=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; }
function daysAgoIso(n: number): string { const d=new Date(); d.setDate(d.getDate()-n); const p=(n:number)=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; }

export default function MonthlyMovementMini() {
    const { t } = useTranslation('common');
    const from = daysAgoIso(90);
    const to = todayIso();
    
    const q = useQuery({
        queryKey: ['dashboard', 'movementMini', from, to],
        queryFn: () => getMonthlyStockMovement({ from, to }),
    });
    return (
        <Card>
            <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('dashboard.kpi.movementTitle', 'Stock movement (90d)')}</Typography>
                {q.isLoading ? (
                    <Skeleton variant="rounded" height={220} />
                ) : (
                    <Box sx={{ height: 240 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={q.data ?? []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="stockIn" />
                                <Bar dataKey="stockOut" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}