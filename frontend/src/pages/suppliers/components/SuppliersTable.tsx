/**
 * @file SuppliersTable.tsx
 * @module pages/suppliers/components/SuppliersTable
 *
 * @summary
 * Data grid component for suppliers board.
 * Displays suppliers list with pagination, sorting, and row selection.
 *
 * @enterprise
 * - MUI DataGrid with server-side pagination and sorting
 * - Row click selection handler
 * - Loading indicator
 * - Empty state handling
 * - i18n support for column headers
 * - Responsive and customizable
 */

import * as React from 'react';
import {
  Paper,
  Box,
  Typography,
  LinearProgress,
} from '@mui/material';
import {
  DataGrid,
  type GridPaginationModel,
  type GridSortModel,
  type GridColDef,
} from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../../hooks/useSettings';
import { formatDate } from '../../../utils/formatters';
import type { SupplierRow } from '../../../api/suppliers';

/**
 * Suppliers Table component props.
 *
 * @interface SuppliersTableProps
 */
export interface SuppliersTableProps {
  /** Suppliers data to display */
  rows: SupplierRow[];
  /** Total row count (for server-side pagination) */
  rowCount: number;
  /** Current pagination model */
  paginationModel: GridPaginationModel;
  /** Handler for pagination changes */
  onPaginationChange: (model: GridPaginationModel) => void;
  /** Current sort model */
  sortModel: GridSortModel;
  /** Handler for sort changes */
  onSortChange: (model: GridSortModel) => void;
  /** Whether data is loading */
  isLoading: boolean;
  /** Handler for row click (selection) */
  onRowClick: (params: { id: string | number }) => void;
}

/**
 * Suppliers table component.
 *
 * Features:
 * - Server-side pagination and sorting
 * - Row click selection
 * - Loading indicator
 * - Empty state message
 * - Formatted date columns
 * - Responsive table density
 *
 * @component
 * @example
 * ```tsx
 * <SuppliersTable
 *   rows={suppliers}
 *   rowCount={total}
 *   paginationModel={pagination}
 *   onPaginationChange={handlePagination}
 *   sortModel={sort}
 *   onSortChange={handleSort}
 *   isLoading={loading}
 *   onRowClick={handleRowClick}
 * />
 * ```
 */
export const SuppliersTable: React.FC<SuppliersTableProps> = ({
  rows,
  rowCount,
  paginationModel,
  onPaginationChange,
  sortModel,
  onSortChange,
  isLoading,
  onRowClick,
}) => {
  const { t } = useTranslation(['common', 'suppliers']);
  const { userPreferences } = useSettings();

  // Define grid columns (no memoization needed - same as InventoryTable)
  const columns: GridColDef<SupplierRow>[] = [
    {
      field: 'name',
      headerName: t('suppliers:table.name', 'Supplier Name'),
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'contactName',
      headerName: t('suppliers:table.contactName', 'Contact'),
      width: 150,
      valueGetter: (_value: unknown, row: SupplierRow) => row.contactName ?? '—',
    },
    {
      field: 'phone',
      headerName: t('suppliers:table.phone', 'Phone'),
      width: 140,
      valueGetter: (_value: unknown, row: SupplierRow) => row.phone ?? '—',
    },
    {
      field: 'email',
      headerName: t('suppliers:table.email', 'Email'),
      width: 180,
      valueGetter: (_value: unknown, row: SupplierRow) => row.email ?? '—',
    },
    {
      field: 'createdAt',
      headerName: t('suppliers:table.createdAt', 'Created'),
      width: 180,
      valueGetter: (_value: unknown, row: SupplierRow) => row.createdAt ?? null,
      valueFormatter: ({ value }: { value: unknown }) => {
        if (!value) return '—';
        try {
          return formatDate(new Date(String(value)), userPreferences.dateFormat);
        } catch {
          return String(value);
        }
      },
    },
  ];

  return (
    <Paper
      variant="outlined"
      sx={{
        flex: 1,
        position: 'relative',
        minHeight: 320,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {isLoading && (
        <LinearProgress sx={{ position: 'absolute', left: 0, right: 0, top: 0 }} />
      )}

      <DataGrid
        rows={rows}
        columns={columns}
        rowCount={rowCount}
        paginationMode="server"
        sortingMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationChange}
        pageSizeOptions={[6]}
        sortModel={sortModel}
        onSortModelChange={onSortChange}
        getRowId={(r) => r.id}
        density={
          userPreferences.tableDensity === 'compact' ? 'compact' : 'comfortable'
        }
        rowHeight={44}
        columnHeaderHeight={48}
        onRowClick={onRowClick}
        slots={{
          noRowsOverlay: () => (
            <Box
              sx={{
                p: 2,
                textAlign: 'center',
                display: 'grid',
                placeItems: 'center',
                height: '100%',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {t('suppliers:empty.default', 'No suppliers found')}
              </Typography>
            </Box>
          ),
        }}
        sx={{ '& .MuiDataGrid-cell': { overflow: 'visible' } }}
      />
    </Paper>
  );
};
