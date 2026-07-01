/**
 * @file InventoryBoard.tsx
 * @module pages/inventory/InventoryBoard
 *
 * @summary
 * Root orchestrator for the inventory management page. Composes the
 * state hook, five handler hooks, the data-fetching hook, and the
 * presentation components into a single page layout.
 *
 * @enterprise
 * - Composition layout: state (useInventoryState) -> handlers (five
 *   *Handlers hooks) -> data (useDataFetchingLogic) -> UI components
 *   (InventoryToolbar, InventoryFilterPanel, InventoryTable,
 *   InventoryDialogs). The board owns no useState or useEffect of its
 *   own; every piece of state lives in a sub-hook.
 * - selectedRow is DERIVED from data.server.items via .find on
 *   state.selectedId. This means the derivation is bound to the
 *   currently visible server page: if a filter or pagination change
 *   removes the selected item from the visible rows, selectedRow
 *   becomes null while state.selectedId remains set. Toolbar buttons
 *   that depend on the selection then operate on a stale id with no
 *   visible feedback. Tracked under CB-APP65 -- either clear
 *   selectedId when a filter/pagination change is about to evict the
 *   selected row, or treat selectedRow === null as a guard at every
 *   handler that consumes the selection.
 * - This is the reference site for HelpIconButton wiring: the help
 *   icon next to the page title uses the shared component with the
 *   topicId 'inventory.overview', matching QuantityAdjustDialog's
 *   pattern. Dialogs that still use raw IconButton + HelpOutlineIcon
 *   or window.open should converge on this pattern (CB-APP54,
 *   CB-APP57, CM-APP11).
 * - The "select a supplier to view items" placeholder is mandatory
 *   UX: the inventory page intentionally renders nothing until a
 *   supplier is chosen, because the backend item-search endpoint is
 *   supplier-gated for performance and the page would otherwise
 *   request a full unfiltered list on mount.
 * - Demo mode (isDemo from useAuth) flows down to the three dialogs
 *   that support readOnly (delete, quantity-adjust, price-change)
 *   via InventoryDialogs.
 */

import * as React from 'react';
import { Box, Paper, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../hooks/useAuth';
import { HelpIconButton } from '../../features/help';

import { useInventoryState } from './hooks/useInventoryState';
import { InventoryToolbar } from './components/InventoryToolbar';
import { InventoryFilterPanel } from './components/InventoryFilterPanel';
import { InventoryTable } from './components/InventoryTable';
import { InventoryDialogs } from './components/InventoryDialogs';
import {
  useToolbarHandlers,
  useFilterHandlers,
  useTableHandlers,
  useRefreshHandler,
  useDataFetchingLogic,
} from './handlers';

const InventoryBoard: React.FC = () => {
  const { t } = useTranslation(['common', 'auth', 'analytics', 'inventory']);
  const { user } = useAuth();
  const isDemo = Boolean(user?.isDemo);

  // =====================
  // State Management
  // =====================
  const state = useInventoryState();

  // =====================
  // Event Handlers
  // =====================
  const { handleAddNew, handleEdit, handleDelete, handleAdjustQty, handleChangePrice } =
    useToolbarHandlers(state);
  const { handleSearchChange, handleSupplierChange, handleBelowMinChange } =
    useFilterHandlers(state);
  const { handleRowClick, handlePaginationChange, handleSortChange } = useTableHandlers(state);

  // =====================
  // Data Fetching & Processing
  // =====================
  const data = useDataFetchingLogic(state);

  // Refresh + all six mutation-success callbacks re-run the current query
  // via the data hook's reload (fixes the page-0 no-op).
  const { handleReload } = useRefreshHandler(data.reload);

  // =====================
  // Selected Row
  // =====================
  // BUCKET: CB-APP65 -- selectedRow derived from visible page only. Stale state.selectedId persists if a filter/pagination change evicts the row. Either clear selectedId on eviction or guard selectedRow === null at every consumer.
  const selectedRow = data.server.items.find((r) => r.id === state.selectedId) ?? null;

  // =====================
  // Render
  // =====================
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: 0,
          bgcolor: 'background.paper',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {t('inventory:page.title', 'Inventory Management')}
            </Typography>
            <HelpIconButton
              topicId="inventory.overview"
              tooltip={t('actions.help', 'Help')}
            />
          </Stack>

          {/* Toolbar */}
          <InventoryToolbar
            onAddNew={handleAddNew}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdjustQty={handleAdjustQty}
            onChangePrice={handleChangePrice}
          />
        </Stack>

        {/* Filter Panel */}
        <Paper variant="outlined" sx={{ p: 1.5, mb: 2, mx: { xs: 2, md: 3 } }}>
          <InventoryFilterPanel
            q={state.q}
            setQ={handleSearchChange}
            supplierId={state.supplierId}
            setSupplierId={handleSupplierChange}
            belowMinOnly={state.belowMinOnly}
            setBelowMinOnly={handleBelowMinChange}
            suppliers={data.suppliers}
            supplierLoading={data.supplierLoading}
          />
        </Paper>

        {/* Table Container */}
        <Paper
          variant="outlined"
          sx={{
            flex: 1,
            position: 'relative',
            mx: { xs: 2, md: 3 },
            mb: { xs: 2, md: 3 },
            p: state.supplierId ? 0 : 2,
            minHeight: 420,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {!state.supplierId ? (
            <Box sx={{ display: 'grid', placeItems: 'center', height: '100%' }}>
              <Typography variant="body1" color="text.secondary">
                {t('inventory:search.selectSupplierPrompt', 'Select a supplier to view their items.')}
              </Typography>
            </Box>
          ) : (
            <InventoryTable
              rows={data.filteredItems}
              columns={data.columns}
              paginationModel={state.paginationModel}
              onPaginationChange={handlePaginationChange}
              sortModel={state.sortModel}
              onSortChange={handleSortChange}
              selectedId={state.selectedId}
              onRowClick={handleRowClick}
              getRowClassName={data.getRowClassName}
              loading={data.loading}
              rowCount={data.server.total}
            />
          )}
        </Paper>
      </Paper>

      {/* Dialogs */}
      <InventoryDialogs
        openNew={state.openNew}
        setOpenNew={state.setOpenNew}
        openEditName={state.openEditName}
        setOpenEditName={state.setOpenEditName}
        openDelete={state.openDelete}
        setOpenDelete={state.setOpenDelete}
        openEdit={state.openEdit}
        setOpenEdit={state.setOpenEdit}
        openAdjust={state.openAdjust}
        setOpenAdjust={state.setOpenAdjust}
        openPrice={state.openPrice}
        setOpenPrice={state.setOpenPrice}
        selectedRow={selectedRow}
        onReload={handleReload}
        isDemo={isDemo}
      />
    </Box>
  );
};

export default InventoryBoard;
