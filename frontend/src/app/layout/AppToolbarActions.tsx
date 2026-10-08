/**
 * @file AppToolbarActions.tsx
 * @module app/layout/AppToolbarActions
 *
 * @summary
 * Toolbar action buttons for the AppBar: notification bell, help, user menu.
 * Extracted from AppShell to isolate toolbar icon/button logic and styling.
 *
 * @enterprise
 * - Extracted from AppShell so AppBar chrome can evolve independently of layout orchestration.
 * - This is the mount point for HamburgerMenu (the user menu); it passes the settings and logout callbacks down but does not own the menu's state.
 * - No language or theme toggle here: preferences have one editor, the settings dialog (FW5 forks 1 and 2, SAP Fiori pattern).
 */

import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { HelpIconButton } from '../../features/help/components/HelpIconButton';
import { default as HamburgerMenu } from '../HamburgerMenu/HamburgerMenu';
import NotificationBell from './header/NotificationBell';

interface AppToolbarActionsProps {
  /** Opens the settings dialog */
  onSettingsOpen: () => void;

  /** Callback for logout action */
  onLogout: () => void;

  /** Help topic ID for context-sensitive help */
  helpTopic: string;
}

/**
 * Toolbar actions component.
 *
 * Renders the notification bell, the help button and the user menu in the AppBar.
 *
 * @param props - Component props
 * @returns JSX element rendering toolbar action buttons
 */
export default function AppToolbarActions({
  onSettingsOpen,
  onLogout,
  helpTopic,
}: AppToolbarActionsProps) {
  const { t } = useTranslation(['common']);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {/* Low-stock notifications (FW5 fork 7) */}
      <NotificationBell />

      {/* Help Icon Button */}
      <HelpIconButton
        topicId={helpTopic}
        tooltip={t('actions.help')}
      />

      {/* User menu (profile, settings, help, system info, logout) */}
      <HamburgerMenu
        onSettingsOpen={onSettingsOpen}
        onLogout={onLogout}
      />
    </Box>
  );
}
