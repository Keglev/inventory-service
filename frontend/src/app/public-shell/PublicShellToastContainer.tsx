/**
 * @file PublicShellToastContainer.tsx
 * @module PublicShellToastContainer
 * @summary Presentational Snackbar/Alert renderer for public-shell toasts;
 * owns no state — all toast state lives in usePublicShellToast.
 *
 * @enterprise
 * - Pure render layer so toast behaviour can be tested without mounting Snackbar.
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
import type { Toast } from './hooks/usePublicShellToast';

interface PublicShellToastContainerProps {
  toast: Toast | null;
  onClose: () => void;
}

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
      {/* BUCKET: hardcoded closeText bypasses t() (CB-APP10) */}
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
