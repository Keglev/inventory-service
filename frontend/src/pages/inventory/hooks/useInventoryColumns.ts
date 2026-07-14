/**
 * @file useInventoryColumns.ts
 * @module pages/inventory/hooks/useInventoryColumns
 *
 * @summary
 * Memoized MUI DataGrid column definitions for the inventory table,
 * with locale-aware number and date formatting.
 *
 * @enterprise
 * - Memoized on t() and userPreferences (numberFormat, dateFormat) so
 *   locale and format changes re-render columns. Field identifiers stay
 *   constant across renders so DataGrid's internal column-key cache is
 *   stable.
 * - Value-getter field-name tolerance for onHand (falls back to quantity)
 *   and minQty (falls back to minimumQuantity) is retained here; tracked
 *   under CB-B (dead multi-field tolerance vs single-shape backend).
 * - The date column shows the backend's createdAt (InventoryItemDTO); the
 *   backend has no update timestamp, so the column is labeled "Created".
 * - Placeholder glyph is rendered for missing or unparseable values so
 *   columns hold visual rhythm during partial loads rather than showing
 *   empty cells.
 */

import * as React from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../../hooks/useSettings';
import {
  resolveOnHand,
  resolveMinQty,
  resolvePrice,
  resolveTotalValue,
  formatCount,
  formatMoney,
} from './inventoryColumnValues';
import { formatDateCell } from '../../../utils/formatters';
import type { InventoryRow } from '../../../api/inventory/types';

/**
 * Hook to generate inventory DataGrid column definitions.
 * 
 * @returns Column definitions with formatters and value getters
 */
export const useInventoryColumns = (): GridColDef[] => {
  const { t } = useTranslation(['common', 'inventory']);
  const { userPreferences } = useSettings();

  return React.useMemo<GridColDef[]>(() => {
    return [
      {
        field: 'name',
        headerName: t('inventory:table.name'),
        flex: 1,
        minWidth: 180,
      },
      {
        field: 'code',
        headerName: t('inventory:table.code'),
        width: 140,
        valueGetter: (_value: unknown, row: InventoryRow | null) => row?.code ?? '—',
      },
      {
        field: 'onHand',
        headerName: t('inventory:table.onHand'),
        type: 'number',
        width: 110,
        valueGetter: (_value: unknown, row: (InventoryRow & { quantity?: number | null }) | null) =>
          resolveOnHand(row),
        valueFormatter: (value: unknown) => formatCount(value, userPreferences.numberFormat),
      },
      {
        field: 'minQty',
        headerName: t('inventory:table.minQty'),
        type: 'number',
        width: 120,
        valueGetter: (_value: unknown, row: (InventoryRow & { minimumQuantity?: number | string | null }) | null) =>
          resolveMinQty(row),
        valueFormatter: (value: unknown) => formatCount(value, userPreferences.numberFormat),
      },
      {
        field: 'price',
        headerName: t('inventory:table.unitPrice'),
        type: 'number',
        width: 130,
        valueGetter: (_value: unknown, row: InventoryRow | null) => resolvePrice(row),
        valueFormatter: (value: unknown) => formatMoney(value, userPreferences.numberFormat),
      },
      {
        field: 'totalValue',
        headerName: t('inventory:table.totalValue'),
        type: 'number',
        width: 150,
        // Server-computed (quantity x price); not an entity column, so it
        // cannot participate in server-side sorting.
        sortable: false,
        valueGetter: (_value: unknown, row: InventoryRow | null) => resolveTotalValue(row),
        valueFormatter: (value: unknown) => formatMoney(value, userPreferences.numberFormat),
      },
      {
        field: 'createdAt',
        headerName: t('inventory:table.created'),
        width: 160,
        valueGetter: (_value: unknown, row: InventoryRow | null) => {
          if (!row) return null;
          return row.createdAt ?? null;
        },
        valueFormatter: (value: unknown) => formatDateCell(value, userPreferences.dateFormat),
      },
    ];
  }, [t, userPreferences.numberFormat, userPreferences.dateFormat]);
};
