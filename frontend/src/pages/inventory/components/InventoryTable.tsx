/**
 * @file InventoryTable.tsx
 * @module pages/inventory/components/InventoryTable
 *
 * @summary
 * DataGrid table component for displaying inventory items.
 * Handles: pagination, sorting, row selection, and visual styling.
 *
 * @enterprise
 * - Pure presentation component with minimal state
 * - Server-side pagination and sorting support
 * - Row styling based on stock levels (critical/warning/normal)
 */

import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { Box, CircularProgress, Stack } from '@mui/material';
import type { InventoryRow } from '../../../api/inventory/types';

/**
 * Props for InventoryTable component.
 * 
 * @interface InventoryTableProps
 * @property {InventoryItem[]} rows - Inventory items to display
 * @property {GridColDef[]} columns - Column definitions for DataGrid
 * @property {GridPaginationModel} paginationModel - Current pagination state (page, pageSize)
 * @property {(model: GridPaginationModel) => void} onPaginationChange - Callback for pagination changes
 * @property {GridSortModel} sortModel - Current sort state
 * @property {(model: GridSortModel) => void} onSortChange - Callback for sort changes
 * @property {string | null} selectedId - ID of currently selected row
 * @property {(id: string) => void} onRowClick - Callback when row is clicked
 * @property {(id: string) => string} getRowClassName - Function to determine CSS class for row styling
 * @property {boolean} loading - Whether data is currently loading
 * @property {number} rowCount - Total number of rows (for server-side pagination)
 */
interface InventoryTableProps {
  rows: InventoryRow[];
  columns: GridColDef[];
  paginationModel: GridPaginationModel;
  onPaginationChange: (model: GridPaginationModel) => void;
  sortModel: GridSortModel;
  onSortChange: (model: GridSortModel) => void;
  selectedId: string | null;
  onRowClick: (id: string) => void;
  getRowClassName: (onHand: number, minQty: number) => string;
  loading: boolean;
  rowCount: number;
}

/**
 * Inventory items DataGrid table.
 * 
 * Features:
 * - Server-side pagination and sorting
 * - Row selection by click
 * - Row styling based on stock levels
 * - Loading state indicator
 * - Responsive column sizing
 * 
 * @component
 * @param props - Component props
 * @returns JSX element with DataGrid
 * 
 * @example
 * ```tsx
 * <InventoryTable
 *   rows={items}
 *   columns={columnDefs}
 *   paginationModel={pagination}
 *   onPaginationChange={setPagination}
 *   sortModel={sorting}
 *   onSortChange=setSorting}
 *   selectedId={selected}
 *   onRowClick={setSelected}
 *   getRowClassName={getRowClass}
 *   loading={isLoading}
 *   rowCount={totalRows}
 * />
 * ```
 */
export const InventoryTable: React.FC<InventoryTableProps> = ({
  rows,
  columns,
  paginationModel,
  onPaginationChange,
  sortModel,
  onSortChange,
  onRowClick,
  getRowClassName,
  loading,
  rowCount,
}) => {
  return (
    <Box sx={{ width: '100%', height: 600, position: 'relative' }}>
      {/* Loading Overlay */}
      {loading && (
        <Stack
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Stack>
      )}
      {/* DataGrid Table */}
      <DataGrid
        rows={rows}
        columns={columns}
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationChange}
        sortModel={sortModel}
        onSortModelChange={onSortChange}
        rowCount={rowCount}
        pageSizeOptions={[10, 25, 50]}
        loading={loading}
        getRowClassName={(params) => {
          const row = params.row as InventoryRow;
          const onHand = Number(row.onHand ?? 0);
          const minQty = Number(row.minQty ?? 0);
          return getRowClassName(onHand, minQty);
        }}
        onRowClick={(params) => onRowClick(params.row.id)}
        sx={{
          '& .row-selected': {
            backgroundColor: '#e3f2fd !important',
            '&:hover': {
              backgroundColor: '#bbdefb !important',
            },
          },
          '& .row-warning': {
            backgroundColor: '#fff3e0 !important',
            '&:hover': {
              backgroundColor: '#ffe0b2 !important',
            },
          },
          '& .row-critical': {
            backgroundColor: '#ffebee !important',
            '&:hover': {
              backgroundColor: '#ffcdd2 !important',
            },
          },
        }}
      />
    </Box>
  );
};
