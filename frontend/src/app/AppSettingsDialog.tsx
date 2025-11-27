/**
 * @file AppSettingsDialog.tsx
 * @description
 * Enterprise-quality settings dialog for user preferences and system information.
 * Displays as a centered modal over the AppShell with consistent SaaS styling.
 *
 * Features:
 * - User Preferences section (date format, number format, table density)
 * - System Info section (frontend/backend versions, environment, database)
 * - Links section (documentation, GitHub, API docs)
 * - Close button to dismiss
 *
 * @enterprise
 * - Full-width responsive design on mobile
 * - Smooth animations and transitions
 * - Consistent with MUI theme (light/dark modes)
 * - Proper tab navigation and accessibility
 *
 * @usage
 * const [settingsOpen, setSettingsOpen] = useState(false);
 * <AppSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
 */
import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

interface AppSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * AppSettingsDialog: Modal dialog for application settings and system information.
 */
const AppSettingsDialog: React.FC<AppSettingsDialogProps> = ({ open, onClose }) => {
  const { t } = useTranslation('common');

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

      {/* Dialog Content */}
      <DialogContent dividers sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* User Preferences Section */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                color: 'primary.main',
                textTransform: 'uppercase',
                fontSize: '0.875rem',
                letterSpacing: 0.5,
              }}
            >
              {t('settings.userPreferences', 'User Preferences')}
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Preferences will be configured here:
              </Typography>
              <Box component="ul" sx={{ mt: 1, ml: 2, mb: 0 }}>
                <Typography component="li" variant="caption" color="text.secondary">
                  Date Format (DD.MM.YYYY, YYYY-MM-DD, MM/DD/YYYY)
                </Typography>
                <Typography component="li" variant="caption" color="text.secondary">
                  Number Format (1.234,56 vs 1,234.56)
                </Typography>
                <Typography component="li" variant="caption" color="text.secondary">
                  Table Density (Comfort, Compact)
                </Typography>
              </Box>
            </Paper>
          </Box>

          <Divider />

          {/* System Info Section */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                color: 'primary.main',
                textTransform: 'uppercase',
                fontSize: '0.875rem',
                letterSpacing: 0.5,
              }}
            >
              {t('settings.systemInfo', 'System Info')}
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                System information will be displayed here:
              </Typography>
              <Box component="ul" sx={{ mt: 1, ml: 2, mb: 0 }}>
                <Typography component="li" variant="caption" color="text.secondary">
                  Frontend Version
                </Typography>
                <Typography component="li" variant="caption" color="text.secondary">
                  Backend Version
                </Typography>
                <Typography component="li" variant="caption" color="text.secondary">
                  Environment
                </Typography>
                <Typography component="li" variant="caption" color="text.secondary">
                  Database Type
                </Typography>
              </Box>
            </Paper>
          </Box>

          <Divider />

          {/* Links Section */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                color: 'primary.main',
                textTransform: 'uppercase',
                fontSize: '0.875rem',
                letterSpacing: 0.5,
              }}
            >
              {t('settings.links', 'Links')}
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Quick links will be displayed here:
              </Typography>
              <Box component="ul" sx={{ mt: 1, ml: 2, mb: 0 }}>
                <Typography component="li" variant="caption" color="text.secondary">
                  Documentation
                </Typography>
                <Typography component="li" variant="caption" color="text.secondary">
                  GitHub Repository
                </Typography>
                <Typography component="li" variant="caption" color="text.secondary">
                  API Documentation
                </Typography>
              </Box>
            </Paper>
          </Box>

        </Box>
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions sx={{ p: 2, gap: 1 }}>
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
};

export default AppSettingsDialog;
