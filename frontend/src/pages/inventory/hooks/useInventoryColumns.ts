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
import { formatDate, formatNumber } from '../../../utils/formatters';
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
        headerName: t('inventory:table.name', 'Item'),
        flex: 1,
        minWidth: 180,
      },
      {
        field: 'code',
        headerName: t('inventory:table.code', 'Code / SKU'),
        width: 140,
        valueGetter: (_value: unknown, row: InventoryRow | null) => row?.code ?? '—',
      },
      {
        field: 'onHand',
        headerName: t('inventory:table.onHand', 'On-hand'),
        type: 'number',
        width: 140,
        valueGetter: (_value: unknown, row: (InventoryRow & { quantity?: number | null }) | null) => {
          if (!row) return 0;
          const fromNormalized =
            typeof row.onHand === 'number' && Number.isFinite(row.onHand)
              ? row.onHand
              : undefined;
          const fromBackend =
            typeof row.quantity === 'number' && Number.isFinite(row.quantity)
              ? row.quantity
              : undefined;
          return fromNormalized ?? fromBackend ?? 0;
        },
        valueFormatter: (value: unknown) => {
          const numeric =
            typeof value === 'number' && Number.isFinite(value) ? value : 0;
          return formatNumber(numeric, userPreferences.numberFormat);
        },
      },
      {
        field: 'minQty',
        headerName: t('inventory:table.minQty', 'Min. Qty'),
        type: 'number',
        width: 140,
        valueGetter: (_value: unknown, row: (InventoryRow & { minimumQuantity?: number | string | null }) | null) => {
          if (!row) return 0;
          const raw = row.minQty ?? row.minimumQuantity ?? 0;
          if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
          if (typeof raw === 'string' && raw.trim() !== '') {
            const parsed = Number(raw);
            return Number.isFinite(parsed) ? parsed : 0;
          }
          return 0;
        },
        valueFormatter: (value: unknown) => {
          const numeric =
            typeof value === 'number'
              ? value
              : typeof value === 'string' && value.trim() !== ''
              ? Number(value)
              : 0;
          return formatNumber(
            Number.isFinite(numeric) ? numeric : 0,
            userPreferences.numberFormat,
          );
        },
      },
      {
        field: 'createdAt',
        headerName: t('inventory:table.created'),
        width: 190,
        valueGetter: (_value: unknown, row: InventoryRow | null) => {
          if (!row) return null;
          return row.createdAt ?? null;
        },
        valueFormatter: (value: unknown) => {
          if (value === null || value === undefined || value === '') {
            return '—';
          }

          const str = String(value);
          const date = new Date(str);
          if (Number.isNaN(date.getTime())) {
            return '—';
          }

          try {
            return formatDate(date, userPreferences.dateFormat);
          } catch {
            return '—';
          }
        },
      },
    ];
  }, [t, userPreferences.numberFormat, userPreferences.dateFormat]);
};
