/**
 * @file SuppliersFilterPanel.tsx
 * @module pages/suppliers/components/SuppliersFilterPanel
 *
 * @summary
 * Filter panel component for suppliers board.
 * Manages display toggle for complete supplier list.
 *
 * @enterprise
 * - Pure presentation component
 * - Simple checkbox toggle for list visibility
 * - Helper text for UX guidance
 * - i18n support
 */

import * as React from 'react';
import { Paper, FormControlLabel, Checkbox, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Suppliers Filter Panel component props.
 *
 * @interface SuppliersFilterPanelProps
 */
export interface SuppliersFilterPanelProps {
  /** Whether to show all suppliers */
  showAllSuppliers: boolean;
  /** Handler for toggle change */
  onToggleChange: (show: boolean) => void;
}

/**
 * Filter panel for suppliers board.
 *
 * Features:
 * - Checkbox to toggle complete supplier list visibility
 * - Helper text explaining the toggle
 *
 * @component
 * @example
 * ```tsx
 * <SuppliersFilterPanel
 *   showAllSuppliers={show}
 *   onToggleChange={setShow}
 * />
 * ```
 */
export const SuppliersFilterPanel: React.FC<SuppliersFilterPanelProps> = ({
  showAllSuppliers,
  onToggleChange,
}) => {
  const { t } = useTranslation(['common', 'suppliers']);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={showAllSuppliers}
            onChange={(e) => onToggleChange(e.target.checked)}
          />
        }
        label={t('suppliers:filters.showAll', 'Show all suppliers')}
      />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
        {t(
          'suppliers:filters.showAllHint',
          'Check this box to display the complete supplier list'
        )}
      </Typography>
    </Paper>
  );
};
