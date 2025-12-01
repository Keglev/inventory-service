/**
 * @file PurchaseOrders.tsx
 * @module pages/orders/PurchaseOrders
 *
 * @summary
 * Purchase Orders (Bestellungen) management page.
 * Shows supplier-specific purchase history and returns with analytics.
 *
 * @enterprise
 * - Accessible to Admin, Users, and Demo mode (read-only)
 * - Two-panel layout: left (item list), right (line graph)
 * - Supplier selector + date range filter (30, 90, 180 days)
 * - Tabs for "Initial Supply" and "Returned Items"
 * - Line chart showing purchases vs. returns over time
 *
 * @features
 * - Server-driven data fetch with React Query
 * - URL state synchronization (supplier, date range)
 * - Tolerant error handling (shows fallback on API failure)
 * - Responsive design (stacks on mobile)
 */

import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Autocomplete,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { getSuppliersLite, type SupplierRef } from '../../api/analytics/suppliers';
import { getPurchaseOrderAnalytics, type StockMovement } from '../../api/orders';
import type { InventoryRow } from '../../api/inventory/types';
import HelpIconButton from '../../features/help/components/HelpIconButton';
import { todayIso, daysAgoIso } from '../../pages/analytics/utils/date';

// Local date helpers
const dateWindowOptions = [
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '180', label: '180 days' },
];

/**
 * Transform stock movements into chart data
 * Groups by date and counts received vs. returned
 */
function transformMovementsToChartData(
  movements: StockMovement[]
): Array<{ date: string; received: number; returned: number }> {
  const grouped = new Map<string, { received: number; returned: number }>();

  movements.forEach((m) => {
    const key = m.date;
    if (!grouped.has(key)) {
      grouped.set(key, { received: 0, returned: 0 });
    }
    const item = grouped.get(key)!;
    if (m.reason === 'RECEIVED') {
      item.received += m.quantity;
    } else if (m.reason === 'RETURNED') {
      item.returned += m.quantity;
    }
  });

  // Sort by date and convert to array
  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date,
      ...counts,
    }));
}

const PurchaseOrders: React.FC = () => {
  const { t } = useTranslation(['common', 'analytics', 'inventory']);

  // URL state
  const [searchParams, setSearchParams] = useSearchParams();
  const supplierId = searchParams.get('supplierId') || '';
  const dateWindowStr = searchParams.get('window') || '90';

  // Local state
  const [tabIndex, setTabIndex] = React.useState(0); // 0=initial, 1=returned
  const [dateWindow, setDateWindow] = React.useState(dateWindowStr);

  // Computed dates
  const toDate = todayIso();
  const fromDate = daysAgoIso(parseInt(dateWindow) || 90);

  // Sync URL when filters change
  React.useEffect(() => {
    const next: Record<string, string> = {};
    if (supplierId) next.supplierId = supplierId;
    if (dateWindow) next.window = dateWindow;
    setSearchParams(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId, dateWindow]);

  // Suppliers list
  const suppliersQ = useQuery<SupplierRef[]>({
    queryKey: ['orders', 'suppliers'],
    queryFn: getSuppliersLite,
    retry: 0,
    staleTime: 5 * 60_000,
  });

  // Purchase order analytics for selected supplier
  const analyticsQ = useQuery({
    queryKey: ['orders', 'analytics', supplierId, fromDate, toDate],
    queryFn: () =>
      supplierId
        ? getPurchaseOrderAnalytics(supplierId, fromDate, toDate)
        : Promise.resolve(null),
    enabled: !!supplierId,
    retry: 0,
    staleTime: 5 * 60_000,
  });

  const suppliers = suppliersQ.data || [];
  const selectedSupplier = suppliers.find((s) => s.id === supplierId);
  const analytics = analyticsQ.data;
  const chartData = analytics ? transformMovementsToChartData(analytics.movements) : [];

  // Display lists based on tab
  const itemsToShow =
    tabIndex === 0 ? analytics?.initialSupplyItems || [] : analytics?.returnedItems || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.paper' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {t('orders:title', 'Purchase Orders')}
            </Typography>
            <HelpIconButton topicId="orders.overview" tooltip={t('actions.help', 'Help')} />
          </Stack>
        </Stack>

        {/* Filters */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-end">
            {/* Supplier selector */}
            <Autocomplete
              options={suppliers}
              getOptionLabel={(s) => s.name}
              value={selectedSupplier || null}
              onChange={(_, value) => {
                const newId = value?.id || '';
                setSearchParams(newId ? { supplierId: newId, window: dateWindow } : {});
              }}
              loading={suppliersQ.isLoading}
              sx={{ flex: 1, minWidth: 200 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('analytics:filters.supplier', 'Supplier')}
                  placeholder={t('analytics:filters.selectSupplier', 'Select supplier...')}
                />
              )}
            />

            {/* Date window filter */}
            <ToggleButtonGroup
              value={dateWindow}
              exclusive
              onChange={(_, value) => {
                if (value) setDateWindow(value);
              }}
              size="small"
            >
              {dateWindowOptions.map((opt) => (
                <ToggleButton key={opt.value} value={opt.value}>
                  {opt.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
        </Paper>

        {/* Gate: require supplier selection */}
        {!supplierId ? (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {t('analytics:filters.selectSupplierPrompt', 'Select a supplier to view purchase orders.')}
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Two-panel layout */}
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              spacing={2}
              sx={{ mt: 2 }}
            >
              {/* Left panel: Item list */}
              <Paper
                variant="outlined"
                sx={{
                  flex: { lg: '0 0 35%' },
                  p: 2,
                  maxHeight: { md: 500 },
                  overflowY: 'auto',
                }}
              >
                {/* Tabs */}
                <Tabs
                  value={tabIndex}
                  onChange={(_, newVal) => setTabIndex(newVal)}
                  sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                >
                  <Tab
                    label={t('orders:tabs.initialSupply', 'Initial Supply')}
                    value={0}
                  />
                  <Tab
                    label={t('orders:tabs.returned', 'Returned Items')}
                    value={1}
                  />
                </Tabs>

                {/* Item list */}
                {analyticsQ.isLoading ? (
                  <Box sx={{ display: 'grid', placeItems: 'center', py: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : itemsToShow.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {tabIndex === 0
                      ? t('orders:empty.initialSupply', 'No initial supply items.')
                      : t('orders:empty.returned', 'No returned items.')}
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {itemsToShow.map((item: InventoryRow) => (
                      <Paper
                        key={item.id}
                        variant="outlined"
                        sx={{ p: 1.5, bgcolor: 'action.hover' }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Code: {item.code || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          On-hand: {item.onHand ?? 0}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Paper>

              {/* Right panel: Line chart */}
              <Paper
                variant="outlined"
                sx={{
                  flex: { lg: '1' },
                  p: 2,
                  minHeight: { md: 300 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {analyticsQ.isLoading ? (
                  <CircularProgress />
                ) : chartData.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center">
                    {t('orders:empty.movements', 'No stock movements in this period.')}
                  </Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis label={{ value: 'Quantity', angle: -90, position: 'insideLeft' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #ccc',
                          borderRadius: 4,
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="received"
                        stroke="#4caf50"
                        name={t('orders:chart.received', 'Received')}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="returned"
                        stroke="#f44336"
                        name={t('orders:chart.returned', 'Returned')}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Stack>

            {/* Error handling */}
            {analyticsQ.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {t('common:errors.loadFailed', 'Failed to load data. Please try again.')}
              </Alert>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default PurchaseOrders;
