/**
 * @file LowStockStatusCell.tsx
 * @description
 * Renders the status column cell for a low stock item with color-coded chip.
 * Handles critical/warning/ok states with theme colors.
 */

import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { LowStockStatus } from './LowStockTable.types';

/**
 * Props for LowStockStatusCell
 */
export interface LowStockStatusCellProps {
  deficit: number;
}

/**
 * Determine status level based on deficit
 * @internal
 */
function getStatus(deficit: number): LowStockStatus {
  if (deficit >= 5) return 'critical';
  if (deficit > 0) return 'warning';
  return 'ok';
}

/**
 * Status cell component for low stock table
 * @param deficit - The stock deficit amount
 * @returns Chip component with appropriate color and label
 */
export function LowStockStatusCell({ deficit }: LowStockStatusCellProps) {
  const { t } = useTranslation(['analytics']);
  const status = getStatus(deficit);

  const colorMap: Record<LowStockStatus, 'error' | 'warning' | 'success'> = {
    critical: 'error',
    warning: 'warning',
    ok: 'success',
  };

  const labelMap: Record<LowStockStatus, string> = {
    critical: t('analytics:lowStock.status.critical', 'Critical'),
    warning: t('analytics:lowStock.status.warning', 'Warning'),
    ok: t('analytics:lowStock.status.ok', 'OK'),
  };

  return <Chip size="small" color={colorMap[status]} label={labelMap[status]} />;
}
