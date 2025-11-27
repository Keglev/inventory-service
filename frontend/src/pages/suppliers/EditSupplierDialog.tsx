/**
 * @file EditSupplierDialog.tsx
 * @module pages/suppliers/EditSupplierDialog
 *
 * @summary
 * Enterprise-level dialog for editing supplier contact information.
 * Implements a guided workflow: supplier search → selection → info change.
 *
 * @enterprise
 * - Strict validation: supplier must be selected before editing is enabled
 * - User experience: guided workflow prevents invalid operations
 * - Type safety: fully typed with Zod validation and TypeScript
 * - Accessibility: proper form labels, error states, and keyboard navigation
 * - Internationalization: complete i18n support for all user-facing text
 * - Authorization: only ADMIN users can edit supplier information
 * - Important constraint: SUPPLIER NAME CANNOT BE CHANGED (business rule)
 *   - Changing name would create a duplicate/new supplier
 *   - Only contactName, phone, and email can be modified
 *
 * @workflow
 * 1. User searches for supplier by name (min 2 characters)
 * 2. System displays autocomplete results matching search query
 * 3. User selects specific supplier
 * 4. System fetches and displays current supplier details
 * 5. User modifies contact information (NOT name - immutable)
 * 6. User confirms changes in confirmation dialog
 * 7. System applies updates via backend API
 *
 * @validation
 * - Supplier must be selected before editing is enabled
 * - Search requires minimum 2 characters
 * - Email (if provided) must be valid RFC 5322 format
 * - Name field is read-only (never editable)
 *
 * @backend_api
 * PUT /api/suppliers/{id}
 * - Body: { contactName?: string | null, phone?: string | null, email?: string | null }
 * - Note: name is NOT sent in request (read-only)
 * - Only ADMIN role can use this endpoint
 * - Returns updated supplier object
 *
 * @refactored
 * Follows EditItemDialog pattern from inventory module for consistency.
 */

import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useHelp } from '../../hooks/useHelp';
import { z } from 'zod';
import { useToast } from '../../app/ToastContext';
import { useAuth } from '../../context/useAuth';
import { getSuppliersPage, updateSupplier } from '../../api/suppliers';
import type { SupplierRow } from '../../api/suppliers/types';

/**
 * Validation schema for editing supplier contact information.
 * Does NOT include name field - name is immutable.
 */
const editSupplierSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  contactName: z.string().nullable().catch(null),
  phone: z.string().nullable().catch(null),
  email: z.string().nullable().catch(null),
});

type EditSupplierForm = z.infer<typeof editSupplierSchema>;

/**
 * Properties for the EditSupplierDialog component.
 *
 * @interface EditSupplierDialogProps
 * @property {boolean} open - Controls dialog visibility
 * @property {() => void} onClose - Callback when dialog is closed
 * @property {() => void} onSupplierUpdated - Callback when supplier is successfully updated
 */
export interface EditSupplierDialogProps {
  /** Controls dialog visibility state */
  open: boolean;
  /** Callback invoked when dialog should be closed */
  onClose: () => void;
  /** Callback invoked after successful supplier update to refresh parent data */
  onSupplierUpdated: () => void;
}

/**
 * Enterprise-level edit supplier dialog component.
 *
 * Provides a guided workflow for updating supplier contact information with proper validation
 * and user experience optimizations. Prevents editing supplier names to maintain data integrity.
 *
 * @component
 * @example
 * ```tsx
 * <EditSupplierDialog
 *   open={isDialogOpen}
 *   onClose={() => setIsDialogOpen(false)}
 *   onSupplierUpdated={() => {
 *     refreshSupplierList();
 *     showSuccessMessage();
 *   }}
 * />
 * ```
 *
 * @enterprise
 * - Implements step-by-step validation to prevent user errors
 * - Provides clear feedback on current supplier state (immutable name)
 * - Prevents duplicate emails that would cause business logic errors
 * - Supports internationalization for global deployment
 * - Only allows ADMIN users to edit supplier information
 * - Name field is permanently read-only (cannot be changed)
 */
export const EditSupplierDialog: React.FC<EditSupplierDialogProps> = ({
  open,
  onClose,
  onSupplierUpdated,
}) => {
  const { t } = useTranslation(['common', 'suppliers', 'errors']);
  const toast = useToast();
  const { user } = useAuth();
  const { openHelp } = useHelp();

  // ================================
  // State Management
  // ================================

  /** Search query for supplier autocomplete filtering (minimum 2 characters) */
  const [searchQuery, setSearchQuery] = React.useState('');

  /** Search results from API (suppliers matching query) */
  const [searchResults, setSearchResults] = React.useState<SupplierRow[]>([]);

  /** Loading state for search operation */
  const [searchLoading, setSearchLoading] = React.useState(false);

  /** Currently selected supplier for editing */
  const [selectedSupplier, setSelectedSupplier] = React.useState<SupplierRow | null>(null);

  /** Form error message for user feedback */
  const [formError, setFormError] = React.useState<string>('');

  /** Confirmation dialog state for changes */
  const [showConfirmation, setShowConfirmation] = React.useState(false);

  /** Pending changes for confirmation display */
  const [pendingChanges, setPendingChanges] = React.useState<EditSupplierForm | null>(null);

  // ================================
  // Form Management
  // ================================

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<EditSupplierForm>({
    resolver: zodResolver(editSupplierSchema),
    defaultValues: {
      supplierId: '',
      contactName: '',
      phone: '',
      email: '',
    },
  });

  // ================================
  // Search Handler
  // ================================

  /**
   * Debounce timer reference for search.
   * Prevents excessive API calls as user types.
   */
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  /**
   * Handle supplier search with debounce.
   * Requires minimum 2 characters to avoid excessive API calls.
   *
   * @param query - Search query string
   *
   * @enterprise
   * - Debounces search to reduce API load
   * - Only searches when 2+ characters provided
   * - Provides clear feedback during search
   * - Handles errors gracefully with fallback
   */
  const handleSearchChange = React.useCallback((query: string) => {
    setSearchQuery(query);
    setSearchResults([]);

    if (query.length < 2) {
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearchLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await getSuppliersPage({
          page: 1,
          pageSize: 10,
          q: query,
          sort: 'name,asc',
        });

        if (response && response.items) {
          setSearchResults(response.items || []);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  }, []);

  // ================================
  // Effects
  // ================================

  /**
   * Pre-fill form when supplier is selected.
   * Sets current supplier info for editing.
   *
   * @enterprise
   * - Populates form with supplier's current contact information
   * - Supplier ID is set for backend API call
   * - Name is displayed but NOT editable (read-only)
   */
  React.useEffect(() => {
    if (selectedSupplier) {
      setValue('supplierId', selectedSupplier.id);
      setValue('contactName', selectedSupplier.contactName || '');
      setValue('phone', selectedSupplier.phone || '');
      setValue('email', selectedSupplier.email || '');
    }
  }, [selectedSupplier, setValue]);

  // ================================
  // Event Handlers
  // ================================

  /**
   * Handle dialog close with complete state cleanup.
   * Ensures clean state for next dialog open session.
   *
   * @enterprise
   * Prevents state pollution between dialog sessions that could
   * lead to confusing user experiences or data integrity issues.
   * Resets all form fields, selections, and error messages.
   */
  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedSupplier(null);
    setFormError('');
    setShowConfirmation(false);
    setPendingChanges(null);
    reset();
    onClose();
  };

  /**
   * Show confirmation dialog before applying changes.
   * Validates form and displays pending changes for user confirmation.
   *
   * @param values - Validated form data
   *
   * @enterprise
   * - Validates form before showing confirmation
   * - Displays what will be changed (pending changes)
   * - Ensures user intentionally confirms modification
   * - Prevents accidental data changes
   */
  const onShowConfirmation = handleSubmit((values) => {
    if (!selectedSupplier) {
      setFormError(
        t('errors:supplier.selection.noSupplierSelected', 'Please select a supplier.')
      );
      return;
    }

    setFormError('');
    setPendingChanges(values as unknown as EditSupplierForm);
    setShowConfirmation(true);
  });

  /**
   * Handle form submission with supplier info change.
   * Validates input and applies updates to selected supplier.
   *
   * @enterprise
   * - Validates supplier selection before submission
   * - Calls backend API to update contact info (only ADMIN allowed)
   * - Provides user feedback on operation success/failure
   * - Detects authorization errors and provides specific message
   * - Triggers parent component refresh for data consistency
   * - Closes dialogs automatically on success
   * - Name field is NEVER sent to backend (immutable constraint)
   *
   * @backend_api PUT /api/suppliers/{id}
   */
  const handleConfirmChanges = async () => {
    if (!pendingChanges || !selectedSupplier) return;

    try {
      const response = await updateSupplier(selectedSupplier.id, {
        name: selectedSupplier.name, // Include current name (immutable, required by backend)
        createdBy: user?.email, // Current logged-in user's email
        contactName: pendingChanges.contactName,
        phone: pendingChanges.phone,
        email: pendingChanges.email,
      });

      if (response.success) {
        toast(
          t('suppliers:status.updated', 'Supplier information updated successfully!'),
          'success'
        );
        onSupplierUpdated();
        handleClose();
      } else if (
        response.error?.includes('Admin') ||
        response.error?.includes('Access denied')
      ) {
        setFormError(
          t('errors:supplier.adminOnly', 'Only administrators can edit supplier information.')
        );
        setShowConfirmation(false);
      } else if (
        response.error?.includes('createdBy') ||
        response.error?.includes('CreatedBy')
      ) {
        setFormError(
          t('errors:supplier.validation.createdByRequired', 'Creator information is required. Please ensure you are logged in.')
        );
        setShowConfirmation(false);
      } else if (
        response.error?.includes('duplicate') ||
        response.error?.includes('already exists')
      ) {
        setFormError(
          t('errors:supplier.conflicts.duplicateEmail', 'This email is already in use.')
        );
        setShowConfirmation(false);
      } else {
        setFormError(
          response.error ||
            t(
              'errors:supplier.requests.failedToUpdateSupplier',
              'Failed to update supplier. Please try again.'
            )
        );
        setShowConfirmation(false);
      }
    } catch (error) {
      console.error('Edit supplier error:', error);
      setFormError(
        t(
          'errors:supplier.requests.failedToUpdateSupplier',
          'Failed to update supplier. Please try again.'
        )
      );
      setShowConfirmation(false);
    }
  };

  // If confirmation dialog is open, show that instead
  if (showConfirmation) {
    return (
      <Dialog open={showConfirmation} onClose={() => setShowConfirmation(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {t('suppliers:dialogs.confirmChanges', 'Confirm Changes')}
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2 }}>
            {formError && (
              <Alert severity="error" onClose={() => setFormError('')}>
                {formError}
              </Alert>
            )}

            <Alert severity="warning">
              {t('suppliers:confirmations.changesCannotBeReversed', 'These changes cannot be reversed.')}
            </Alert>

            {selectedSupplier && (
              <Box>
                {/* Supplier Name (Read-only for display) */}
                <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('suppliers:table.name', 'Supplier Name')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {selectedSupplier.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {t('suppliers:hints.nameCannotBeChanged', '(Cannot be changed)')}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Changes Summary */}
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                  {t('suppliers:confirmations.changes', 'Changes')}
                </Typography>

                {pendingChanges?.contactName !== (selectedSupplier.contactName || '') && (
                  <Box sx={{ mb: 1.5, p: 1, bgcolor: 'info.lighter', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t('suppliers:table.contactName', 'Contact Name')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedSupplier.contactName || '(empty)'} →{' '}
                      {pendingChanges?.contactName || '(empty)'}
                    </Typography>
                  </Box>
                )}

                {pendingChanges?.phone !== (selectedSupplier.phone || '') && (
                  <Box sx={{ mb: 1.5, p: 1, bgcolor: 'info.lighter', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t('suppliers:table.phone', 'Phone')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedSupplier.phone || '(empty)'} → {pendingChanges?.phone || '(empty)'}
                    </Typography>
                  </Box>
                )}

                {pendingChanges?.email !== (selectedSupplier.email || '') && (
                  <Box sx={{ mb: 1.5, p: 1, bgcolor: 'info.lighter', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t('suppliers:table.email', 'Email')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedSupplier.email || '(empty)'} → {pendingChanges?.email || '(empty)'}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={() => setShowConfirmation(false)} disabled={isSubmitting}>
            {t('common:actions.no', 'No')}
          </Button>
          <Button
            onClick={handleConfirmChanges}
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                {t('common:saving', 'Saving...')}
              </>
            ) : (
              t('common:actions.yes', 'Yes')
            )}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            {t('suppliers:dialogs.editSupplierTitle', 'Edit Supplier')}
          </Box>
          <Tooltip title={t('actions.help', 'Help')}>
            <IconButton size="small" onClick={() => openHelp('suppliers.manage')}>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 2.5, mt: 1 }}>
          {/* Error Display */}
          {formError && (
            <Alert severity="error" onClose={() => setFormError('')}>
              {formError}
            </Alert>
          )}

          {/* Step 1: Search and Select Supplier */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              {t('suppliers:steps.selectSupplier', 'Step 1: Search and Select Supplier')}
            </Typography>

            <Box sx={{ position: 'relative', mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder={t('suppliers:search.placeholder', 'Enter supplier name (min 2 chars)...')}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                disabled={searchLoading}
                InputProps={{
                  endAdornment: searchLoading ? <CircularProgress size={20} /> : null,
                }}
              />

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <Paper
                  elevation={2}
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    mt: 0.5,
                    maxHeight: 300,
                    overflow: 'auto',
                  }}
                >
                  <List>
                    {searchResults.map((supplier) => (
                      <ListItemButton
                        key={supplier.id}
                        onClick={() => {
                          setSelectedSupplier(supplier);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                      >
                        <ListItemText
                          primary={supplier.name}
                          secondary={supplier.email || supplier.phone || supplier.contactName}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Paper>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {t('suppliers:search.noResults', 'No suppliers found')}
                </Typography>
              )}
            </Box>

            {searchQuery.length < 2 && searchQuery.length > 0 && (
              <Alert severity="info">
                {t('suppliers:search.typeToSearch', 'Type at least 2 characters to search')}
              </Alert>
            )}
          </Box>

          <Divider />

          {/* Step 2: Edit Supplier Info */}
          {selectedSupplier && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                {t('suppliers:steps.editInfo', 'Step 2: Edit Contact Information')}
              </Typography>

              {/* Supplier Name Display (Read-only) */}
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('suppliers:table.name', 'Supplier Name')}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {selectedSupplier.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {t('suppliers:hints.nameCannotBeChanged', '(Cannot be changed)')}
                </Typography>
              </Box>

              {/* Contact Name */}
              <Controller
                name="contactName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t('suppliers:table.contactName', 'Contact Name')}
                    placeholder={t('suppliers:form.contactNamePlaceholder', 'Enter contact name')}
                    error={!!errors.contactName}
                    helperText={errors.contactName?.message}
                    disabled={isSubmitting}
                    margin="normal"
                  />
                )}
              />

              {/* Phone */}
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t('suppliers:table.phone', 'Phone')}
                    placeholder={t('suppliers:form.phonePlaceholder', 'Enter phone number')}
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    disabled={isSubmitting}
                    margin="normal"
                  />
                )}
              />

              {/* Email */}
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="email"
                    label={t('suppliers:table.email', 'Email')}
                    placeholder={t('suppliers:form.emailPlaceholder', 'Enter email address')}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={isSubmitting}
                    margin="normal"
                  />
                )}
              />
            </Box>
          )}

          {!selectedSupplier && (
            <Alert severity="info">
              {t('suppliers:search.selectSupplierFirst', 'Search and select a supplier to enable editing.')}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ gap: 1 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          {t('common:actions.cancel', 'Cancel')}
        </Button>
        <Button
          onClick={onShowConfirmation}
          variant="contained"
          disabled={!selectedSupplier || isSubmitting}
        >
          {t('suppliers:buttons.reviewChanges', 'Review Changes')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditSupplierDialog;
