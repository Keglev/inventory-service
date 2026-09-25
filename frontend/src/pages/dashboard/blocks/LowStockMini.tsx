/**
 * @file LowStockMini.tsx
 * @module pages/dashboard/blocks/LowStockMini
 *
 * @summary
 * Global low-stock watchlist for the dashboard: one bar per item below its
 * minimum, across all suppliers, most critical first. Data comes from the
 * dashboard summary endpoint (all-suppliers low-stock), not a supplier-scoped
 * query, so it works without a supplier selection.
 *
 * @enterprise
 * - A bar's length is the stock as a share of the item's own minimum, and its
 *   colour is the severity of frontend ADR-0012 (critical at half the minimum
 *   or less), so the chart speaks the same language as the inventory table.
 *   The "x / y" label beside each bar keeps the absolute numbers.
 * - Five rows by default, so each row keeps its height; "show more" expands
 *   the card in place to every low-stock item. There is no page that lists
 *   them all, so the list opens here rather than behind a link.
 * - Long names are cut to one line; the tooltip shows the full name and both
 *   quantities.
 * - Empty and loading states are handled locally; the fetcher never throws.
 *
 * @i18n common namespace: dashboard.lowStockChart.{title,empty,quantity,minimum,
 * ofMinimum,critical,low,showMore,showLess}.
 */
import * as React from 'react';
import { Card, CardContent, Typography, Skeleton, Box, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, Cell, LabelList } from 'recharts';
import { getDashboardLowStock } from '../../../api/analytics/dashboardSummary';
import type { LowStockRow } from '../../../api/analytics/types';
import { lowStockSeverity } from '../../../config/inventoryPolicy';
import { useSettings } from '../../../hooks/useSettings';
import { formatNumber } from '../../../utils/formatters';
import { chartTooltipProps } from '../../../utils/chartTooltip';

/** Rows shown before the card is expanded. */
const VISIBLE_ROWS = 5;
/** Height of one bar row in px; the chart grows with the rows it shows. */
const ROW_HEIGHT = 44;
/** Longest item name shown on the axis before it is cut with an ellipsis. */
const LABEL_CHARS = 24;

type ChartRow = LowStockRow & { share: number; label: string };

function shortName(name: string): string {
  return name.length > LABEL_CHARS ? `${name.slice(0, LABEL_CHARS - 1)}…` : name;
}

/** Tooltip body: the full item name and both quantities. */
function RowTooltip({ row, num }: { row?: ChartRow; num: (n: number) => string }) {
  const { t } = useTranslation('common');
  const muiTheme = useMuiTheme();
  if (!row) return null;
  return (
    <Box sx={{ ...chartTooltipProps(muiTheme).contentStyle, p: 1, maxWidth: 280 }}>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.itemName}</Typography>
      <Typography variant="caption" color="text.secondary" component="div">
        {t('dashboard.lowStockChart.quantity')}: {num(row.quantity)}
      </Typography>
      <Typography variant="caption" color="text.secondary" component="div">
        {t('dashboard.lowStockChart.minimum')}: {num(row.minimumQuantity)}
      </Typography>
    </Box>
  );
}

/** The two severity colours of frontend ADR-0012 and their meaning. */
function SeverityLegend() {
  const { t } = useTranslation('common');
  const swatch = (bgcolor: string) => (
    <Box component="span" sx={{ display: 'inline-block', width: 10, height: 10, mr: 0.75, bgcolor }} />
  );
  return (
    <Box sx={{ display: 'flex', gap: 2, typography: 'caption', color: 'text.secondary' }}>
      <span>{swatch('error.main')}{t('dashboard.lowStockChart.critical')}</span>
      <span>{swatch('warning.main')}{t('dashboard.lowStockChart.low')}</span>
    </Box>
  );
}

export default function LowStockMini() {
  const { t } = useTranslation('common');
  const muiTheme = useMuiTheme();
  const { userPreferences } = useSettings();
  const [expanded, setExpanded] = React.useState(false);

  const q = useQuery<LowStockRow[]>({
    queryKey: ['dashboard', 'lowStockMini'],
    queryFn: getDashboardLowStock,
    staleTime: 60_000,
  });

  const num = (n: number) => formatNumber(n, userPreferences.numberFormat, 0);
  const rows: ChartRow[] = (q.data ?? [])
    .map((r) => ({
      ...r,
      share: r.minimumQuantity > 0 ? r.quantity / r.minimumQuantity : 0,
      label: t('dashboard.lowStockChart.ofMinimum', { quantity: num(r.quantity), minimum: num(r.minimumQuantity) }),
    }))
    .sort((a, b) => a.share - b.share);
  const visible = expanded ? rows : rows.slice(0, VISIBLE_ROWS);
  const hidden = rows.length - VISIBLE_ROWS;

  const colorOf = (r: LowStockRow) =>
    lowStockSeverity(r.quantity, r.minimumQuantity) === 'critical'
      ? muiTheme.palette.error.main
      : muiTheme.palette.warning.main;

  return (
    <Card>
      <CardContent sx={{ py: 1.5, px: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 0.75 }}>
          {t('dashboard.lowStockChart.title')}
        </Typography>

        {q.isLoading ? (
          <Skeleton variant="rounded" height={220} />
        ) : rows.length === 0 ? (
          <Box sx={{ height: 240, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
            {t('dashboard.lowStockChart.empty')}
          </Box>
        ) : (
          <>
            <Box sx={{ height: visible.length * ROW_HEIGHT + 8 }} data-testid="low-stock-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visible} layout="vertical" margin={{ left: 8, right: 80 }}>
                  <XAxis type="number" domain={[0, 1]} hide />
                  <YAxis type="category" dataKey="itemName" width={170} tickFormatter={shortName} />
                  <Tooltip
                    cursor={{ fillOpacity: 0.08 }}
                    content={({ active, payload }) => (
                      <RowTooltip row={active ? (payload?.[0]?.payload as ChartRow | undefined) : undefined} num={num} />
                    )}
                  />
                  <Bar dataKey="share" barSize={20} radius={[0, 3, 3, 0]} isAnimationActive={false}>
                    {visible.map((r, i) => (
                      <Cell key={`${r.itemName}-${i}`} fill={colorOf(r)} />
                    ))}
                    <LabelList dataKey="label" position="right" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 1 }}>
              <SeverityLegend />
              {hidden > 0 && (
                <Button
                  size="small"
                  onClick={() => setExpanded((v) => !v)}
                  endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                  {expanded
                    ? t('dashboard.lowStockChart.showLess')
                    : t('dashboard.lowStockChart.showMore', { count: hidden })}
                </Button>
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
