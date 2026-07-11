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
 * - Composition only: data, granularity, and the client-side pivot live in
 *   useEmployeesSectionData; the chart card is EmployeesActivityChart; this
 *   file renders the change-log card and wires pagination.
 * - Pagination is server-side (Spring Page): only the visible slice is
 *   fetched; the page index resets when the window changes.
 */
import {
  Box, Card, CardContent, Skeleton, Typography,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, TablePagination,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEmployeesSectionData } from './useEmployeesSectionData';
import { EmployeesActivityChart } from './EmployeesActivityChart';
import { useSettings } from '../../../hooks/useSettings';
import { formatDate, formatNumber } from '../../../utils/formatters';
import { reasonLabel } from './reasonLabels';

export type EmployeesSectionProps = {
  from?: string;
  to?: string;
  supplierId?: string | null;
};

export default function EmployeesSection({ from, to, supplierId }: EmployeesSectionProps) {
  const { t } = useTranslation(['analytics']);
  const { userPreferences } = useSettings();

  // Queries, pagination state, and the chart pivot live in the data hook.
  const {
    granularity, setGranularity,
    page, setPage,
    rowsPerPage, setRowsPerPage,
    activityQ, changesQ,
    chartData, employees,
  } = useEmployeesSectionData({ from, to, supplierId });

  const changes = changesQ.data ?? { rows: [], total: 0 };

  return (
    <Box sx={{ gridColumn: '1 / -1', display: 'grid', gap: 2 }}>
      <EmployeesActivityChart
        granularity={granularity}
        onGranularityChange={setGranularity}
        chartData={chartData}
        employees={employees}
        loading={activityQ.isLoading}
      />

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
