/**
 * @file InventoryDialogBase.tsx
 * @module pages/inventory/components/InventoryDialogBase
 *
 * @summary
 * Base dialog component for inventory operations (quantity adjustments, price changes).
 * Provides consistent layout, styling, and behavior across all inventory dialogs.
 *
 * @enterprise
 * - Consistent UX: standardized dialog appearance and behavior
 * - Accessibility: proper dialog structure, focus management, and keyboard navigation
 * - Internationalization: built-in i18n support for common elements
 * - Responsive: adapts to different screen sizes and devices
 * - Type safety: fully typed props and children components
 */

import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Props for the base inventory dialog component.
 * Provides flexible configuration while maintaining consistency.
 */
export interface InventoryDialogBaseProps {
  /** Whether the dialog is open */
  open: boolean;
  
  /** Function to close the dialog */
  onClose: () => void;
  
  /** Dialog title (already translated) */
  title: string;
  
  /** Dialog content - typically form fields */
  children: React.ReactNode;
  
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  
  /** Whether the submit button should be disabled */
  submitDisabled?: boolean;
  
  /** Custom submit button text (optional, defaults to "Save") */
  submitText?: string;
  
  /** Custom cancel button text (optional, defaults to "Cancel") */
  cancelText?: string;
  
  /** Function to handle form submission */
  onSubmit: () => void;
  
  /** Maximum width of the dialog */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Whether the dialog should be full width */
  fullWidth?: boolean;
}

/**
 * Base dialog component for inventory operations.
 * Standardizes the layout and behavior of quantity and price dialogs.
 * 
 * @enterprise
 * This component ensures consistent user experience across all inventory operations
 * while allowing customization of content and behavior through props.
 */
export const InventoryDialogBase: React.FC<InventoryDialogBaseProps> = ({
  open,
  onClose,
  title,
  children,
  isSubmitting = false,
  submitDisabled = false,
  submitText,
  cancelText,
  onSubmit,
  maxWidth = 'md',
  fullWidth = true,
}) => {
  const { t } = useTranslation();

  // Default button text with translation fallbacks
  const defaultSubmitText = submitText || t('common.save', 'Save');
  const defaultCancelText = cancelText || t('common.cancel', 'Cancel');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      aria-labelledby="inventory-dialog-title"
    >
      <DialogTitle id="inventory-dialog-title">
        {title}
      </DialogTitle>
      
      <DialogContent>
        {children}
      </DialogContent>
      
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={isSubmitting}
          color="secondary"
        >
          {defaultCancelText}
        </Button>
        
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={submitDisabled || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
        >
          {defaultSubmitText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};