/**
 * @file SuppliersToolbar.tsx
 * @module pages/suppliers/components/SuppliersToolbar
 *
 * @summary
 * Toolbar component for suppliers board.
 * Displays title and action buttons (Create, Edit, Delete).
 *
 * @enterprise
 * - Pure presentation component, no business logic
 * - Action buttons disabled based on selection state
 * - Responsive layout with MUI Stack
 * - i18n support for all labels
 */

import * as React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Suppliers Toolbar component props.
 *
 * @interface SuppliersToolbarProps
 */
export interface SuppliersToolbarProps {
  /** Whether Create action is enabled */
  onCreateClick: () => void;
  /** Whether Edit action is enabled (requires selection) */
  editEnabled: boolean;
  onEditClick: () => void;
  /** Whether Delete action is enabled (requires selection) */
  deleteEnabled: boolean;
  onDeleteClick: () => void;
}

/**
 * Toolbar for suppliers board.
 *
 * Displays title and action buttons:
 * - Add Supplier (always enabled)
 * - Edit Supplier (enabled when supplier selected)
 * - Delete Supplier (enabled when supplier selected)
 *
 * @component
 * @example
 * ```tsx
 * <SuppliersToolbar
 *   onCreateClick={() => setOpenCreate(true)}
 *   editEnabled={selectedId !== null}
 *   onEditClick={() => setOpenEdit(true)}
 *   deleteEnabled={selectedId !== null}
 *   onDeleteClick={() => setOpenDelete(true)}
 * />
 * ```
 */
export const SuppliersToolbar: React.FC<SuppliersToolbarProps> = ({
  onCreateClick,
  editEnabled,
  onEditClick,
  deleteEnabled,
  onDeleteClick,
}) => {
  const { t } = useTranslation(['common', 'suppliers']);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        p: 2,
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        {t('suppliers:title', 'Supplier Management')}
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          color="error"
          disabled={!deleteEnabled}
          onClick={onDeleteClick}
        >
          {t('suppliers:actions.delete', 'Delete Supplier')}
        </Button>
        <Button
          variant="outlined"
          color="primary"
          disabled={!editEnabled}
          onClick={onEditClick}
        >
          {t('suppliers:actions.edit', 'Edit Supplier')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onCreateClick}
        >
          {t('suppliers:actions.create', 'Add Supplier')}
        </Button>
      </Stack>
    </Box>
  );
};
