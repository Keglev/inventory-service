/**
 * @file Suppliers.tsx
 * @module pages/suppliers/Suppliers
 *
 * @summary
 * Supplier Management Board - displays list of suppliers with CRUD operations.
 * Follows same patterns as Inventory.tsx for consistency.
 *
 * @enterprise
 * - Tolerant loading: UI stays responsive even on failures
 * - Server-driven pagination with search and sort
 * - Decoupled dialogs: grid reloads after each operation
 * - Strict typing: no `any`, MUI DataGrid-friendly
 * - i18n discipline: translations in 'common' and 'suppliers' namespaces
 *
 * @features_implemented
 * - List suppliers with name, contact name, phone, email, created timestamp
 * - Search by name or email (client-side filter + debounce)
 * - Pagination (server-driven)
 * - Sort by any column
 * - Create new supplier button
 * - Edit/Delete buttons (dialogs coming later)
 * - Empty state when no suppliers selected
 * - Loading indicators and error handling
 */

import * as React from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Stack,
  Button,
} from '@mui/material';
import {
  DataGrid,
  type GridPaginationModel,
  type GridSortModel,
  type GridColDef,
} from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';

import { getSuppliersPage } from '../../api/suppliers';
import type { SupplierListResponse, SupplierRow } from '../../api/suppliers';

const DEFAULT_PAGE_SIZE = 10;

const Suppliers: React.FC = () => {
  const { t } = useTranslation(['common', 'suppliers']);

  // ===== State =====
  const [q, setQ] = React.useState('');
  const debouncedQ = useDebounced(q, 350);

  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    { field: 'name', sort: 'asc' },
  ]);

  const [server, setServer] = React.useState<SupplierListResponse>({
    items: [],
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const [loading, setLoading] = React.useState(false);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // ===== Computed state =====
  const serverPage = paginationModel.page + 1; // Convert 0-based to 1-based
  const serverSort = sortModel.length
    ? `${sortModel[0].field},${sortModel[0].sort ?? 'asc'}`
    : 'name,asc';

  // ===== Data loading =====
  /**
   * Fetch suppliers from backend with filters and pagination.
   * Tolerant: returns empty page on error.
   */
  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await getSuppliersPage({
      page: serverPage,
      pageSize: paginationModel.pageSize,
      q: debouncedQ.trim() || undefined,
      sort: serverSort,
    });
    setServer(res);
    setLoading(false);
  }, [serverPage, paginationModel.pageSize, debouncedQ, serverSort]);

  /**
   * Re-fetch when filters, pagination, or sort changes.
   */
  React.useEffect(() => {
    void load();
  }, [load]);

  // ===== Columns =====
  const columns = React.useMemo<GridColDef<SupplierRow>[]>(() => {
    return [
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
        width: 160,
        valueGetter: (_value: unknown, row: SupplierRow) => row.createdAt ?? '—',
      },
    ];
  }, [t]);

  // ===== Row click handler =====
  const handleRowClick = (params: { id: string | number }) => {
    setSelectedId(String(params.id));
  };

  // ===== Render =====
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: { xs: 1, md: 2 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">
          {t('suppliers:title', 'Supplier Management')}
        </Typography>
      </Box>

      {/* Controls Panel */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          {/* Search Input */}
          <input
            type="text"
            placeholder={t('suppliers:search.placeholder', 'Search by name or email...')}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPaginationModel((m) => ({ ...m, page: 0 }));
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'inherit',
            }}
          />

          {/* Create Button */}
          <Button variant="contained" color="primary">
            {t('suppliers:actions.create', 'Create Supplier')}
          </Button>
        </Stack>

        {/* Info Text */}
        <Typography variant="caption" color="text.secondary">
          {t('suppliers:info', 'Double-click to edit, use action buttons to delete')}
        </Typography>
      </Paper>

      {/* Data Grid */}
      <Paper variant="outlined" sx={{ height: 560, position: 'relative' }}>
        {loading && (
          <LinearProgress sx={{ position: 'absolute', left: 0, right: 0, top: 0 }} />
        )}

        <DataGrid
          rows={server.items}
          columns={columns}
          rowCount={server.total}
          paginationMode="server"
          sortingMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          getRowId={(r) => r.id}
          onRowClick={handleRowClick}
          slots={{
            noRowsOverlay: () => (
              <Box sx={{ p: 2, textAlign: 'center', display: 'grid', placeItems: 'center', height: '100%' }}>
                <Typography variant="body2" color="text.secondary">
                  {debouncedQ
                    ? t('suppliers:empty.search', 'No suppliers match your search')
                    : t('suppliers:empty.default', 'No suppliers found')}
                </Typography>
              </Box>
            ),
          }}
          sx={{ '& .MuiDataGrid-cell': { overflow: 'visible' } }}
        />
      </Paper>

      {/* Selected Info (temporary - will be replaced by dialogs) */}
      {selectedId && (
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
          <Typography variant="body2" color="text.secondary">
            {t('suppliers:status.selected', 'Selected supplier ID')}: <strong>{selectedId}</strong>
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button variant="outlined" size="small">
              {t('suppliers:actions.edit', 'Edit')}
            </Button>
            <Button variant="outlined" size="small" color="error">
              {t('suppliers:actions.delete', 'Delete')}
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

/** Debounce utility. */
function useDebounced<T>(value: T, delayMs: number): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const h = setTimeout(() => setV(value), delayMs);
    return () => clearTimeout(h);
  }, [value, delayMs]);
  return v;
}

export default Suppliers;
