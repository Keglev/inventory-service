/**
 * @file RecentStockActivityCard.tsx
 * @module pages/analytics/blocks/RecentStockActivityCard
 *
 * @summary
 * Stacked bar view of recent stock updates grouped by day and reason. Replaces the
 * verbose table for a faster visual scan while reusing the same backing API.
 */
import * as React from 'react';
import { Card, CardContent, Typography, Skeleton, Box } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { getStockUpdates, type StockUpdateRow } from '../../../api/analytics/updates';
import { useSettings } from '../../../hooks/useSettings';
import { formatDate, formatNumber } from '../../../utils/formatters';

export type RecentStockActivityCardProps = { from?: string; to?: string; supplierId?: string | null };

type ReasonLabelKey = 'initialStock' | 'adjustment' | 'sale' | 'writeOff' | 'return' | 'other';

const SERIES_ORDER: ReasonLabelKey[] = ['initialStock', 'adjustment', 'sale', 'writeOff', 'return', 'other'];
const DEFAULT_REASON_LABEL: Record<ReasonLabelKey, string> = {
  initialStock: 'Purchases',
  adjustment: 'Adjustments',
  sale: 'Sales',
  writeOff: 'Write-offs',
  return: 'Returns',
  other: 'Other',
};

function normalizeReason(reason?: string): ReasonLabelKey {
  if (!reason) return 'other';
  const upper = reason.toUpperCase();
  if (upper.startsWith('INITIAL')) return 'initialStock';
  if (upper.includes('ADJUST') || upper.includes('MANUAL')) return 'adjustment';
  if (upper.includes('SALE') || upper.includes('SOLD')) return 'sale';
  if (
    upper.includes('WRITE') ||
    upper.includes('SCRAP') ||
    upper.includes('EXPIRE') ||
    upper.includes('DAMAG') ||
    upper.includes('DESTROY')
  ) {
    return 'writeOff';
  }
  if (upper.includes('RETURN')) return 'return';
  return 'other';
}

export default function RecentStockActivityCard({ from, to, supplierId }: RecentStockActivityCardProps) {
  const { t } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();
  const { userPreferences } = useSettings();

  const q = useQuery<StockUpdateRow[]>({
    queryKey: ['analytics', 'stockUpdates', from, to, supplierId ?? null],
    queryFn: () => getStockUpdates({ from, to, supplierId: supplierId ?? undefined, limit: 200 }),
  });

  const { rows, reasonKeys } = React.useMemo(() => {
    if (!q.data) return { rows: [] as Array<Record<string, number | string>>, reasonKeys: [] as ReasonLabelKey[] };

    const buckets = new Map<string, { dateObj: Date; totals: Partial<Record<ReasonLabelKey, number>> }>();
    const presentReasons = new Set<ReasonLabelKey>();

    for (const update of q.data) {
      if (!update.timestamp) continue;
      const timestamp = new Date(update.timestamp);
      if (Number.isNaN(timestamp.getTime())) continue;
      const dayKey = timestamp.toISOString().slice(0, 10); // group by UTC day
      const reasonKey = normalizeReason(update.reason);
      presentReasons.add(reasonKey);

      const bucket = buckets.get(dayKey) ?? { dateObj: timestamp, totals: {} };
      const delta = typeof update.delta === 'number' ? Math.abs(update.delta) : 0;
      bucket.totals[reasonKey] = (bucket.totals[reasonKey] ?? 0) + delta;
      buckets.set(dayKey, bucket);
    }

    const orderedReasonKeys = SERIES_ORDER.filter((key) => presentReasons.has(key));

    const rows = Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, bucket]) => {
        const base: Record<string, number | string> = {
          dateKey: bucket.dateObj.toISOString(),
          dateLabel: formatDate(bucket.dateObj, userPreferences.dateFormat),
        };
        orderedReasonKeys.forEach((key) => {
          base[key] = bucket.totals[key] ?? 0;
        });
        return base;
      });

    return { rows, reasonKeys: orderedReasonKeys };
  }, [q.data, userPreferences.dateFormat]);

  const reasonColors = React.useMemo(() => {
    const palette = [
      muiTheme.palette.success.main,
      muiTheme.palette.info.main,
      muiTheme.palette.error.main,
      muiTheme.palette.warning.main,
      muiTheme.palette.primary.main,
      muiTheme.palette.grey[500],
    ];
    return reasonKeys.reduce((acc, key, idx) => {
      acc[key] = palette[idx % palette.length];
      return acc;
    }, {} as Record<ReasonLabelKey, string>);
  }, [reasonKeys, muiTheme]);

  const formatReasonLabel = React.useCallback(
    (key: ReasonLabelKey) => t(`analytics:updates.labels.${key}`, DEFAULT_REASON_LABEL[key]),
    [t]
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {t('analytics:updates.title', 'Recent stock updates')}
        </Typography>

        {q.isLoading ? (
          <Skeleton variant="rounded" height={260} />
        ) : rows.length === 0 ? (
          <Box sx={{ color: 'text.secondary' }}>{t('analytics:updates.empty', 'No updates in this period.')}</Box>
        ) : (
          <Box sx={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dateLabel" />
                <YAxis tickFormatter={(value) => formatNumber(Number(value), userPreferences.numberFormat, 0)} />
                <Tooltip
                  formatter={(value) => formatNumber(Number(value), userPreferences.numberFormat, 0)}
                  labelFormatter={(label) => label as string}
                />
                <Legend />
                {reasonKeys.map((key) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="activity"
                    name={formatReasonLabel(key)}
                    fill={reasonColors[key]}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
