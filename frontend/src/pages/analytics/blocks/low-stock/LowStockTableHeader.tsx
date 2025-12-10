/**
 * @file LowStockTableHeader.tsx
 * @description
 * Header row for low stock table with column labels.
 */

import { TableHead, TableRow, TableCell } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Column header component for low stock table
 * Displays labels for: Item, Quantity, Minimum, Deficit, Status
 */
export function LowStockTableHeader() {
  const { t } = useTranslation(['analytics']);

  return (
    <TableHead>
      <TableRow>
        <TableCell sx={{ width: '40%' }}>
          {t('analytics:lowStock.columns.item', 'Item')}
        </TableCell>
        <TableCell align="right" sx={{ width: '15%' }}>
          {t('analytics:lowStock.columns.quantity', 'Quantity')}
        </TableCell>
        <TableCell align="right" sx={{ width: '15%' }}>
          {t('analytics:lowStock.columns.minimum', 'Minimum')}
        </TableCell>
        <TableCell align="right" sx={{ width: '15%' }}>
          {t('analytics:lowStock.columns.deficit', 'Deficit')}
        </TableCell>
        <TableCell align="left" sx={{ width: '15%', whiteSpace: 'nowrap' }}>
          {t('analytics:lowStock.columns.status', 'Status')}
        </TableCell>
      </TableRow>
    </TableHead>
  );
}
