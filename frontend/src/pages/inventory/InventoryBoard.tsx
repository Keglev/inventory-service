/**
 * @file InventoryBoard.tsx
 * @module pages/inventory/InventoryBoard
 *
 * @summary
 * Orchestrator component for the Inventory Management page.
 * Composes: useInventoryState hook, useInventoryData hook, and specialized UI components.
 *
 * @enterprise
 * - Separation of concerns: state (useInventoryState) + data (useInventoryData) + UI (components)
 * - Server-side pagination and sorting with client-side fallback for filtering
 * - Row selection via click, with dialog management
 * - All dialogs (ItemForm, Edit, Delete, QuantityAdjust, PriceChange) managed here
 * - Full TypeScript type safety, no implicit any types
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

/**
 * Inventory Management Board - main page orchestrator.
 * 
 * Responsibilities:
 * - Compose state hook (useInventoryState) for all UI state management
 * - Compose data hook (useInventoryData) for data fetching and processing
 * - Render UI components (Toolbar, FilterPanel, Table)
 * - Manage dialog visibility and state
 * - Handle row selection and actions
 * 
 * @component
 * @returns JSX element with complete inventory management interface
 * 
 * @example
 * ```tsx
 * export default function InventoryPage() {
 *   return <InventoryBoard />;
 * }
 * ```
 */
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
  const { handleReload } = useRefreshHandler(state);

  // =====================
  // Data Fetching & Processing
  // =====================
  const data = useDataFetchingLogic(state);

  // =====================
  // Selected Row
  // =====================
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
