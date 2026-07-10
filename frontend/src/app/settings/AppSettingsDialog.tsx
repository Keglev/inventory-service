/**
 * @file AppSettingsDialog.tsx
 * @module app/settings/AppSettingsDialog
 *
 * @summary
 * Thin dialog container for application settings.
 * Manages dialog open/close state and delegates form rendering to AppSettingsForm.
 *
 * @enterprise
 * - Thin dialog shell: owns only open/close state and layout; all form logic lives in AppSettingsForm + useAppSettingsForm
 * - Entry point for the settings flow; keeps the dialog surface isolated so it can be opened from any trigger
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
import { HelpIconButton } from '../../features/help/components/HelpIconButton';
import { useAppSettingsForm } from './hooks/useAppSettingsForm';

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
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            backgroundImage: 'none',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: '1.25rem',
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {t('settings.title')}
        <HelpIconButton topicId="settings.preferences" tooltip={t('actions.help')} />
      </DialogTitle>

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

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleResetDefaults}
          variant="outlined"
          color="primary"
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {t('settings.resetToDefaults')}
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          startIcon={<CloseIcon />}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {t('actions.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
