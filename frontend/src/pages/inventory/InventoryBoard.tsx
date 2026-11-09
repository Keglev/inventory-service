/**
 * @file InventoryBoard.tsx
 * @module pages/inventory/InventoryBoard
 *
 * @summary
 * Root orchestrator for the inventory management page.
 *
 * @enterprise
 * - Composition layout: state (useInventoryState) -> handlers (useToolbarHandlers,
 *   useFilterHandlers, useRefreshHandler) -> data (useDataFetchingLogic) -> UI components
 *   (InventoryToolbar, InventoryFilterPanel, InventoryTable,
 *   InventoryDialogs). The board owns no useState or useEffect of its
 *   own; every piece of state lives in a sub-hook.
 * - The help icon next to the page title is the shared HelpIconButton
 *   (topicId 'inventory.overview'), as in every dialog.
 * - Without a supplier the grid lists the stock of all suppliers, one
 *   server page at a time: GET /api/inventory/search pages and needs no
 *   supplier.
 * - Demo mode (isDemo from useAuth) flows down to all five dialogs as
 *   readOnly via InventoryDialogs (frontend ADR-0013).
 */

import * as React from 'react';
import { Paper, Typography, Stack } from '@mui/material';
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
import { useRefreshHandler } from './handlers/useRefreshHandler';
import { useDataFetchingLogic } from './handlers/useDataFetchingLogic';
import { railGutter } from '../../theme/pagePanel';
import { PagePanel } from '../../components/ui/PagePanel';

const InventoryBoard: React.FC = () => {
  const { t } = useTranslation(['common', 'auth', 'analytics', 'inventory']);
  const { user } = useAuth();
  const isDemo = Boolean(user?.isDemo);

  const state = useInventoryState();

  const { handleAddNew, handleEdit, handleDelete, handleAdjustQty, handleChangePrice } =
    useToolbarHandlers(state);
  const { handleSearchChange, handleSupplierChange, handleBelowMinChange } =
    useFilterHandlers(state);

  const data = useDataFetchingLogic(state);

  // The five mutation-success callbacks re-run the current query via the data
  // hook's reload, also on page 0.
  const { handleReload } = useRefreshHandler(data.reload);

  return (
    <PagePanel
      overlays={
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
      }
    >
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 3 },
          pl: railGutter,
          pr: railGutter,
          pt: { xs: 2, md: 3 },
          pb: 2,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {t('inventory:page.title')}
          </Typography>
          <HelpIconButton
            topicId="inventory.overview"
            tooltip={t('actions.help')}
          />
        </Stack>

        <InventoryToolbar
          onAddNew={handleAddNew}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdjustQty={handleAdjustQty}
          onChangePrice={handleChangePrice}
        />
      </Stack>

      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, mx: { xs: 2, md: 3 }, ml: railGutter, mr: railGutter }}>
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

      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          position: 'relative',
          mx: { xs: 2, md: 3 },
          ml: railGutter,
          mr: railGutter,
          mb: { xs: 2, md: 3 },
          minHeight: 420,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <InventoryTable
          rows={data.items}
          columns={data.columns}
          paginationModel={state.paginationModel}
          onPaginationChange={state.setPaginationModel}
          sortModel={state.sortModel}
          onSortChange={state.setSortModel}
          getRowClassName={data.getRowClassName}
          loading={data.loading}
          rowCount={data.server.total}
        />
      </Paper>
    </PagePanel>
  );
};

export default InventoryBoard;
