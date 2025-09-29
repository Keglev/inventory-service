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
import { FormControlLabel, Checkbox } from '@mui/material';
import {
  DataGrid,
  type GridPaginationModel,
  type GridSortModel,
  type GridColDef,
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

/**
 * Narrower type guard to read an optional createdAt without using `any`.
 * @enterprise Avoids coupling the grid to backend-specific fields.
 */
function getMaybeCreatedAt(row: unknown): string | null {
  if (typeof row === 'object' && row !== null && 'createdAt' in row) {
    const v = (row as { createdAt?: unknown }).createdAt;
    return typeof v === 'string' ? v : null;
  }
  return null;
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

  /**
   * Show only items that are below their minimum quantity.
   * @enterprise
   * - When enabled, we filter rows on the client for the current page.
   * - We switch the grid to client pagination so counts stay accurate.
   */
  const [belowMinOnly, setBelowMinOnly] = React.useState(false);

  /**
   * Client paging is needed whenever we filter locally:
   * - supplier filtering (backend currently returns cross-supplier rows),
   * - or "below min only" is enabled.
   */
  const useClientPaging = Boolean(supplierId) || debouncedQ.trim().length > 0 || belowMinOnly;

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

  /**
   * Load a page of inventory from the backend.
   * Depends on supplierId, debouncedQ, paginationModel, sortModel.
   * If supplierId is null, the caller should avoid loading.
   * Sets loading state.
   * On error, sets an empty page.
   * @enterprise
   * - We always pass supplierId and q to the backend so search is supplier-scoped.
   * - We do not reset pagination when filters change; the user can navigate back.
   * - We do not clear selection when the list reloads; the user can see what they selected.
   * - We use useCallback so the effect below only triggers when dependencies change.
   */
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

  /**
   * Only fetch when supplierId is set.
   * Enterprise: prevents loading hundreds of items across all suppliers.
   */
  React.useEffect(() => {
    if (supplierId) void load();
    else {
      // Clear grid when supplier is cleared
      setServer((s) => ({ ...s, items: [], total: 0 }));
    }
  }, [supplierId, load]);


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
      { field: 'name', headerName: t('inventory:name', 'Item'), flex: 1, minWidth: 180 },
      {
        field: 'code',
        headerName: t('inventory:code', 'Code / SKU'),
        width: 140,
        valueGetter: (_value: unknown, row: InventoryRow) => row.code ?? '—',
      },
      // Supplier column removed (supplier is selected in the filter)
      { field: 'onHand', headerName: t('inventory:onHand', 'On-hand'), type: 'number', width: 120 },
      {
        field: 'updatedAt',
        headerName: t('inventory:updated', 'Updated'),
        width: 180,
        valueGetter: (_value: unknown, row: InventoryRow) => row.updatedAt ?? getMaybeCreatedAt(row) ?? '—',
      },
    ];
  }, [t]);

  /**
   * Filter rows by selected supplier (client-side fallback).
   * We use string comparison as IDs can be string/number.
   */
  const supplierFiltered = React.useMemo(() => {
    if (!supplierId) return server.items;
    const sid = String(supplierId);
    return server.items.filter((r) => String(r.supplierId ?? '') === sid);
  }, [server.items, supplierId]);

  /**
   * Client-side filter for "below min" rows.
   * @enterprise
   * - We consider rows where minQty > 0 and onHand < minQty.
   * - Search is case-insensitive, simple `includes` on `name`.
   * - No extra network requests; keeps DB load stable.
   */
  const filteredItems = React.useMemo(() => {
    let rows = supplierFiltered;

    // name search
    const qTrim = debouncedQ.trim().toLowerCase();
    if (qTrim.length > 0) {
      rows = rows.filter((r) => (r.name ?? '').toLowerCase().includes(qTrim));
    }

    // below min
    if (belowMinOnly) {
      rows = rows.filter((r) => {
        const minRaw = Number(r.minQty ?? 0);
        // Default threshold 5 when backend sends 0 → matches your UX note
        const min = Number.isFinite(minRaw) && minRaw > 0 ? minRaw : 5;
        const onHand = Number(r.onHand ?? 0);
        return onHand < min;
      });
    }
    return rows;
  }, [supplierFiltered, debouncedQ, belowMinOnly]);

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <Box sx={{ display: 'grid', gap: 1 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t('inventory:title', 'Inventory Management')}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={() => setOpenNew(true)}>
            {t('inventory:newItem', 'Add new item')}
          </Button>
          <Button disabled={!selectedRow} onClick={() => setOpenEdit(true)}>
            {t('actions.edit', 'Edit')}
          </Button>
          <Button disabled={!selectedRow} onClick={() => setOpenAdjust(true)}>
            {t('inventory:adjustQty', 'Adjust quantity')}
          </Button>
          <Button disabled={!selectedRow} onClick={() => setOpenPrice(true)}>
            {t('inventory:changePrice', 'Change price')}
          </Button>
        </Stack>
      </Stack>

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <InventoryFilters
          q={q}
          onQChange={setQ}
          supplierId={supplierId}
          onSupplierChange={(next) => {
          // When supplier changes, reset paging & selection, and clear search
          setSupplierId(next);
          setSelectedId(null);
          setQ('');
          setPaginationModel((m) => ({ ...m, page: 0 }));
        }}
        supplierOptions={supplierOptions}
        supplierLoading={supplierLoading}
        /** Enterprise: search is supplier-scoped; disabled until supplier is chosen. */
        disableSearchUntilSupplier
      />

      {/* Below-Min toggle (only active once a supplier is chosen) */}
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={belowMinOnly}
              onChange={(e) => {
                setBelowMinOnly(e.target.checked);
                // Reset to first page so user sees results immediately in client mode
                setPaginationModel((m) => ({ ...m, page: 0 }));
              }}
              disabled={!supplierId}
            />
          }
          label={t('inventory:belowMinOnly', 'Below min only')}
        />
      </Box>
    </Paper>

      {/* Content area */}
      <Paper variant="outlined" sx={{ height: 560, position: 'relative', p: supplierId ? 0 : 2 }}>
        {/* Supplier gate: block the grid until a supplier is selected */}
        {!supplierId ? (
          <Box sx={{ display: 'grid', placeItems: 'center', height: '100%' }}>
            <Typography variant="body1" color="text.secondary">
              {t('inventory:selectSupplierPrompt', 'Select a supplier to view their items.')}
            </Typography>
          </Box>
        ) : (
          <>
            {loading && (
              <LinearProgress sx={{ position: 'absolute', left: 0, right: 0, top: 0 }} />
            )}

            <DataGrid
              /**
               * Server-driven list *only* after supplier is chosen.
               * We pass both { supplierId, q } to the backend so search is supplier-scoped.
               */
              rows={filteredItems}
              columns={columns}
              rowCount={useClientPaging ? filteredItems.length : server.total}
              paginationMode={useClientPaging ? 'client' : 'server'}
              sortingMode={useClientPaging ? 'client' : 'server'}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              sortModel={sortModel}
              onSortModelChange={setSortModel}
              getRowId={(r) => r.id}
              /**
               * Single-selection via click to avoid selection model type drift between MUI versions.
               */
              onRowClick={(params) => setSelectedId(String(params.id))}

              /**
               * Empty state text.
               */
              slots={{
                noRowsOverlay: () => (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    {q
                      ? t('inventory:emptySearch', 'No matching items for this supplier.')
                      : t('inventory:empty', 'No items found for this supplier.')}
                  </Box>
                ),
              }}
              /**
               * Row-level styles for low stock (warning/critical).
               * @enterprise
               * - Default threshold 5 when minQty is 0/undefined.    
               */
              sx={{
                '& .low-stock-warning': (theme) => ({
                  bgcolor: theme.palette.warning.light,
                }),
                '& .low-stock-critical': (theme) => ({
                  bgcolor: theme.palette.error.light,
                }),
              }}
              getRowClassName={(params) => {
                const r = params.row as InventoryRow;
                const minRaw = Number(r.minQty ?? 0);
                const min = Number.isFinite(minRaw) && minRaw > 0 ? minRaw : 5; // default to 5
                const onHand = Number(r.onHand ?? 0);
                const deficit = min - onHand;
                if (deficit >= 5) return 'low-stock-critical';
                if (deficit > 0) return 'low-stock-warning';
                return '';
              }}
            />
          </>
        )}
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
            supplierId: selectedRow.supplierId ?? supplierId ?? '',
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
