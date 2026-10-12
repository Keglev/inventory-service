/**
 * @file AppToolbarActions.tsx
 * @module app/layout/AppToolbarActions
 *
 * @summary
 * Toolbar action buttons for the AppBar: notification bell, help, avatar menu.
 * Extracted from AppShell to isolate toolbar icon/button logic and styling.
 *
 * @enterprise
 * - Extracted from AppShell so AppBar chrome can evolve independently of layout orchestration.
 * - The avatar menu (AccountMenu) is the right-most action, where SAP Fiori, Microsoft 365
 *   and Jira put the profile (FW6 UX-1). It replaced the hamburger user menu: settings moved
 *   to the sidebar, the documentation links were already in the footer, and GitHub moved
 *   into the About dialog.
 * - No language or theme toggle here: preferences have one editor, the settings dialog (FW5 forks 1 and 2, SAP Fiori pattern).
 */

import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { HelpIconButton } from '../../features/help/components/HelpIconButton';
import AccountMenu from '../AccountMenu/AccountMenu';
import NotificationBell from './header/NotificationBell';

interface AppToolbarActionsProps {
  /** Opens the About dialog */
  onAboutOpen: () => void;

  /** Callback for logout action */
  onLogout: () => void;

  /** Help topic ID for context-sensitive help */
  helpTopic: string;
}

/**
 * Toolbar actions component.
 *
 * @param props - Component props
 * @returns the bell, the help button and the avatar menu, in that order
 */
export default function AppToolbarActions({
  onAboutOpen,
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

      {/* Avatar menu: profile, About, sign-out */}
      <AccountMenu onAboutOpen={onAboutOpen} onLogout={onLogout} />
    </Box>
  );
}
