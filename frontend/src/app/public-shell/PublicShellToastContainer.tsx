/**
 * @file PublicShellToastContainer.tsx
 * @module app/public-shell/PublicShellToastContainer
 * @summary Presentational Snackbar/Alert renderer for public-shell toasts;
 * owns no state — all toast state lives in usePublicShellToast.
 *
 * @enterprise
 * - Pure render layer: the toast behaviour lives in usePublicShellToast, which can be
 *   tested without mounting this Snackbar.
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
import { useTranslation } from 'react-i18next';

export interface PublicShellToastContainerProps {
  toast: Toast | null;
  onClose: () => void;
}

const PublicShellToastContainer: React.FC<PublicShellToastContainerProps> = ({ toast, onClose }) => {
  const { t } = useTranslation('common');
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
        closeText={t('shell.closeNotification')}
      >
        {toast?.msg}
      </Alert>
    </Snackbar>
  );
};

export default PublicShellToastContainer;
