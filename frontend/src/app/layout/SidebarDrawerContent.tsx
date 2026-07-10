/**
 * @file SidebarDrawerContent.tsx
 * @module app/layout/SidebarDrawerContent
 *
 * @summary
 * The shared content tree for the sidebar's mobile and desktop Drawer variants:
 * branding header, navigation list, and a footer with profile, environment, and
 * action controls. Extracted from AppSidebar so both Drawer variants render one
 * source of truth (ST-APP2).
 */

import { Box, Toolbar, Typography, Divider } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getHelpTopicForRoute } from './navConfig';
import type { SupportedLocale } from '../../theme';
import { default as SidebarNavList } from './sidebar/SidebarNavList';
import { default as SidebarUserProfile } from './sidebar/SidebarUserProfile';
import { default as SidebarEnvironment } from './sidebar/SidebarEnvironment';
import { default as SidebarActions } from './sidebar/SidebarActions';

interface SidebarDrawerContentProps {
  /** Current theme mode */
  themeMode: 'light' | 'dark';
  /** Callback when theme mode changes */
  onThemeModeChange: (mode: 'light' | 'dark') => void;
  /** Current locale */
  locale: SupportedLocale;
  /** Callback when locale changes */
  onLocaleChange: (locale: SupportedLocale) => void;
  /** Callback for logout */
  onLogout: () => void;
  /** Callback to open settings dialog */
  onSettingsOpen: () => void;
  /** Current user information */
  user?: {
    fullName?: string;
    role?: string;
  };
}

/**
 * Sidebar drawer content shared by the mobile (temporary) and desktop
 * (permanent) Drawer variants.
 *
 * helpTopic is derived here from the route so the sidebar's help button works
 * independently of AppShell.
 */
export function SidebarDrawerContent({
  themeMode,
  onThemeModeChange,
  locale,
  onLocaleChange,
  onLogout,
  onSettingsOpen,
  user,
}: SidebarDrawerContentProps) {
  const { t } = useTranslation(['common']);
  const location = useLocation();
  const helpTopic = getHelpTopicForRoute(location.pathname);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Drawer Header - App Title */}
      <Toolbar>
        <Typography variant="subtitle1" fontWeight={700}>
          {t('app.branding', 'Smart Supply Pro')}
        </Typography>
      </Toolbar>
      <Divider />

      {/* Navigation Items */}
      <SidebarNavList onLogout={onLogout} />

      {/* Footer: User Info & Settings Section */}
      <Box sx={{ mt: 'auto' }}>
        <Divider />
        <Box
          sx={{
            p: 1.25,
            pb: 0.75,
            mt: 0.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.75,
          }}
        >
          {/* User Profile Info */}
          <SidebarUserProfile user={user} />

          {/* Environment & Version */}
          <SidebarEnvironment />

          {/* Settings Actions Row: Theme, Language, Settings, Help */}
          <SidebarActions
            themeMode={themeMode}
            onThemeModeChange={onThemeModeChange}
            locale={locale}
            onLocaleChange={onLocaleChange}
            onSettingsOpen={onSettingsOpen}
            helpTopic={helpTopic}
          />
        </Box>
      </Box>
    </Box>
  );
}
