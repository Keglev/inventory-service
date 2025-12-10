/**
 * @file LowStockTableRows.tsx
 * @description
 * Body rows component for low stock table.
 * Renders individual items with formatting and status indicators.
 */

import { TableBody, TableRow, TableCell } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useCallback } from 'react';
import { formatNumber } from '../../../../utils/formatters';
import { LowStockStatusCell } from './LowStockStatusCell';
import type { LowStockRowWithDeficit } from './LowStockTable.types';

/**
 * Props for LowStockTableRows
 */
export interface LowStockTableRowsProps {
  rows: LowStockRowWithDeficit[];
  numberFormat: 'DE' | 'EN_US';
}

/**
 * Table body component rendering low stock items
 * @param rows - Processed rows with computed deficits
 * @param numberFormat - Number formatting preference
 */
export function LowStockTableRows({ rows, numberFormat }: LowStockTableRowsProps) {
  const muiTheme = useMuiTheme();

  // Format quantity/minimum/deficit with user preferences
  const formatQty = useCallback(
    (value: number | undefined | null): string => {
      if (typeof value !== 'number' || Number.isNaN(value)) return formatNumber(0, numberFormat, 0);
      return formatNumber(value, numberFormat, 0);
    },
    [numberFormat]
  );

  return (
    <TableBody>
      {rows.map((row) => {
        const critical = row.deficit >= 5;
        const warning = row.deficit > 0 && row.deficit < 5;
        const deficitColor = critical
          ? muiTheme.palette.error.main
          : warning
            ? muiTheme.palette.warning.main
            : muiTheme.palette.text.primary;

        return (
          <TableRow key={row.itemName}>
            <TableCell
              component="th"
              scope="row"
              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {row.itemName}
            </TableCell>
            <TableCell align="right">{formatQty(row.quantity)}</TableCell>
            <TableCell align="right">{formatQty(row.minimumQuantity)}</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, color: deficitColor }}>
              {formatQty(row.deficit)}
            </TableCell>
            <TableCell align="left" sx={{ whiteSpace: 'nowrap' }}>
              <LowStockStatusCell deficit={row.deficit} />
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  );
}
