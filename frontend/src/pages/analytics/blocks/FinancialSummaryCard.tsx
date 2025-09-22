/**
* @file FinancialSummaryCard.tsx
* @module pages/analytics/blocks/FinancialSummaryCard
*
* @summary
* Displays WAC-based financial summary for the selected period and supplier.
* Renders KPI row + a compact categorical bar chart (Purchases, COGS, Write-offs, Returns).
*/
import * as React from 'react';
import { Card, CardContent, Typography, Skeleton, Box, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import { getFinancialSummary, type FinancialSummary } from '../../../api/analytics/finance';
import { useTheme as useMuiTheme } from '@mui/material/styles';

export type FinancialSummaryCardProps = { from?: string; to?: string; supplierId?: string | null };


export default function FinancialSummaryCard({ from, to, supplierId }: FinancialSummaryCardProps) {
    const { t } = useTranslation(['analytics']);
    const muiTheme = useMuiTheme();

    
    const q = useQuery<FinancialSummary>({
        queryKey: ['analytics', 'financialSummary', from, to, supplierId ?? null],
        queryFn: () => getFinancialSummary({ from, to, supplierId: supplierId ?? undefined }),
    });
    const data = React.useMemo(() => {
        const s = q.data;
        if (!s) return [] as Array<{ name: string; value: number }>;
        return [
            { name: t('analytics:finance.purchases', 'Purchases'), value: s.purchases },
            { name: t('analytics:finance.cogs', 'COGS'), value: s.cogs },
            { name: t('analytics:finance.writeOffs', 'Write-offs'), value: s.writeOffs },
            { name: t('analytics:finance.returns', 'Returns'), value: s.returns },
        ];
    }, [q.data, t]);

    /** True when all financial buckets are zero → show a light empty state. */
    const allZero = (q.isSuccess && data.length > 0 && data.every(d => d.value === 0));

    /** Bar colors in the same order as `data` is built (Purchases, COGS, Write-offs, Returns). */
    const barColors = [
        muiTheme.palette.success.main, // Purchases
        muiTheme.palette.error.main,   // COGS
        muiTheme.palette.warning.main, // Write-offs
        muiTheme.palette.info.main,    // Returns
    ];

    return (
        <Card>
            <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('analytics:finance.title', 'Financial summary')}</Typography>
                {q.isLoading ? (
                    <Skeleton variant="rounded" height={220} />
                ) : allZero ? (
                    // --- Empty state when there is no financial activity in the period ---
                    <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
                        {t('analytics:finance.empty', 'No financial activity in this period.')}
                    </Box>
                ) : (
                    <>
                        {/* KPIs row */}
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1 }}>
                            <Kpi label={t('analytics:finance.opening', 'Opening')} value={q.data?.openingValue} />
                            <Kpi label={t('analytics:finance.ending', 'Ending')} value={q.data?.endingValue} />
                        </Stack>

                        {/* Categorical bars */}
                        <Box sx={{ height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value">
                                        {data.map((_, i) => (
                                            <Cell key={i} fill={barColors[i % barColors.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function Kpi({ label, value }: { label: string; value?: number }) {
    return (
        <Stack>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="h6">{typeof value === 'number' ? value.toLocaleString() : '—'}</Typography>
        </Stack>
    );
}