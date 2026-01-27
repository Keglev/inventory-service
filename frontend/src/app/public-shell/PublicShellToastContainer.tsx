/**
 * @file PublicShellToastContainer.tsx
 * @description
 * Toast notification container for public shell.
 * Displays Snackbar with Alert based on toast state.
 *
 * @enterprise
 * - Fixed position at bottom-right (standard notification placement)
 * - Auto-hide after 2.5 seconds
 * - Supports success, info, warning, error severity levels
 * - Filled variant Alert for better visibility
 *
 * @example
 * ```tsx
 * <PublicShellToastContainer
 *   toast={toast}
 *   onClose={() => hideToast()}
 * />
 * ```
 */
import * as React from 'react';
import { Snackbar, Alert } from '@mui/material';
import type { SnackbarCloseReason } from '@mui/material/Snackbar';
import type { Toast } from './hooks';

interface PublicShellToastContainerProps {
  /** Toast state object or null if not visible */
  toast: Toast | null;
  /** Callback when toast should close */
  onClose: () => void;
}

/**
 * PublicShellToastContainer component
 * @param toast - Toast state
 * @param onClose - Close callback
 * @returns Snackbar with Alert notification
 */
const PublicShellToastContainer: React.FC<PublicShellToastContainerProps> = ({ toast, onClose }) => {
  const handleClose = React.useCallback(
    (_event: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
      if (reason === 'clickaway') {
        return;
      }

      onClose();
    },
    [onClose],
  );

  return (
    <Snackbar
      open={!!toast?.open}
      onClose={handleClose}
      autoHideDuration={2500}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        severity={toast?.severity || 'success'}
        elevation={1}
        variant="filled"
        onClose={handleClose}
        closeText="Close notification"
      >
        {toast?.msg}
      </Alert>
    </Snackbar>
  );
};

export default PublicShellToastContainer;
