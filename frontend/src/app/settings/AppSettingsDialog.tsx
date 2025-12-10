/**
 * @file AppSettingsDialog.tsx
 * @module app/settings/AppSettingsDialog
 *
 * @summary
 * Thin dialog container for application settings.
 * Manages dialog open/close state and delegates form rendering to AppSettingsForm.
 *
 * @enterprise
 * - Thin container: dialog state and layout only
 * - Delegates form orchestration to AppSettingsForm
 * - Uses custom hook (useAppSettingsForm) for state management
 * - Consistent MUI dialog styling and animations
 * - Responsive design with mobile full-width support
 * - Full TypeDoc coverage for dialog orchestration
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import AppSettingsForm from './AppSettingsForm';
import { useAppSettingsForm } from './hooks';

interface AppSettingsDialogProps {
  /** Whether dialog is open */
  open: boolean;

  /** Callback when dialog should close */
  onClose: () => void;
}

/**
 * Application settings dialog component.
 *
 * Thin container managing dialog open/close state. Delegates form orchestration
 * and state management to AppSettingsForm and useAppSettingsForm hook.
 *
 * Integrates all settings sections through AppSettingsForm component.
 *
 * @param props - Component props
 * @returns JSX element rendering settings dialog
 *
 * @example
 * ```tsx
 * const [settingsOpen, setSettingsOpen] = useState(false);
 * <AppSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
 * ```
 */
export default function AppSettingsDialog({
  open,
  onClose,
}: AppSettingsDialogProps) {
  const { t } = useTranslation(['common']);
  const {
    formState,
    systemInfo,
    isLoading,
    handleDateFormatChange,
    handleNumberFormatChange,
    handleTableDensityChange,
    handleResetDefaults,
  } = useAppSettingsForm();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundImage: 'none',
        },
      }}
    >
      {/* Dialog Title */}
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem', pb: 1 }}>
        {t('settings.title', 'Settings')}
      </DialogTitle>

      {/* Dialog Content - Settings Form */}
      <DialogContent dividers sx={{ py: 3 }}>
        <AppSettingsForm
          dateFormat={formState.dateFormat}
          onDateFormatChange={handleDateFormatChange}
          numberFormat={formState.numberFormat}
          onNumberFormatChange={handleNumberFormatChange}
          tableDensity={formState.tableDensity}
          onTableDensityChange={handleTableDensityChange}
          systemInfo={systemInfo}
          isLoading={isLoading}
        />
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleResetDefaults}
          variant="outlined"
          color="primary"
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {t('settings.resetToDefaults', 'Reset to Defaults')}
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          startIcon={<CloseIcon />}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {t('actions.close', 'Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
