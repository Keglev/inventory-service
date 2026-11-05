/**
 * @file SuppliersToolbar.tsx
 * @module pages/suppliers/components/SuppliersToolbar
 *
 * @summary
 * Toolbar for the suppliers board: title and the Create, Edit and Delete buttons.
 *
 * @enterprise
 * - Pure presentation component, no business logic
 * - Edit and Delete are enabled by the parent (selection, demo session or ADMIN role)
 * - Responsive layout with MUI Stack
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
  /** Opens the Create dialog */
  onCreateClick: () => void;
  /** Whether Edit action is enabled (selection OR demo session OR ADMIN role) */
  editEnabled: boolean;
  onEditClick: () => void;
  /** Whether Delete action is enabled (selection OR demo session OR ADMIN role) */
  deleteEnabled: boolean;
  onDeleteClick: () => void;
}

/**
 * Toolbar for suppliers board.
 *
 * Displays title and action buttons:
 * - Add Supplier (always enabled)
 * - Edit Supplier (enabled by selection, demo session, or ADMIN role — gate is decided by parent)
 * - Delete Supplier (enabled by selection, demo session, or ADMIN role — gate is decided by parent)
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
        {t('suppliers:title')}
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          color="error"
          disabled={!deleteEnabled}
          onClick={onDeleteClick}
        >
          {t('suppliers:actions.delete')}
        </Button>
        <Button
          variant="outlined"
          color="primary"
          disabled={!editEnabled}
          onClick={onEditClick}
        >
          {t('suppliers:actions.edit')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onCreateClick}
        >
          {t('suppliers:actions.create')}
        </Button>
      </Stack>
    </Box>
  );
};
