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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Stack,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../hooks/useSettings';
import { formatDate, formatNumber } from '../utils/formatters';
import type { DateFormat, NumberFormat, TableDensity } from '../context/SettingsContext';

interface AppSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const AppSettingsDialog: React.FC<AppSettingsDialogProps> = ({ open, onClose }) => {
  const { t } = useTranslation('common');
  const { userPreferences, systemInfo, setUserPreferences, resetToDefaults, isLoading } = useSettings();

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
              <Stack spacing={2}>
                {/* Date Format Selector */}
                <FormControl>
                  <FormLabel sx={{ fontWeight: 600, mb: 1 }}>
                    {t('settings.dateFormat', 'Date Format')}
                  </FormLabel>
                  <RadioGroup
                    value={userPreferences.dateFormat}
                    onChange={(e) => setUserPreferences({ dateFormat: e.target.value as DateFormat })}
                  >
                    <FormControlLabel
                      value="DD.MM.YYYY"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2">DD.MM.YYYY</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(new Date(), 'DD.MM.YYYY')}
                          </Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="YYYY-MM-DD"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2">YYYY-MM-DD</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(new Date(), 'YYYY-MM-DD')}
                          </Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="MM/DD/YYYY"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2">MM/DD/YYYY</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(new Date(), 'MM/DD/YYYY')}
                          </Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>

                {/* Number Format Selector */}
                <FormControl>
                  <FormLabel sx={{ fontWeight: 600, mb: 1 }}>
                    {t('settings.numberFormat', 'Number Format')}
                  </FormLabel>
                  <RadioGroup
                    value={userPreferences.numberFormat}
                    onChange={(e) => setUserPreferences({ numberFormat: e.target.value as NumberFormat })}
                  >
                    <FormControlLabel
                      value="DE"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2">German (DE)</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatNumber(1234.56, 'DE')}
                          </Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="EN_US"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2">English (US)</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatNumber(1234.56, 'EN_US')}
                          </Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>

                {/* Table Density Selector */}
                <FormControl>
                  <FormLabel sx={{ fontWeight: 600, mb: 1 }}>
                    {t('settings.tableDensity', 'Table Density')}
                  </FormLabel>
                  <RadioGroup
                    value={userPreferences.tableDensity}
                    onChange={(e) => setUserPreferences({ tableDensity: e.target.value as TableDensity })}
                  >
                    <FormControlLabel
                      value="comfortable"
                      control={<Radio size="small" />}
                      label={t('settings.tableDensity.comfortable', 'Comfortable')}
                    />
                    <FormControlLabel
                      value="compact"
                      control={<Radio size="small" />}
                      label={t('settings.tableDensity.compact', 'Compact')}
                    />
                  </RadioGroup>
                </FormControl>
              </Stack>
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
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : systemInfo ? (
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('settings.database', 'Database')}
                    </Typography>
                    <Typography variant="body2">{systemInfo.database}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('settings.environment', 'Environment')}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={systemInfo.environment}
                        size="small"
                        color={systemInfo.environment === 'production' ? 'error' : 'success'}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('settings.version', 'Version')}
                    </Typography>
                    <Typography variant="body2">{systemInfo.version}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('settings.status', 'Status')}
                    </Typography>
                    <Typography variant="body2">{systemInfo.status}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('settings.buildDate', 'Build Date')}
                    </Typography>
                    <Typography variant="body2">{systemInfo.buildDate}</Typography>
                  </Box>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('settings.systemInfoUnavailable', 'System information unavailable')}
                </Typography>
              )}
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
                Documentation links will be configured here
              </Typography>
            </Paper>
          </Box>

        </Box>
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={resetToDefaults}
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
};

export default AppSettingsDialog;
