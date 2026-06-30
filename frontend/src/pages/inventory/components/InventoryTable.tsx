/**
 * @file InventoryTable.tsx
 * @module pages/inventory/components/InventoryTable
 *
 * @summary
 * DataGrid wrapper for the inventory list with server-side pagination
 * and sorting, row selection by click, and stock-level row coloring.
 *
 * @enterprise
 * - Server-side pagination is reflected via paginationModel +
 *   rowCount. The 0-based-vs-1-based conversion is centralized in
 *   useDataFetchingLogic (CB-F site); this component sends MUI's
 *   native 0-based model up untouched.
 * - Row classification (row-critical / row-warning) is delegated to
 *   getRowClassName from useInventoryRowStyling. The CSS in this file
 *   only paints the classes; the threshold rule (deficit >= 5) lives
 *   upstream.
 * - Row background colors are hardcoded hex values (#fff3e0, #ffe0b2,
 *   #ffebee, #ffcdd2, #e3f2fd, #bbdefb) inside the sx prop, bypassing
 *   the MUI theme palette. These will not adapt to dark mode and
 *   diverge from the rest of the app's themed surfaces. Tracked under
 *   CB-APP63 -- same class as CB-APP3 (footer) and CB-APP7
 *   (HealthBadge); resolve together.
 * - Loading overlay uses a separate absolute-positioned Stack rather
 *   than relying on DataGrid's built-in loading prop alone. The double
 *   indicator is intentional: it keeps the page interactive shape
 *   stable during long fetches when DataGrid would otherwise show a
 *   minimal bar.
 */

import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { Box, CircularProgress, Stack } from '@mui/material';
import type { InventoryRow } from '../../../api/inventory/types';

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
          // BUCKET: CB-APP63 -- hardcoded hex colors bypass MUI theme. Switch to theme palette tokens; resolve with CB-APP3 and CB-APP7.
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
