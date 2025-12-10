/**
 * @file DeleteSupplierDialog.tsx
 * @module pages/suppliers/DeleteSupplierDialog
 *
 * @summary
 * Enterprise-level dialog for deleting suppliers with business rule enforcement.
 * Implements confirmation workflow with referential integrity checks.
 *
 * @enterprise
 * - User experience: confirmation dialog prevents accidental deletion
 * - Business rules: prevents deletion of suppliers with linked items (stock > 0)
 * - Authorization: only ADMIN users can delete suppliers
 * - Type safety: fully typed with TypeScript
 * - Internationalization: complete i18n support for all user-facing text
 *
 * @constraints
 * 1. Only ADMIN role can delete (enforced by backend)
 * 2. Supplier cannot be deleted if it has linked inventory items with stock > 0
 * 3. Confirmation dialog displays warning: "are you sure do you want to delete this supplier? this cannot be reversed!"
 * 4. Delete operation returns 204 No Content on success
 * 5. Delete operation returns 409 Conflict if supplier has linked items
 * 6. Delete operation returns 403 Forbidden if not admin
 *
 * @workflow
 * 1. User clicks delete button in supplier list
 * 2. Dialog opens showing selected supplier name and confirmation prompt
 * 3. User clicks "Yes" to confirm deletion
 * 4. System sends DELETE request to backend
 * 5. On success: Show success toast, return to supplier list
 * 6. On 409 error (linked items): Show error message "Supplier cannot be deleted because it has linked items"
 * 7. On 403 error (not admin): Show error message "Only administrators can delete suppliers"
 * 8. User clicks "No" to cancel: Dialog closes, return to supplier list
 *
 * @backend_api
 * DELETE /api/suppliers/{id}
 * - Returns 204 No Content on success
 * - Returns 409 Conflict if supplier has linked items
 * - Returns 403 Forbidden if not ADMIN
 * - Returns 404 Not Found if supplier not found
 *
 * @refactored
 * Follows EditSupplierDialog pattern for consistency with multi-step workflows.
 */

import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stack,
  Paper,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/toast';
import { useAuth } from '../../hooks/useAuth';
import { useHelp } from '../../hooks/useHelp';
import { deleteSupplier, getSuppliersPage } from '../../api/suppliers';
import type { SupplierRow } from '../../api/suppliers/types';

/**
 * Props for DeleteSupplierDialog component
 */
interface DeleteSupplierDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Called when dialog is closed (user clicks No or operation complete) */
  onClose: () => void;
  /** Called after successful deletion to reload supplier list */
  onSupplierDeleted: () => void;
}

/**
 * DeleteSupplierDialog Component
 *
 * Displays a two-step deletion workflow:
 * 1. Confirmation dialog with supplier name and warning
 * 2. Success/error handling with appropriate messages
 */
export const DeleteSupplierDialog: React.FC<DeleteSupplierDialogProps> = ({
  open,
  onClose,
  onSupplierDeleted,
}) => {
  const { t } = useTranslation(['common', 'suppliers', 'errors']);
  const toast = useToast();
  const { user } = useAuth();
  const { openHelp } = useHelp();

  // ===== State =====
  const [selectedSupplier, setSelectedSupplier] = React.useState<SupplierRow | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SupplierRow[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);

  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ===== Search handler =====
  const handleSearchQueryChange = React.useCallback(async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await getSuppliersPage({ page: 1, pageSize: 10, q: query });
      setSearchResults(response.items);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // ===== Select supplier handler =====
  const handleSelectSupplier = React.useCallback((supplier: SupplierRow) => {
    setSelectedSupplier(supplier);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    setShowConfirmation(true);
  }, []);

  // ===== Delete handler =====
  const handleConfirmDelete = React.useCallback(async () => {
    if (!selectedSupplier) {
      setError(t('errors:supplier.selection.noSupplierSelected'));
      return;
    }

    // Check authorization
    if (user?.role !== 'ADMIN') {
      setError(t('errors:supplier.adminOnly'));
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await deleteSupplier(selectedSupplier.id);

      if (response.success) {
        toast(t('suppliers:actions.deleteSuccess', 'Supplier removed from database'), 'success');
        setSelectedSupplier(null);
        setShowConfirmation(false);
        onSupplierDeleted();
        onClose();
      } else {
        // Handle error from backend
        const errorMsg = response.error || 'Unknown error';

        // Map backend errors to i18n keys with more specific detection
        // 409 Conflict: supplier has linked items
        if (
          errorMsg.toLowerCase().includes('cannot delete supplier with linked items') ||
          errorMsg.toLowerCase().includes('linked items') ||
          errorMsg.toLowerCase().includes('cannot delete supplier') ||
          errorMsg.toLowerCase().includes('verknüpften') // German word for "linked"
        ) {
          setError(t('errors:supplier.businessRules.cannotDeleteWithItems', 
            'This supplier cannot be deleted because there are still items with stock > 0. Please reduce the stock to 0 before deleting the supplier.'));
        } 
        // 403 Forbidden: user is not admin
        else if (errorMsg.includes('403') || errorMsg.toLowerCase().includes('forbidden')) {
          setError(t('errors:supplier.adminOnly', 
            'Only administrators can perform this action.'));
        } 
        // 404 Not Found: supplier doesn't exist
        else if (errorMsg.includes('404') || errorMsg.toLowerCase().includes('not found')) {
          setError(t('errors:supplier.businessRules.supplierNotFound', 
            'Supplier not found'));
        } 
        // Generic delete error
        else {
          setError(t('errors:supplier.requests.failedToDeleteSupplier', 
            'Failed to delete supplier. Please try again.'));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(t('errors:supplier.requests.failedToDeleteSupplier', 
        'Failed to delete supplier. Please try again.'));
      console.error('Delete failed:', msg);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedSupplier, user?.role, t, toast, onSupplierDeleted, onClose]);

  // ===== Close dialog reset =====
  const handleDialogClose = React.useCallback(() => {
    if (!isDeleting) {
      setSelectedSupplier(null);
      setSearchQuery('');
      setSearchResults([]);
      setError(null);
      setShowConfirmation(false);
      onClose();
    }
  }, [isDeleting, onClose]);

  // ===== Render =====
  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1,
        },
      }}
    >
      {/* Search Step */}
      {!showConfirmation && (
        <>
          <DialogTitle sx={{ pt: 3.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                {t('suppliers:dialogs.delete.title', 'Delete Supplier')}
              </Box>
              <Tooltip title={t('actions.help', 'Help')}>
                <IconButton size="small" onClick={() => openHelp('suppliers.delete')}>
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('suppliers:dialogs.delete.search.hint', 'Search for the supplier you want to delete')}
            </Typography>

            {/* Search Input */}
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder={t('suppliers:search.placeholder', 'Enter supplier name (min 2 chars)...')}
                value={searchQuery}
                onChange={(e) => handleSearchQueryChange(e.target.value)}
                disabled={searchLoading}
                InputProps={{
                  endAdornment: searchLoading ? <CircularProgress size={20} /> : null,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fafafa',
                  },
                }}
              />
            </Box>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Paper
                variant="outlined"
                sx={{
                  maxHeight: 300,
                  overflow: 'auto',
                  backgroundColor: '#fafafa',
                }}
              >
                <Stack spacing={0}>
                  {searchResults.map((supplier) => (
                    <Box
                      key={supplier.id}
                      onClick={() => handleSelectSupplier(supplier)}
                      sx={{
                        p: 1.5,
                        cursor: 'pointer',
                        borderBottom: '1px solid #e0e0e0',
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          backgroundColor: '#e3f2fd',
                        },
                        '&:last-child': {
                          borderBottom: 'none',
                        },
                      }}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        {supplier.name}
                      </Typography>
                      {supplier.contactName && (
                        <Typography variant="caption" color="text.secondary">
                          {supplier.contactName}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}

            {searchQuery.trim().length >= 2 && searchResults.length === 0 && !searchLoading && (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                {t('suppliers:search.noResults', 'No suppliers found')}
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleDialogClose} disabled={searchLoading}>
              {t('common:actions.cancel', 'Cancel')}
            </Button>
          </DialogActions>
        </>
      )}

      {/* Confirmation Step */}
      {showConfirmation && selectedSupplier && (
        <>
          <DialogTitle sx={{ pt: 3.5 }}>
            {t('suppliers:dialogs.delete.confirmation.title', 'Confirm Deletion')}
          </DialogTitle>
          <DialogContent>
            {/* Warning Alert */}
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={500}>
                {t('suppliers:dialogs.delete.confirmation.warning', 'Are you sure do you want to delete this supplier? This cannot be reversed!')}
              </Typography>
            </Alert>

            {/* Selected Supplier Info */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: '#fafafa',
                mb: 2,
                borderColor: '#e0e0e0',
              }}
            >
              <Stack spacing={1}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('suppliers:table.name', 'Supplier Name')}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {selectedSupplier.name}
                  </Typography>
                </Box>

                {selectedSupplier.contactName && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('suppliers:table.contactName', 'Contact Name')}
                    </Typography>
                    <Typography variant="body2">
                      {selectedSupplier.contactName}
                    </Typography>
                  </Box>
                )}

                {selectedSupplier.email && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('suppliers:table.email', 'Email')}
                    </Typography>
                    <Typography variant="body2">
                      {selectedSupplier.email}
                    </Typography>
                  </Box>
                )}

                {selectedSupplier.phone && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('suppliers:table.phone', 'Phone')}
                    </Typography>
                    <Typography variant="body2">
                      {selectedSupplier.phone}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>

            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2">{error}</Typography>
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => {
                setShowConfirmation(false);
                setSelectedSupplier(null);
                setError(null);
              }}
              disabled={isDeleting}
            >
              {t('common:actions.no', 'No')}
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="contained"
              color="error"
              disabled={isDeleting}
              startIcon={isDeleting ? <CircularProgress size={20} /> : undefined}
            >
              {isDeleting
                ? t('common:deleting', 'Deleting...')
                : t('common:actions.yes', 'Yes')}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default DeleteSupplierDialog;
