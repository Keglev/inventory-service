/**
 * @file SuppliersTable.tsx
 * @module pages/suppliers/components/SuppliersTable
 *
 * @summary
 * Data grid component for suppliers board.
 * Displays suppliers list with pagination, sorting, and row selection.
 *
 * @enterprise
 * - MUI DataGrid with server-side pagination and sorting; the component is a
 *   shell that owns layout, the loading indicator and the empty-state overlay.
 * - Column definitions and cell-value logic live in useSupplierColumns, not here.
 *   The DataGrid test double never invokes a column callback, so a valueGetter
 *   written inline in this file is unreachable to the test suite; in the hook it
 *   is an ordinary function that can be called directly. This mirrors the
 *   inventory grid.
 * - Row density follows the user's table-density preference.
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
} from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../../hooks/useSettings';
import { useSupplierColumns } from '../hooks/useSupplierColumns';
import type { SupplierRow } from '../../../api/suppliers/types';

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

  const columns = useSupplierColumns();

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
                {t('suppliers:empty.default')}
              </Typography>
            </Box>
          ),
        }}
        sx={{ '& .MuiDataGrid-cell': { overflow: 'visible' } }}
      />
    </Paper>
  );
};
