/**
 * @file FinancialSummaryCard.tsx
 * @module pages/analytics/blocks/FinancialSummaryCard
 *
 * @summary
 * Displays WAC-based financial summary for the selected period and supplier.
 * KPI row (Opening/Ending) + a categorical bar chart (Purchases, COGS, Write-offs, Returns).
 *
 * @enterprise
 * - This endpoint requires a supplier on your BE → we keep the hook unconditional,
 *   but gate the request via `enabled` and render a helper if no supplier is chosen.
 * - Field names vary across deployments; API layer maps multiple candidates.
 */
import { Card, CardContent, Typography, Skeleton, Box, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import { getFinancialSummary, type FinancialSummary } from '../../../api/analytics/finance';
import { useSettings } from '../../../hooks/useSettings';
import { formatNumber } from '../../../utils/formatters';

export type FinancialSummaryCardProps = { from?: string; to?: string; supplierId?: string | null };

export default function FinancialSummaryCard({ from, to, supplierId }: FinancialSummaryCardProps) {
  const { t } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();
  const { userPreferences } = useSettings();

  /** Finance API on this backend expects a supplier; do not fire without one. */
  const enabled = !!supplierId;

  // --- Hook must be unconditional; gate with `enabled` to avoid 500s without supplier ---
  const q = useQuery<FinancialSummary>({
    queryKey: ['analytics', 'financialSummary', from, to, supplierId ?? null],
    queryFn: () => getFinancialSummary({ from, to, supplierId: supplierId ?? undefined }),
    enabled,
  });

  // If supplier not chosen, render a light helper card
  if (!enabled) {
    return (
      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {t('analytics:finance.title', 'Financial summary')}
          </Typography>
          <Box sx={{ color: 'text.secondary' }}>
            {t('analytics:frequency.selectSupplier', 'Select a supplier to view')}
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Build chart series (no hook → safe w.r.t. Rules of Hooks)
  const s = q.data;
  const data: Array<{ name: string; value: number }> = s
    ? [
      { name: t('analytics:finance.purchases', 'Purchases'), value: s.purchases },
      { name: t('analytics:finance.cogs', 'COGS'), value: s.cogs },
      { name: t('analytics:finance.writeOffs', 'Write-offs'), value: s.writeOffs },
      { name: t('analytics:finance.returns', 'Returns'), value: s.returns },
    ]
    : [];

  /** True when all buckets are zero → show a light empty state. */
  const allZero = q.isSuccess && data.length > 0 && data.every(d => d.value === 0);

  /** Bar colors matching the series order. */
  const barColors = [
    muiTheme.palette.success.main, // Purchases
    muiTheme.palette.error.main,   // COGS
    muiTheme.palette.warning.main, // Write-offs
    muiTheme.palette.info.main,    // Returns
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {t('analytics:finance.title', 'Financial summary')}
        </Typography>

        {q.isLoading ? (
          <Skeleton variant="rounded" height={220} />
        ) : allZero ? (
          // --- Empty state when there is no financial activity in the period ---
          <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
            {t('analytics:finance.empty', 'No financial activity in this period.')}
          </Box>
        ) : (
          <>
            {/* KPIs */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1 }}>
              <Kpi label={t('analytics:finance.opening', 'Opening')} value={q.data?.openingValue} numberFormat={userPreferences.numberFormat} />
              <Kpi label={t('analytics:finance.ending', 'Ending')} value={q.data?.endingValue} numberFormat={userPreferences.numberFormat} />
            </Stack>

            {/* Bars */}
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" isAnimationActive={false}>
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

function Kpi({ label, value, numberFormat }: { label: string; value?: number; numberFormat: 'DE' | 'EN_US' }) {
  return (
    <Stack>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h6">
        {typeof value === 'number' ? formatNumber(value, numberFormat, 2) : '—'}
      </Typography>
    </Stack>
  );
}
