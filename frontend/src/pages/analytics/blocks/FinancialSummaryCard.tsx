/**
 * @file FinancialSummaryCard.tsx
 * @module pages/analytics/blocks/FinancialSummaryCard
 *
 * @summary
 * WAC-based financial summary for the selected period and supplier:
 * an Opening/Ending KPI row plus a horizontal bar chart (Purchases,
 * COGS, Write-offs, Returns).
 *
 * @enterprise
 * - The finance endpoint is supplier-gated on this backend; calling it
 *   without a supplier returns errors. The hook is therefore declared
 *   unconditionally and gated via `enabled = !!supplierId`, complying
 *   with the Rules of Hooks while avoiding pointless requests.
 * - An all-zero result triggers a distinct empty-state, separate from
 *   the no-supplier helper card, so the user can tell "no supplier"
 *   apart from "nothing happened in this period".
 * - DTO field-name drift across deployments is absorbed in the API
 *   layer; this component consumes a single normalized shape.
 * - A caption names the costing method the backend reports. The ending value
 *   is valued at weighted average cost, so it differs from a stock value at
 *   current prices; without the caption the two figures look contradictory.
 * - Bars run horizontally, so the category names sit on the Y axis, which
 *   sizes itself to the longest one (width="auto") and draws all of them
 *   (interval={0}). As vertical bars on a card about 400 px wide, the German
 *   labels overlapped, Recharts dropped "Warenaufwand", and the value axis
 *   cut "1.400,00" to ".400,00".
 */
import { Card, CardContent, Typography, Skeleton, Box, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { getFinancialSummary, type FinancialSummary } from '../../../api/analytics/finance';
import { useSettings } from '../../../hooks/useSettings';
import { formatNumber } from '../../../utils/formatters';
import { chartTooltipProps } from '../../../utils/chartTooltip';
import { chartAxisProps } from '../../../utils/chartAxis';

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
            {t('analytics:finance.title')}
          </Typography>
          <Box sx={{ color: 'text.secondary' }}>
            {t('analytics:frequency.selectSupplier')}
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Build chart series (no hook -> safe w.r.t. Rules of Hooks). Each bar
  // carries its colour as `fill`, which Recharts reads per entry (Cell is
  // deprecated in Recharts 3 and goes in 4).
  const s = q.data;
  const data: Array<{ name: string; value: number; fill: string }> = s
    ? [
      { name: t('analytics:finance.purchases'), value: s.purchases, fill: muiTheme.palette.success.main },
      { name: t('analytics:finance.cogs'), value: s.cogs, fill: muiTheme.palette.error.main },
      { name: t('analytics:finance.writeOffs'), value: s.writeOffs, fill: muiTheme.palette.warning.main },
      { name: t('analytics:finance.returns'), value: s.returns, fill: muiTheme.palette.info.main },
    ]
    : [];

  /** True when all buckets are zero -> show a light empty state. */
  const allZero = q.isSuccess && data.length > 0 && data.every(d => d.value === 0);

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {t('analytics:finance.title')}
        </Typography>

        {q.isLoading ? (
          <Skeleton variant="rounded" height={220} />
        ) : allZero ? (
          // --- Empty state when there is no financial activity in the period ---
          <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
            {t('analytics:finance.empty')}
          </Box>
        ) : (
          <>
            {s?.method ? (
              <Typography
                variant="caption"
                component="p"
                data-testid="valuation-basis"
                sx={{
                  color: 'text.secondary',
                  mt: -0.5,
                  mb: 1,
                }}
              >
                {s.method === 'WAC'
                  ? t('analytics:finance.valuation.wac')
                  : t('analytics:finance.valuation.other', { method: s.method })}
              </Typography>
            ) : null}

            {/* KPIs */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1 }}>
              <Kpi label={t('analytics:finance.opening')} value={q.data?.openingValue} numberFormat={userPreferences.numberFormat} />
              <Kpi label={t('analytics:finance.ending')} value={q.data?.endingValue} numberFormat={userPreferences.numberFormat} />
            </Stack>

            {/* Bars */}
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis {...chartAxisProps(muiTheme)} type="number" tickFormatter={(value) => formatNumber(Number(value), userPreferences.numberFormat, 2)} />
                  <YAxis {...chartAxisProps(muiTheme)} type="category" dataKey="name" width="auto" interval={0} />
                  <Tooltip
                    {...chartTooltipProps(muiTheme)}
                    formatter={(value) =>
                      typeof value === 'number'
                        ? `${formatNumber(value, userPreferences.numberFormat, 2)} €`
                        : value
                    }
                  />
                  <Bar dataKey="value" name={t('analytics:finance.amount')} isAnimationActive={false} />
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
      <Typography variant="caption" sx={{
        color: 'text.secondary'
      }}>{label}</Typography>
      <Typography variant="h6">
        {typeof value === 'number' ? formatNumber(value, numberFormat, 2) : '—'}
      </Typography>
    </Stack>
  );
}
