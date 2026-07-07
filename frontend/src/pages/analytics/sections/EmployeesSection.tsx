/**
 * @file EmployeesSection.tsx
 * @module pages/analytics/sections/EmployeesSection
 *
 * @summary
 * "Employees" analytics section (ADMIN + demo mode only; the tab and the
 * route fallback are gated in Analytics/AnalyticsNav). Renders:
 * - a granularity toggle (daily | weekly | monthly) that refetches the
 *   aggregation with the selected bucket size,
 * - a line chart with one series per employee (legend shows display names),
 * - a server-paginated change log fed by /api/analytics/employee-changes.
 *
 * @enterprise
 * - The chart pivot happens client-side: the API returns flat
 *   (period, employee, count) rows; Recharts needs one object per period.
 * - Pagination is server-side (Spring Page): only the visible slice is
 *   fetched; the page index resets when the window changes.
 */
import * as React from 'react';
import {
  Box, Card, CardContent, Skeleton, Stack, ToggleButton, ToggleButtonGroup, Typography,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, TablePagination,
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import {
  getEmployeeActivity, getEmployeeChanges,
  type EmployeeActivityRow, type EmployeeChangesPage, type EmployeeGranularity,
} from '../../../api/analytics/employees';
import { useSettings } from '../../../hooks/useSettings';
import { formatDate, formatNumber } from '../../../utils/formatters';
import { reasonLabel } from './reasonLabels';

export type EmployeesSectionProps = {
  from?: string;
  to?: string;
  supplierId?: string | null;
};

type ChartRow = { period: string } & Record<string, number | string>;

export default function EmployeesSection({ from, to, supplierId }: EmployeesSectionProps) {
  const { t } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();
  const { userPreferences } = useSettings();

  const [granularity, setGranularity] = React.useState<EmployeeGranularity>('monthly');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);

  // A new window invalidates the current page position.
  React.useEffect(() => {
    setPage(0);
  }, [from, to, supplierId]);

  const activityQ = useQuery<EmployeeActivityRow[]>({
    queryKey: ['analytics', 'employeeActivity', granularity, from ?? null, to ?? null, supplierId ?? null],
    queryFn: () => getEmployeeActivity({ granularity, from, to, supplierId: supplierId ?? undefined }),
    staleTime: 60_000,
  });

  const changesQ = useQuery<EmployeeChangesPage>({
    queryKey: ['analytics', 'employeeChanges', from ?? null, to ?? null, supplierId ?? null, page, rowsPerPage],
    queryFn: () => getEmployeeChanges({ from, to, supplierId: supplierId ?? undefined, page, size: rowsPerPage }),
    staleTime: 60_000,
  });

  // Pivot flat (period, employee, count) rows into one object per period.
  const { chartData, employees } = React.useMemo(() => {
    const rows = activityQ.data ?? [];
    const names = new Map<string, string>();
    const byPeriod = new Map<string, ChartRow>();
    for (const r of rows) {
      names.set(r.createdBy, r.displayName);
      const bucket = byPeriod.get(r.period) ?? { period: r.period };
      bucket[r.createdBy] = r.changeCount;
      byPeriod.set(r.period, bucket);
    }
    return {
      chartData: [...byPeriod.values()].sort((a, b) => a.period.localeCompare(b.period)),
      employees: [...names.entries()].map(([createdBy, displayName]) => ({ createdBy, displayName })),
    };
  }, [activityQ.data]);

  const seriesColors = React.useMemo(() => {
    const palette = [
      muiTheme.palette.primary.main,
      muiTheme.palette.success.main,
      muiTheme.palette.warning.main,
      muiTheme.palette.error.main,
      muiTheme.palette.info.main,
      muiTheme.palette.secondary.main,
    ];
    return employees.map((_, idx) => palette[idx % palette.length]);
  }, [employees, muiTheme]);

  const formatCount = React.useCallback(
    (value: number | string) =>
      typeof value === 'number' ? formatNumber(value, userPreferences.numberFormat, 0) : String(value),
    [userPreferences.numberFormat]
  );

  const formatTooltipCount = React.useCallback(
    (value: number | string) =>
      typeof value === 'number'
        ? `${formatNumber(value, userPreferences.numberFormat, 0)} ${t('analytics:units.changes', 'changes')}`
        : String(value),
    [userPreferences.numberFormat, t]
  );

  const changes = changesQ.data ?? { rows: [], total: 0 };

  return (
    <Box sx={{ gridColumn: '1 / -1', display: 'grid', gap: 2 }}>
      <Card data-testid="employee-activity-card">
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle1">{t('analytics:employees.chartTitle')}</Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={granularity}
              onChange={(_e, next: EmployeeGranularity | null) => {
                if (next) setGranularity(next);
              }}
            >
              <ToggleButton value="daily">{t('analytics:employees.granularity.daily')}</ToggleButton>
              <ToggleButton value="weekly">{t('analytics:employees.granularity.weekly')}</ToggleButton>
              <ToggleButton value="monthly">{t('analytics:employees.granularity.monthly')}</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {activityQ.isLoading ? (
            <Skeleton variant="rounded" height={240} />
          ) : chartData.length === 0 ? (
            <Box sx={{ height: 240, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
              {t('analytics:employees.empty')}
            </Box>
          ) : (
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickFormatter={formatCount} />
                  <Tooltip formatter={formatTooltipCount} />
                  <Legend />
                  {/* Emails contain dots; Recharts resolves string dataKeys as
                      nested paths, so each series needs a function accessor. */}
                  {employees.map((emp, idx) => (
                    <Line
                      key={emp.createdBy}
                      type="monotone"
                      dataKey={(row: ChartRow) => (row[emp.createdBy] as number | undefined) ?? 0}
                      name={emp.displayName}
                      stroke={seriesColors[idx]}
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card data-testid="employee-changes-card">
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {t('analytics:employees.tableTitle')}
          </Typography>

          {changesQ.isLoading ? (
            <Skeleton variant="rounded" height={180} />
          ) : changes.rows.length === 0 ? (
            <Box sx={{ height: 120, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
              {t('analytics:employees.empty')}
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 420 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('analytics:employees.columns.datetime')}</TableCell>
                    <TableCell>{t('analytics:employees.columns.employee')}</TableCell>
                    <TableCell>{t('analytics:employees.columns.item')}</TableCell>
                    <TableCell>{t('analytics:employees.columns.supplier')}</TableCell>
                    <TableCell align="right">{t('analytics:employees.columns.change')}</TableCell>
                    <TableCell>{t('analytics:employees.columns.reason')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {changes.rows.map((row, idx) => (
                    <TableRow key={`${row.timestamp}-${row.itemName}-${idx}`} hover>
                      <TableCell>{formatDate(row.timestamp, userPreferences.dateFormat) || row.timestamp}</TableCell>
                      <TableCell>{row.createdBy}</TableCell>
                      <TableCell>{row.itemName}</TableCell>
                      <TableCell>{row.supplierName}</TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: row.change < 0 ? 'error.main' : 'success.main', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {(row.change > 0 ? '+' : '') + formatNumber(row.change, userPreferences.numberFormat, 0)}
                      </TableCell>
                      <TableCell>{row.reason ? reasonLabel(t, row.reason) : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            component="div"
            count={changes.total}
            page={page}
            onPageChange={(_e, next) => setPage(next)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage={t('analytics:employees.rowsPerPage')}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
