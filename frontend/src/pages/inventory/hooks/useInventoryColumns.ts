/**
 * @file useInventoryColumns.ts
 * @module pages/inventory/hooks/useInventoryColumns
 *
 * @summary
 * Column definitions and formatting for inventory DataGrid.
 * Extracted from useInventoryData for single responsibility.
 *
 * @enterprise
 * - Memoized column definitions with proper formatting
 * - Handles multiple field name variations from backend
 * - Number and date formatting via user preferences
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
        valueGetter: ({ row }: { row: InventoryRow }) => row.code ?? '—',
      },
      {
        field: 'onHand',
        headerName: t('inventory:table.onHand', 'On-hand'),
        type: 'number',
        width: 140,
        valueGetter: ({
          row,
        }: {
          row: InventoryRow & { quantity?: number | null };
        }) => {
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
        valueFormatter: ({ value }: { value: unknown }) => {
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
        valueGetter: ({
          row,
        }: {
          row: InventoryRow & { minimumQuantity?: number | string | null };
        }) => {
          const raw = row.minQty ?? row.minimumQuantity ?? 0;
          if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
          if (typeof raw === 'string' && raw.trim() !== '') {
            const parsed = Number(raw);
            return Number.isFinite(parsed) ? parsed : 0;
          }
          return 0;
        },
        valueFormatter: ({ value }: { value: unknown }) => {
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
        field: 'updatedAt',
        headerName: t('inventory:table.updated', 'Updated'),
        width: 190,
        valueGetter: ({
          row,
        }: {
          row: InventoryRow & {
            createdAt?: string | null;
            created_at?: string | null;
          };
        }) => {
          return row.updatedAt ?? row.createdAt ?? row.created_at ?? null;
        },
        valueFormatter: ({ value }: { value: unknown }) => {
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
