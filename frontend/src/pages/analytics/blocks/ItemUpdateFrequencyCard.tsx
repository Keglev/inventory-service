/**
 * @file ItemUpdateFrequencyCard.tsx
 * @module pages/analytics/blocks/ItemUpdateFrequencyCard
 *
 * @summary
 * Most-updated items for a supplier (top N). If no supplier is selected, shows an empty-state hint.
 *
 * @enterprise
 * - Hook order is stable: useQuery is declared unconditionally and gated via `enabled`.
 * - Bars are individually colored via <Cell>, cycling through MUI theme palette.
 * - Layout uses vertical bars; right margin avoids clipping on narrow screens.
 */
import { Card, CardContent, Typography, Skeleton, Box } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import { getItemUpdateFrequency, type ItemUpdateFrequencyPoint } from '../../../api/analytics/frequency';
import { useSettings } from '../../../hooks/useSettings';
import { formatNumber } from '../../../utils/formatters';

export type ItemUpdateFrequencyCardProps = { supplierId?: string | null };

export default function ItemUpdateFrequencyCard({ supplierId }: ItemUpdateFrequencyCardProps) {
  const { t } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();
  const { userPreferences } = useSettings();

  // Fetch (unconditional hook; gated by `enabled`)
  const enabled = !!supplierId;
  const q = useQuery<ItemUpdateFrequencyPoint[]>({
    queryKey: ['analytics', 'itemUpdateFrequency', supplierId ?? null],
    queryFn: () => getItemUpdateFrequency(supplierId ?? ''),
    enabled,
  });

  // Empty-state when supplier is not chosen
  if (!enabled) {
    return (
      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {t('analytics:frequency.title', 'Top updated items')}
          </Typography>
          <Box sx={{ color: 'text.secondary' }}>
            {t('analytics:frequency.selectSupplier', 'Select a supplier to view')}
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Stable data + color cycle
  const data: ItemUpdateFrequencyPoint[] = q.data ?? [];
  const barColors = [
    muiTheme.palette.primary.main,
    muiTheme.palette.success.main,
    muiTheme.palette.info.main,
    muiTheme.palette.warning.main,
    muiTheme.palette.error.main,
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {t('analytics:frequency.title', 'Top updated items')}
        </Typography>

        {q.isLoading ? (
          <Skeleton variant="rounded" height={220} />
        ) : (
          <Box sx={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 24, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => formatNumber(Number(value), userPreferences.numberFormat, 0)}
                />
                <YAxis type="category" dataKey="name" width={140} />
                <Tooltip
                  formatter={(value: number | string) =>
                    typeof value === 'number'
                      ? formatNumber(value, userPreferences.numberFormat, 0)
                      : value
                  }
                />
                <Bar dataKey="updates" isAnimationActive={false}>
                  {data.map((_, i) => (
                    <Cell key={`u-${i}`} fill={barColors[i % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
