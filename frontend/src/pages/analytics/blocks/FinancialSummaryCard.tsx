/**
 * @file FinancialSummaryCard.tsx
 * @module pages/analytics/blocks/FinancialSummaryCard
 *
 * @summary
 * WAC-based financial summary for the selected period, of one supplier or of
 * all suppliers when none is picked: an Opening/Ending KPI row plus a horizontal
 * bar chart (Purchases, COGS, Write-offs, Returns).
 *
 * @enterprise
 * - An empty supplier filter means all suppliers, as in every supplier filter: the
 *   endpoint answers without supplierId with the all-supplier summary. The query
 *   waits only for the date range, which the endpoint requires.
 * - An all-zero result triggers a distinct empty state, so "nothing happened in
 *   this period" does not read as a broken chart.
 * - The API layer (getFinancialSummary) returns one normalized shape with
 *   zero defaults; this component consumes it as is.
 * - A caption names the costing method the backend reports. The ending value
 *   is valued at weighted average cost, so it differs from a stock value at
 *   current prices; without the caption the two figures look contradictory.
 * - Bars run horizontally, so the category names sit on the Y axis, which
 *   sizes itself to the longest one (width="auto") and draws all of them
 *   (interval={0}). As vertical bars on a card about 400 px wide, the German
 *   labels would overlap, Recharts would drop "Warenaufwand", and the value
 *   axis would cut "1.400,00" to ".400,00".
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

  const q = useQuery<FinancialSummary>({
    queryKey: ['analytics', 'financialSummary', from, to, supplierId ?? null],
    queryFn: () => getFinancialSummary({ from, to, supplierId: supplierId ?? undefined }),
    enabled: !!from && !!to,
  });

  // Each bar carries its colour as `fill`, which Recharts reads per entry (Cell is
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

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1 }}>
              <Kpi label={t('analytics:finance.opening')} value={q.data?.openingValue} numberFormat={userPreferences.numberFormat} />
              <Kpi label={t('analytics:finance.ending')} value={q.data?.endingValue} numberFormat={userPreferences.numberFormat} />
            </Stack>

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
