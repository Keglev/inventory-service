/**
 * @file AppToolbarActions.tsx
 * @module app/layout/AppToolbarActions
 *
 * @summary
 * Toolbar action buttons for the AppBar: notification bell, help, avatar menu.
 *
 * @enterprise
 * - Kept apart from AppShell so AppBar chrome can evolve independently of layout orchestration.
 * - The avatar menu (AccountMenu) is the right-most action, where SAP Fiori, Microsoft 365
 *   and Jira put the profile (frontend ADR-0015). Settings live in the sidebar, the
 *   documentation links in the footer, the repository link in the About dialog.
 * - No language or theme toggle here: preferences have one editor, the settings dialog (SAP Fiori pattern).
 */

import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { HelpIconButton } from '../../features/help/components/HelpIconButton';
import AccountMenu from '../AccountMenu/AccountMenu';
import NotificationBell from './header/NotificationBell';

export interface AppToolbarActionsProps {
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
      {/* Low-stock notifications */}
      <NotificationBell />

      <HelpIconButton
        topicId={helpTopic}
        tooltip={t('actions.help')}
        color="inherit"
      />

      {/* Avatar menu: profile, About, sign-out */}
      <AccountMenu onAboutOpen={onAboutOpen} onLogout={onLogout} />
    </Box>
  );
}
