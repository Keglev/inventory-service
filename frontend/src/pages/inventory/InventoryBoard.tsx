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
 * - This is the reference site for HelpIconButton wiring: the help
 *   icon next to the page title uses the shared component with the
 *   topicId 'inventory.overview', matching QuantityAdjustDialog's
 *   pattern. Dialogs that still use raw IconButton + HelpOutlineIcon
 *   or window.open should converge on this pattern.
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
import { HelpIconButton } from '../../features/help/components/HelpIconButton';

import { useInventoryState } from './hooks/useInventoryState';
import { InventoryToolbar } from './components/InventoryToolbar';
import { InventoryFilterPanel } from './components/InventoryFilterPanel';
import { InventoryTable } from './components/InventoryTable';
import { InventoryDialogs } from './components/InventoryDialogs';
import { useToolbarHandlers } from './handlers/useToolbarHandlers';
import { useFilterHandlers } from './handlers/useFilterHandlers';
import { useTableHandlers } from './handlers/useTableHandlers';
import { useRefreshHandler } from './handlers/useRefreshHandler';
import { useDataFetchingLogic } from './handlers/useDataFetchingLogic';

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

  // Refresh + all five mutation-success callbacks re-run the current query
  // via the data hook's reload (fixes the page-0 no-op).
  const { handleReload } = useRefreshHandler(data.reload);

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
              {t('inventory:page.title')}
            </Typography>
            <HelpIconButton
              topicId="inventory.overview"
              tooltip={t('actions.help')}
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
                {t('inventory:search.selectSupplierPrompt')}
              </Typography>
            </Box>
          ) : (
            <InventoryTable
              rows={data.items}
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
        openAdjust={state.openAdjust}
        setOpenAdjust={state.setOpenAdjust}
        openPrice={state.openPrice}
        setOpenPrice={state.setOpenPrice}
        onReload={handleReload}
        isDemo={isDemo}
      />
    </Box>
  );
};

export default InventoryBoard;
