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
  FormControlLabel,
  Checkbox,
  TextField,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
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
import http from '../../api/httpClient';
import { CreateSupplierDialog } from './CreateSupplierDialog';
import { EditSupplierDialog } from './EditSupplierDialog';
import { DeleteSupplierDialog } from './DeleteSupplierDialog';
import { useToast } from '../../app/ToastContext';

const DEFAULT_PAGE_SIZE = 10;

const Suppliers: React.FC = () => {
  const { t } = useTranslation(['common', 'suppliers']);
  const toast = useToast();

  // ===== State =====
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SupplierRow[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [selectedSupplier, setSelectedSupplier] = React.useState<SupplierRow | null>(null);
  const [showAllSuppliers, setShowAllSuppliers] = React.useState(false);

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

  // ===== Dialog State =====
  const [openCreateDialog, setOpenCreateDialog] = React.useState(false);
  const [openEditDialog, setOpenEditDialog] = React.useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);

  // ===== Supplier search handler (requires 2+ chars) =====
  const handleSearchQueryChange = React.useCallback(async (query: string) => {
    setSearchQuery(query);
    
    // Reset if empty or less than 2 characters
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await http.get('/api/suppliers/search', {
        params: { name: query.trim() },
      });

      const data = res?.data;
      if (Array.isArray(data)) {
        setSearchResults(data as SupplierRow[]);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

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
      sort: serverSort,
    });
    setServer(res);
    setLoading(false);
  }, [serverPage, paginationModel.pageSize, serverSort]);

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

  // ===== Dialog Handlers =====
  const handleSupplierCreated = () => {
    toast(t('suppliers:status.created', 'Supplier created successfully'), 'success');
    load();
  };

  const handleSupplierUpdated = () => {
    void load();
    setSelectedId(null);
  };

  const handleSupplierDeleted = () => {
    void load();
    setSelectedId(null);
  };

  // ===== Render =====
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.paper' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {t('suppliers:title', 'Supplier Management')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setOpenDeleteDialog(true)}
            >
              {t('suppliers:actions.delete', 'Delete Supplier')}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setOpenEditDialog(true)}
            >
              {t('suppliers:actions.edit', 'Edit Supplier')}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpenCreateDialog(true)}
            >
              {t('suppliers:actions.create', 'Add Supplier')}
            </Button>
          </Box>
        </Box>

        {/* Search Supplier Panel */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          {t('suppliers:search.title', 'Search Supplier')}
        </Typography>
        
        <Box sx={{ position: 'relative', mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={t('suppliers:search.placeholder', 'Enter supplier name (min 2 chars)...')}
            value={searchQuery}
            onChange={(e) => handleSearchQueryChange(e.target.value)}
            disabled={searchLoading}
            InputProps={{
              endAdornment: searchLoading ? <CircularProgress size={20} /> : null,
            }}
          />

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <Paper
              elevation={2}
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 10,
                mt: 0.5,
                maxHeight: 300,
                overflow: 'auto',
              }}
            >
              <List>
                {searchResults.map((supplier) => (
                  <ListItemButton
                    key={supplier.id}
                    onClick={() => {
                      setSelectedSupplier(supplier);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                  >
                    <ListItemText
                      primary={supplier.name}
                      secondary={supplier.email || supplier.phone || 'No contact info'}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          )}
        </Box>

        {/* Selected Supplier Info */}
        {selectedSupplier && (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedSupplier.name}
                </Typography>
                {selectedSupplier.contactName && (
                  <Typography variant="caption" color="text.secondary">
                    {t('suppliers:table.contactName', 'Contact')}: {selectedSupplier.contactName}
                  </Typography>
                )}
                {selectedSupplier.phone && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    {selectedSupplier.phone}
                  </Typography>
                )}
                {selectedSupplier.email && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    {selectedSupplier.email}
                  </Typography>
                )}
              </Box>
              <Button
                size="small"
                color="error"
                onClick={() => setSelectedSupplier(null)}
              >
                {t('suppliers:actions.clear', 'Clear')}
              </Button>
            </Stack>
          </Paper>
        )}
      </Paper>

      {/* Show Suppliers List Checkbox */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={showAllSuppliers}
              onChange={(e) => setShowAllSuppliers(e.target.checked)}
            />
          }
          label={t('suppliers:filters.showAll', 'Show all suppliers')}
        />
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          {t('suppliers:filters.showAllHint', 'Check this box to display the complete supplier list')}
        </Typography>
      </Paper>

      {/* Suppliers List (only shows if checkbox is checked) */}
      {!showAllSuppliers ? (
        <Paper variant="outlined" sx={{ p: 2, height: 420, display: 'grid', placeItems: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {t('suppliers:filters.selectToShow', 'Check "Show all suppliers" to display the complete list')}
          </Typography>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ height: 420, position: 'relative' }}>
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
                    {t('suppliers:empty.default', 'No suppliers found')}
                  </Typography>
                </Box>
              ),
            }}
            sx={{ '& .MuiDataGrid-cell': { overflow: 'visible' } }}
          />
        </Paper>
      )}

      {/* Selected Info with Edit button */}
      {selectedId && (
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
          <Typography variant="body2" color="text.secondary">
            {t('suppliers:status.selected', 'Selected supplier ID')}: <strong>{selectedId}</strong>
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setOpenEditDialog(true)}
            >
              {t('suppliers:actions.edit', 'Edit')}
            </Button>
          </Stack>
        </Paper>
      )}
      </Paper>

      {/* Create Supplier Dialog */}
      <CreateSupplierDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        onCreated={handleSupplierCreated}
      />

      {/* Edit Supplier Dialog */}
      <EditSupplierDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        onSupplierUpdated={handleSupplierUpdated}
      />

      {/* Delete Supplier Dialog */}
      <DeleteSupplierDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onSupplierDeleted={handleSupplierDeleted}
      />
    </Box>
  );
};

export default Suppliers;
