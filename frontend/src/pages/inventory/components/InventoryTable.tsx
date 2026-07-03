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
 * - Row backgrounds are translucent overlays derived from semantic
 *   palette tokens (info/warning/error via alpha), so both light and
 *   dark mode adapt automatically.
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
import { alpha } from '@mui/material/styles';
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
    <Box sx={{ width: '100%', position: 'relative' }}>
      {/* No fixed height (CB-APP78): x-data-grid v8 sizes to its rows when the
          parent is unconstrained, removing the dead space below short pages. */}
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
            backgroundColor: (theme) => `${alpha(theme.palette.info.main, 0.24)} !important`,
            boxShadow: (theme) => `inset 4px 0 0 ${theme.palette.info.main}`,
            '&:hover': {
              backgroundColor: (theme) => `${alpha(theme.palette.info.main, 0.36)} !important`,
            },
          },
          '& .row-warning': {
            backgroundColor: (theme) => `${alpha(theme.palette.warning.main, 0.24)} !important`,
            boxShadow: (theme) => `inset 4px 0 0 ${theme.palette.warning.main}`,
            '&:hover': {
              backgroundColor: (theme) => `${alpha(theme.palette.warning.main, 0.36)} !important`,
            },
          },
          '& .row-critical': {
            backgroundColor: (theme) => `${alpha(theme.palette.error.main, 0.24)} !important`,
            boxShadow: (theme) => `inset 4px 0 0 ${theme.palette.error.main}`,
            '&:hover': {
              backgroundColor: (theme) => `${alpha(theme.palette.error.main, 0.36)} !important`,
            },
          },
        }}
      />
    </Box>
  );
};
