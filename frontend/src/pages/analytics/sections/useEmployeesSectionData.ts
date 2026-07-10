/**
 * @file useEmployeesSectionData.ts
 * @module pages/analytics/sections/useEmployeesSectionData
 * @summary Query and pivot logic behind the employee analytics section.
 * @enterprise
 * Extracted from EmployeesSection so data acquisition and shaping are
 * separate from rendering. Owns the granularity/pagination state, the two
 * analytics queries (activity series, paged change log), the pivot of flat
 * (period, employee, count) rows into one chart object per period, and the
 * page reset when the date/supplier window changes. Colors and i18n label
 * formatting stay in the component because they depend on the MUI theme and
 * translation context of the render tree.
 */
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getEmployeeActivity, getEmployeeChanges,
  type EmployeeActivityRow, type EmployeeChangesPage, type EmployeeGranularity,
} from '../../../api/analytics/employees';

export type EmployeesChartRow = { period: string } & Record<string, number | string>;

export type UseEmployeesSectionDataParams = {
  from?: string;
  to?: string;
  supplierId?: string | null;
};

export function useEmployeesSectionData({ from, to, supplierId }: UseEmployeesSectionDataParams) {
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
    const byPeriod = new Map<string, EmployeesChartRow>();
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

  return {
    granularity, setGranularity,
    page, setPage,
    rowsPerPage, setRowsPerPage,
    activityQ, changesQ,
    chartData, employees,
  };
}
