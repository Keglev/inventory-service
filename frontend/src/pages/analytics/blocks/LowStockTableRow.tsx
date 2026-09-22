/**
 * @file LowStockTableRow.tsx
 * @module pages/analytics/blocks/LowStockTableRow
 * @summary Single low-stock table row with severity color and status chip.
 * @enterprise
 * Owns the severity presentation for one derived row, with the band from
 * lowStockSeverity (config/inventoryPolicy): Critical at half the minimum or
 * less, Warning below the minimum, OK otherwise. Number
 * formatting is injected by the table so the whole table renders with one
 * user-preference-bound formatter instead of one per row.
 */
import type { JSX } from 'react';
import { TableCell, TableRow, Chip } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import type { LowStockDerivedRow } from '../hooks/useLowStockRows';
import { lowStockSeverity } from '../../../config/inventoryPolicy';

/** Props accepted by {@link LowStockTableRow}. @public */
export type LowStockTableRowProps = {
  /** Derived row (includes the client-computed deficit). */
  row: LowStockDerivedRow;
  /** Table-level number formatter bound to the user's locale preference. */
  formatQty: (value: number | undefined | null) => string;
};

/**
 * Renders one low-stock row.
 *
 * @param props - {@link LowStockTableRowProps}
 * @returns The table row element.
 * @public
 */
export function LowStockTableRow({ row, formatQty }: LowStockTableRowProps): JSX.Element {
  const { t } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();
  const severity = lowStockSeverity(row.quantity, row.minimumQuantity);
  const critical = severity === 'critical';
  const warning = severity === 'warning';

  return (
    <TableRow>
      <TableCell
        component="th"
        scope="row"
        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {row.itemName}
      </TableCell>
      <TableCell align="right">{formatQty(row.quantity)}</TableCell>
      <TableCell align="right">{formatQty(row.minimumQuantity)}</TableCell>
      <TableCell
        align="right"
        sx={{
          fontWeight: 600,
          color: critical
            ? muiTheme.palette.error.main
            : warning
              ? muiTheme.palette.warning.main
              : muiTheme.palette.text.primary,
        }}
      >
        {formatQty(row.deficit)}
      </TableCell>
      <TableCell align="left" sx={{ whiteSpace: 'nowrap' }}>
        {critical ? (
          <Chip size="small" color="error" label={t('analytics:lowStock.status.critical')} />
        ) : warning ? (
          <Chip size="small" color="warning" label={t('analytics:lowStock.status.warning')} />
        ) : (
          <Chip size="small" color="success" label={t('analytics:lowStock.status.ok')} />
        )}
      </TableCell>
    </TableRow>
  );
}
