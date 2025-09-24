/**
 * @file Inventory.tsx
 * @module pages/inventory/Inventory
 *
 * @summary
 * Phase B1+B2: Inventory List (server-driven) + Create/Edit + Qty Adjust + Price Change.
 *
 * @enterprise
 * - Tolerant loading: UI stays responsive even on failures.
 * - Dialogs are decoupled; the grid reloads after each successful mutation.
 * - Strict typing: no `any`, no unused imports, MUI DataGrid-friendly.
 */

import * as React from 'react';
import { Box, Paper, Typography, LinearProgress, Stack, Button } from '@mui/material';
import {
  DataGrid,
  type GridPaginationModel,
  type GridSortModel,
  type GridColDef,
  type GridRowParams,
} from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';

import { getInventoryPage } from '../../api/inventory';
import type { InventoryListResponse, InventoryRow } from '../../api/inventory';

import { InventoryFilters } from './InventoryFilters';
import type { SupplierOption } from './InventoryFilters';

import { listSuppliers } from '../../api/inventory/mutations';
import type { SupplierOptionDTO } from '../../api/inventory/mutations';

import { ItemFormDialog } from './ItemFormDialog';
import { QuantityAdjustDialog } from './QuantityAdjustDialog';
import { PriceChangeDialog } from './PriceChangeDialog';

/** Debounce simple values to reduce server chatter while typing. */
function useDebounced<T>(value: T, delayMs: number): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const h = setTimeout(() => setV(value), delayMs);
    return () => clearTimeout(h);
  }, [value, delayMs]);
  return v;
}

const DEFAULT_PAGE_SIZE = 10;

const Inventory: React.FC = () => {
  // Include 'inventory' so `t('inventory.*')` is strongly typed and error-free.
  const { t } = useTranslation(['common', 'auth', 'analytics', 'inventory']);

  // -----------------------------
  // Filters/state
  // -----------------------------
  const [q, setQ] = React.useState('');
  const debouncedQ = useDebounced(q, 350);

  const [supplierId, setSupplierId] = React.useState<string | number | null>(null);

  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    { field: 'name', sort: 'asc' },
  ]);

  const [server, setServer] = React.useState<InventoryListResponse>({
    items: [],
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const [loading, setLoading] = React.useState(false);

  // Supplier picker options for the Filters component
  const [supplierOptions, setSupplierOptions] = React.useState<SupplierOption[]>([]);
  const [supplierLoading, setSupplierLoading] = React.useState(false);

  // -----------------------------
  // Single selection via row click (no GridRowSelectionModel, no Sets)
  // -----------------------------
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selectedRow = server.items.find((r) => r.id === selectedId) ?? null;

  // -----------------------------
  // Dialog toggles
  // -----------------------------
  const [openNew, setOpenNew] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [openAdjust, setOpenAdjust] = React.useState(false);
  const [openPrice, setOpenPrice] = React.useState(false);

  // -----------------------------
  // Fetch list
  // -----------------------------
  const serverPage = paginationModel.page + 1; // convert to 1-based
  const serverSort =
    sortModel.length ? `${sortModel[0].field},${sortModel[0].sort ?? 'asc'}` : 'name,asc';

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await getInventoryPage({
      page: serverPage,
      pageSize: paginationModel.pageSize,
      q: debouncedQ,
      supplierId: supplierId ?? undefined,
      sort: serverSort,
    });
    setServer(res);
    setLoading(false);
  }, [serverPage, paginationModel.pageSize, debouncedQ, supplierId, serverSort]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // -----------------------------
  // Suppliers for filter (tolerant)
  // -----------------------------
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setSupplierLoading(true);
      try {
        const list = await listSuppliers(); // SupplierOptionDTO[]
        const opts: SupplierOption[] = list.map((s: SupplierOptionDTO) => ({
          id: s.id,
          label: s.name,
        }));
        if (!cancelled) setSupplierOptions(opts);
      } finally {
        setSupplierLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // -----------------------------
  // Columns (value getters avoid missing data gracefully)
  // -----------------------------
  const columns = React.useMemo<GridColDef<InventoryRow>[]>(() => {
    return [
      { field: 'name', headerName: t('inventory.name', 'Item'), flex: 1, minWidth: 180 },
      {
        field: 'code',
        headerName: t('inventory.code', 'Code / SKU'),
        width: 140,
        valueGetter: (_value: unknown, row: InventoryRow) => row.code ?? '—',
      },
      {
        field: 'supplierName',
        headerName: t('inventory.supplier', 'Supplier'),
        width: 180,
        valueGetter: (_value: unknown, row: InventoryRow) => row.supplierName ?? '—',
      },
      { field: 'onHand', headerName: t('inventory.onHand', 'On-hand'), type: 'number', width: 120 },
      {
        field: 'minQty',
        headerName: t('inventory.minQty', 'Min Qty'),
        type: 'number',
        width: 120,
        valueGetter: (_value: unknown, row: InventoryRow) => row.minQty ?? 0,
      },
      {
        field: 'updatedAt',
        headerName: t('inventory.updated', 'Updated'),
        width: 180,
        valueGetter: (_value: unknown, row: InventoryRow) => row.updatedAt ?? '—',
      },
    ];
  }, [t]);

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <Box sx={{ display: 'grid', gap: 1 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t('inventory.title', 'Inventory Management')}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={() => setOpenNew(true)}>
            {t('inventory.newItem', 'Add new item')}
          </Button>
          <Button disabled={!selectedRow} onClick={() => setOpenEdit(true)}>
            {t('actions.edit', 'Edit')}
          </Button>
          <Button disabled={!selectedRow} onClick={() => setOpenAdjust(true)}>
            {t('inventory.adjustQty', 'Adjust quantity')}
          </Button>
          <Button disabled={!selectedRow} onClick={() => setOpenPrice(true)}>
            {t('inventory.changePrice', 'Change price')}
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <InventoryFilters
          q={q}
          onQChange={setQ}
          supplierId={supplierId}
          onSupplierChange={setSupplierId}
          supplierOptions={supplierOptions}
          supplierLoading={supplierLoading}
        />
      </Paper>

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
          // Single row id tracking via click; avoids selection model type differences across versions
          onRowClick={(params: GridRowParams) => setSelectedId(String(params.id))}
          slots={{
            noRowsOverlay: () => (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                {t('inventory.empty', 'No items found for the current filters.')}
              </Box>
            ),
          }}
        />
      </Paper>

      {/* Dialogs */}
      <ItemFormDialog
        open={openNew}
        onClose={() => setOpenNew(false)}
        onSaved={load}
      />

      {selectedRow && (
        <ItemFormDialog
          open={openEdit}
          initial={{
            id: selectedRow.id,
            name: selectedRow.name,
            code: selectedRow.code ?? '',
            supplierId: selectedRow.supplierId ?? '',
            minQty: selectedRow.minQty ?? 0,
            notes: '',
          }}
          onClose={() => setOpenEdit(false)}
          onSaved={load}
        />
      )}

      {selectedId && (
        <QuantityAdjustDialog
          open={openAdjust}
          itemId={selectedId}
          onClose={() => setOpenAdjust(false)}
          onAdjusted={load}
        />
      )}

      {selectedId && (
        <PriceChangeDialog
          open={openPrice}
          itemId={selectedId}
          onClose={() => setOpenPrice(false)}
          onChanged={load}
        />
      )}
    </Box>
  );
};

export default Inventory;
