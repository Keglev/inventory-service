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
 *   useEmployeesSectionData; the chart card is EmployeesActivityChart; the
 *   change log is a StockChangeTable with this section's columns.
 * - Pagination is server-side (Spring Page): only the visible slice is
 *   fetched; the page index resets when the window changes.
 */
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEmployeesSectionData } from './useEmployeesSectionData';
import { EmployeesActivityChart } from './EmployeesActivityChart';
import { useSettings } from '../../../hooks/useSettings';
import type { EmployeeChangeRow } from '../../../api/analytics/employees';
import StockChangeTable from './StockChangeTable';
import { changeColumn, dateColumn, reasonColumn, type StockChangeColumn } from './stockChangeColumns';

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
  const columns: StockChangeColumn<EmployeeChangeRow>[] = [
    dateColumn(t('analytics:employees.columns.datetime'), (row) => row.timestamp, userPreferences.dateFormat),
    { header: t('analytics:employees.columns.employee'), render: (row) => row.createdBy },
    { header: t('analytics:employees.columns.item'), render: (row) => row.itemName },
    { header: t('analytics:employees.columns.supplier'), render: (row) => row.supplierName },
    changeColumn(t('analytics:employees.columns.change'), (row) => row.change, userPreferences.numberFormat),
    reasonColumn(t('analytics:employees.columns.reason'), (row) => row.reason, t),
  ];

  return (
    <Box sx={{ gridColumn: '1 / -1', display: 'grid', gap: 2 }}>
      <EmployeesActivityChart
        granularity={granularity}
        onGranularityChange={setGranularity}
        chartData={chartData}
        employees={employees}
        loading={activityQ.isLoading}
        from={from}
        to={to}
      />

      <StockChangeTable
        title={t('analytics:employees.tableTitle')}
        testId="employee-changes-card"
        loading={changesQ.isLoading}
        emptyText={t('analytics:employees.empty')}
        rows={changes.rows}
        rowKey={(row, idx) => `${row.timestamp}-${row.itemName}-${idx}`}
        columns={columns}
        total={changes.total}
        page={page}
        onPageChange={setPage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(size) => {
          setRowsPerPage(size);
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50]}
        labelRowsPerPage={t('analytics:employees.rowsPerPage')}
        paginationWhenEmpty
      />
    </Box>
  );
}
