/**
 * @file SidebarActions.tsx
 * @module app/layout/sidebar/SidebarActions
 *
 * @summary
 * Sidebar footer action buttons (theme, language, settings, help).
 * Provides quick access to settings and theme/language toggles.
 *
 * @enterprise
 * - Sidebar footer repeats the toolbar's language and theme toggles as a redundant
 *   convenience surface; the duplication is deliberate, not compensation for any
 *   hidden toolbar control (only HealthBadge is xs-hidden).
 * - nextThemeMode and nextLocale are pre-computed outside JSX to avoid repeating the ternary across icon, onClick, and aria label.
 * - Settings and help are placed here rather than inline in the sidebar because this footer row is the natural endpoint for "leave current workflow" actions.
 * - Help button is placed below the main action row to give it visual separation from the denser icon row above.
 */

import {
  Box,
  Tooltip,
  IconButton,
} from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsIcon from '@mui/icons-material/Settings';
import { useTranslation } from 'react-i18next';
import { HelpIconButton } from '../../../features/help';
import type { SupportedLocale } from '../../../theme';

const DE_FLAG = '/flags/de.svg';
const US_FLAG = '/flags/us.svg';

interface SidebarActionsProps {
  /** Current theme mode */
  themeMode: 'light' | 'dark';

  /** Callback when theme mode changes */
  onThemeModeChange: (mode: 'light' | 'dark') => void;

  /** Current locale */
  locale: SupportedLocale;

  /** Callback when locale changes */
  onLocaleChange: (locale: SupportedLocale) => void;

  /** Callback to open settings dialog */
  onSettingsOpen: () => void;

  /** Help topic ID for context-sensitive help */
  helpTopic: string;
}

/**
 * Sidebar action buttons component.
 *
 * Renders theme toggle, language toggle, settings button, and help button
 * in a horizontal flex layout for the sidebar footer.
 *
 * @param props - Component props
 * @returns JSX element rendering action buttons row
 *
 * @example
 * ```tsx
 * <SidebarActions
 *   themeMode="light"
 *   onThemeModeChange={toggleTheme}
 *   locale="en"
 *   onLocaleChange={toggleLanguage}
 *   onSettingsOpen={openSettings}
 *   helpTopic="Dashboard"
 * />
 * ```
 */
export default function SidebarActions({
  themeMode,
  onThemeModeChange,
  locale,
  onLocaleChange,
  onSettingsOpen,
  helpTopic,
}: SidebarActionsProps) {
  const { t } = useTranslation(['common']);
  const nextThemeMode = themeMode === 'light' ? 'dark' : 'light';
  const nextLocale = locale === 'de' ? 'en' : 'de';

  return (
    <>
      {/* Main Action Buttons Row: Theme, Language, Settings, Help */}
      <Box
        sx={{
          display: 'flex',
          gap: 0.75,
          justifyContent: 'space-around',
          alignItems: 'center',
          mt: 0.5,
        }}
      >
        {/* Theme Toggle */}
        {/* BUCKET: hardcoded string bypasses i18n — route through t() (CB-APP6) */}
        <Tooltip title={themeMode === 'light' ? 'Dark mode' : 'Light mode'}>
          <IconButton
            size="small"
            onClick={() => onThemeModeChange(nextThemeMode)}
            sx={{
              color: themeMode === 'light' ? 'warning.main' : 'info.main',
              transition: 'color 0.3s ease',
            }}
          >
            {themeMode === 'light' ? (
              <LightModeIcon fontSize="small" />
            ) : (
              <DarkModeIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>

        {/* Language Toggle */}
        <Tooltip title={t('actions.toggleLanguage', 'Toggle language')}>
          <IconButton size="small" onClick={() => onLocaleChange(nextLocale)}>
            <img
              src={locale === 'de' ? DE_FLAG : US_FLAG}
              alt={locale === 'de' ? 'Deutsch' : 'English'}
              width={16}
              height={16}
            />
          </IconButton>
        </Tooltip>

        {/* Settings Button */}
        <Tooltip title={t('actions.settings', 'Settings')}>
          <IconButton size="small" onClick={onSettingsOpen}>
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Help Button (centered below main actions) */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.75, mb: 0.5 }}>
        <HelpIconButton topicId={helpTopic} tooltip={t('actions.help', 'Help')} />
      </Box>
    </>
  );
}
