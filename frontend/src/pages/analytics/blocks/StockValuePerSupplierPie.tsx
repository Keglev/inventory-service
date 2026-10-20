/**
 * @file StockValuePerSupplierPie.tsx
 * @module pages/analytics/blocks/StockValuePerSupplierPie
 *
 * @summary
 * Pie of the stock value held per supplier: the top four by name and one grey
 * slice for all others. Shown on the dashboard and the analytics page.
 *
 * @enterprise
 * - Value in euros, not pieces: pieces are not comparable across items, the
 *   capital held per supplier is. Values come from
 *   /api/analytics/stock-per-supplier (quantity times current unit price).
 * - At most five slices and five legend lines, so the card keeps its height
 *   however many suppliers exist; the grouping rule is supplierValueSlices.
 * - The tooltip carries the value and the share, so the legend stays names only.
 *   It is pinned beside the pie, never over it: at the foot of the legend column on wide
 *   charts, in a band above the pie on narrow ones.
 */

import * as React from 'react';
import { Card, CardContent, Typography, Skeleton, Box } from '@mui/material';
import type { TooltipContentProps, TooltipValueType } from 'recharts';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend } from 'recharts';
import { getStockPerSupplier } from '../../../api/analytics/stock';
import type { StockPerSupplierPoint } from '../../../api/analytics/types';
import { useSettings } from '../../../hooks/useSettings';
import { formatNumber } from '../../../utils/formatters';
import { chartTooltipProps } from '../../../utils/chartTooltip';
import { chartLegendProps } from '../../../utils/chartLegend';
import { supplierValueSlices } from './supplierValueSlices';
import DateScopeNote from '../components/DateScopeNote';

export type StockValuePerSupplierPieProps = {
  /** Pie area height in px; the dashboard passes a smaller one so it fits one screen. */
  chartHeight?: number;
  /** Show the "current stock" note; Analytik sets it because the pie sits under its date filter. */
  dateScopeNote?: boolean;
};

/** Chart width from which the legend becomes a column beside the pie. */
const WIDE_CHART_PX = 560;
/** The readout (two lines, 54px) sits at the foot of the legend column, 5px off the chart edge. */
const READOUT_FOOT_PX = 59;
/** Height of the band above the pie that holds the pinned readout on narrow charts. */
const READOUT_BAND_PX = 52;
/** Extra height on narrow charts: the band and a five-line legend sit above and below the pie. */
const NARROW_EXTRA_PX = 100;

export default function StockValuePerSupplierPie({ chartHeight = 260, dateScopeNote = false }: StockValuePerSupplierPieProps = {}) {
  const { t } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();
  const { userPreferences } = useSettings();

  const q = useQuery<StockPerSupplierPoint[]>({
    queryKey: ['analytics', 'stockValuePerSupplier'],
    queryFn: getStockPerSupplier,
    staleTime: 60_000,
  });

  // Named slices take fixed colours in rank order; the grouped slice is always
  // grey. The colour travels with each slice as `fill`, which Recharts reads for
  // the sector, its legend swatch and the tooltip (Cell is deprecated in v3).
  const data = React.useMemo(() => {
    const colors = [
      muiTheme.palette.primary.main,
      muiTheme.palette.success.main,
      muiTheme.palette.info.main,
      muiTheme.palette.warning.main,
    ];
    return supplierValueSlices(q.data ?? []).map((s, i) => ({
      name: s.kind === 'others' ? t('analytics:stockPerSupplier.others', { count: s.others }) : s.name,
      value: s.value,
      others: s.kind === 'others',
      fill: s.kind === 'others' ? muiTheme.palette.grey[500] : colors[i],
    }));
  }, [q.data, t, muiTheme]);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // The tooltip followed the cursor and covered a third of the pie (62% on a
  // phone). It is pinned where the pie never is: at the foot of the legend
  // column on wide charts, in a band above the pie on narrow ones (fork 4 C,
  // 2026-10-15). Recharts 3.10.1 never reports the legend box (onBBoxUpdate is
  // typed but not called), so the readout is anchored to the chart foot.
  const [chartWidth, setChartWidth] = React.useState(0);
  // Measured in the commit phase, before paint, so the layout does not jump once
  // ResponsiveContainer reports its size.
  const measureBox = (el: HTMLDivElement | null) => {
    if (el && el.clientWidth !== chartWidth) setChartWidth(el.clientWidth);
  };
  const wide = chartWidth >= WIDE_CHART_PX;
  // A tap never selected the tapped slice: the compat mouse events re-render the
  // sector under the finger and the focus layer activates the first slice
  // instead. Touch screens open the readout on tap.
  const noHover = useMediaQuery('(hover: none)');
  const legendColumnPx = Math.round(chartWidth * 0.42);
  const readoutStyle = { ...chartTooltipProps(muiTheme).contentStyle, padding: '6px 10px', maxWidth: wide ? legendColumnPx : chartWidth };
  const renderReadout = ({ active, payload }: TooltipContentProps<TooltipValueType, string | number>) => {
    const item = active ? payload?.[0] : undefined;
    if (!item || typeof item.value !== 'number') return null;
    return (
      <div style={readoutStyle}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{item.name}</Typography>
        <Typography variant="body2">
          {formatNumber(item.value, userPreferences.numberFormat, 2)} € · {formatNumber((100 * item.value) / total, userPreferences.numberFormat, 1)} %
        </Typography>
      </div>
    );
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {t('analytics:stockPerSupplier.title')}
        </Typography>
        {dateScopeNote && <DateScopeNote kind="current" />}

        {q.isLoading ? (
          <Skeleton variant="rounded" height={220} />
        ) : data.length === 0 ? (
          <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
            {t('analytics:stockPerSupplier.empty')}
          </Box>
        ) : (
          <Box
            ref={measureBox}
            // A tapped sector takes focus (tabindex -1, not keyboard-reachable);
            // the browser outline framed it once the readout stopped covering it.
            sx={{ height: chartHeight + (wide ? 0 : NARROW_EXTRA_PX), '& .recharts-sector:focus': { outline: 'none' } }}
          >
            <ResponsiveContainer width="100%" height="100%" onResize={(width) => setChartWidth(width)}>
              <PieChart margin={wide ? undefined : { top: READOUT_BAND_PX }}>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  outerRadius="90%"
                  isAnimationActive={false}
                />
                <Tooltip
                  {...chartTooltipProps(muiTheme)}
                  content={renderReadout}
                  trigger={noHover ? 'click' : 'hover'}
                  position={wide ? { x: 0, y: chartHeight - READOUT_FOOT_PX } : { x: 0, y: 0 }}
                  isAnimationActive={false}
                />
                {/* Recharts sorts legend items alphabetically by default; keep the
                    slices' rank order so "all others" stays last. */}
                <Legend
                  {...chartLegendProps(muiTheme)}
                  itemSorter={(item) => data.findIndex((d) => d.name === item.value)}
                  {...(wide ? { layout: 'vertical', align: 'left', verticalAlign: 'top', width: legendColumnPx } : {})}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
