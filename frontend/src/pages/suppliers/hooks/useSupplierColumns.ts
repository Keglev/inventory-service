/**
 * @file useSupplierColumns.ts
 * @module pages/suppliers/hooks/useSupplierColumns
 *
 * @summary
 * Memoized MUI DataGrid column definitions for the suppliers table, with
 * locale-aware date formatting.
 *
 * @enterprise
 * - Mirrors useInventoryColumns: column layout and cell-value logic live in a
 *   hook rather than inside the grid component. The grid component is a shell
 *   that cannot be unit-tested through the DataGrid test double, because the
 *   double never invokes a column's valueGetter or valueFormatter — so any logic
 *   left inside it is unreachable to both the test suite and the coverage
 *   instrument. Here the callbacks are plain functions on a returned object and
 *   are called directly.
 * - Memoized on t() and the date-format preference so a language or format change
 *   rebuilds the columns, while field identifiers stay constant across renders and
 *   DataGrid's internal column-key cache stays stable.
 * - Nullable contact columns render a placeholder glyph rather than an empty cell,
 *   so a row of partially filled supplier data keeps its visual rhythm.
 * - Date cells go through the shared formatDateCell, which is also what the
 *   inventory grid uses: an unreadable timestamp must not read one way in one
 *   grid and another way in the next.
 */

import * as React from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../../hooks/useSettings';
import { formatDateCell } from '../../../utils/formatters';
import type { SupplierRow } from '../../../api/suppliers/types';

/** Placeholder shown for a supplier field the backend left empty. */
const EM_DASH = '—';

/**
 * Builds the suppliers DataGrid column definitions.
 *
 * @returns column definitions with their value getters and formatters
 */
export const useSupplierColumns = (): GridColDef<SupplierRow>[] => {
  const { t } = useTranslation(['common', 'suppliers']);
  const { userPreferences } = useSettings();

  return React.useMemo<GridColDef<SupplierRow>[]>(
    () => [
      {
        field: 'name',
        headerName: t('suppliers:table.name'),
        flex: 1,
        minWidth: 200,
      },
      {
        field: 'contactName',
        headerName: t('suppliers:table.contactName'),
        width: 150,
        valueGetter: (_value: unknown, row: SupplierRow | null) => row?.contactName ?? EM_DASH,
      },
      {
        field: 'phone',
        headerName: t('suppliers:table.phone'),
        width: 140,
        valueGetter: (_value: unknown, row: SupplierRow | null) => row?.phone ?? EM_DASH,
      },
      {
        field: 'email',
        headerName: t('suppliers:table.email'),
        width: 180,
        valueGetter: (_value: unknown, row: SupplierRow | null) => row?.email ?? EM_DASH,
      },
      {
        field: 'createdAt',
        headerName: t('suppliers:table.createdAt'),
        width: 180,
        valueGetter: (_value: unknown, row: SupplierRow | null) => row?.createdAt ?? null,
        valueFormatter: (value: unknown) => formatDateCell(value, userPreferences.dateFormat),
      },
    ],
    [t, userPreferences.dateFormat]
  );
};
