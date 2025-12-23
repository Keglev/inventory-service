/**
 * @file AppToolbarActions.tsx
 * @module app/layout/AppToolbarActions
 *
 * @summary
 * Toolbar action buttons for the AppBar: language toggle, theme toggle, help, hamburger menu.
 * Extracted from AppShell to isolate toolbar icon/button logic and styling.
 *
 * @enterprise
 * - Clean separation of toolbar chrome from layout orchestration
 * - Reusable theme/locale callbacks with optional toast notifications
 * - Responsive visibility (some hidden on mobile)
 * - Full TypeDoc coverage for internationalization and theme integration
 */

import { Box, IconButton, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { HelpIconButton } from '../../features/help';
import { HamburgerMenu } from '../HamburgerMenu';
import type { SupportedLocale } from '../../theme';

const DE_FLAG = '/flags/de.svg';
const US_FLAG = '/flags/us.svg';

interface AppToolbarActionsProps {
  /** Current theme mode (light or dark) */
  themeMode: 'light' | 'dark';

  /** Callback when theme mode changes */
  onThemeModeChange: (mode: 'light' | 'dark') => void;

  /** Current locale setting (de or en) */
  locale: SupportedLocale;

  /** Callback when locale changes */
  onLocaleChange: (locale: SupportedLocale) => void;

  /** Callback for logout action */
  onLogout: () => void;

  /** Help topic ID for context-sensitive help */
  helpTopic: string;
}

/**
 * Toolbar actions component.
 *
 * Renders language toggle, help button, and hamburger menu in the AppBar.
 * Handles user preferences and navigation callbacks.
 *
 * @param props - Component props
 * @returns JSX element rendering toolbar action buttons
 */
export default function AppToolbarActions({
  themeMode,
  onThemeModeChange,
  locale,
  onLocaleChange,
  onLogout,
  helpTopic,
}: AppToolbarActionsProps) {
  const { t } = useTranslation(['common']);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {/* Language Flag Toggle (hidden on xs, shown on sm+) */}
      <Tooltip title={t('actions.toggleLanguage', 'Toggle language')}>
        <IconButton size="small" onClick={() => onLocaleChange(locale === 'de' ? 'en' : 'de')} sx={{ mr: 1 }}>
          <img
            src={locale === 'de' ? DE_FLAG : US_FLAG}
            alt={locale === 'de' ? 'Deutsch' : 'English'}
            width={16}
            height={16}
          />
        </IconButton>
      </Tooltip>

      {/* Help Icon Button */}
      <HelpIconButton
        topicId={helpTopic}
        tooltip={t('actions.help', 'Help')}
      />

      {/* Hamburger Menu (Profile, Appearance, Language, Notifications, Help, System Info, Logout) */}
      <HamburgerMenu
        themeMode={themeMode}
        onThemeModeChange={onThemeModeChange}
        locale={locale}
        onLocaleChange={onLocaleChange}
        onLogout={onLogout}
      />
    </Box>
  );
}
