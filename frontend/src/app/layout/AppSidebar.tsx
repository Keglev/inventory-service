/**
 * @file AppSidebar.tsx
 * @module app/layout/AppSidebar
 *
 * @summary
 * Left sidebar navigation drawer with profile info, settings, and logout.
 * Thin orchestrator delegating to focused sub-components for navigation, profile, and actions.
 *
 * @enterprise
 * - Two Drawer variants (temporary on mobile, permanent on desktop) share one content tree via `drawerContent`, avoiding JSX duplication for each breakpoint.
 * - Delegates all content areas to sub-components (SidebarNavList, SidebarUserProfile, SidebarEnvironment, SidebarActions) so this file only controls drawer chrome.
 * - Receives state via props from AppShell, which is the single state owner; sidebar never reads localStorage directly.
 * - helpTopic is re-derived from location here (not forwarded from AppShell) because the sidebar needs it independently for its own help button.
 */
// BUCKET: file exceeds ~150-line guideline — review for extract/split (ST-APP2)

import {
  Box,
  Drawer,
  Toolbar,
  Typography,
  Divider,
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getHelpTopicForRoute } from './navConfig';
import type { SupportedLocale } from '../../theme';
import {
  SidebarNavList,
  SidebarUserProfile,
  SidebarEnvironment,
  SidebarActions,
} from './sidebar';

const drawerWidth = 248;

interface AppSidebarProps {
  /** Whether drawer is open on mobile */
  mobileOpen: boolean;

  /** Callback to close drawer on mobile */
  onMobileClose: () => void;

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
 * Application sidebar component.
 *
 * Thin orchestrator that delegates rendering to focused sub-components.
 * Renders responsive drawer with navigation, user profile, environment info,
 * and action buttons in the footer.
 *
 * @param props - Component props
 * @returns JSX element rendering sidebar navigation
 */
export default function AppSidebar({
  mobileOpen,
  onMobileClose,
  themeMode,
  onThemeModeChange,
  locale,
  onLocaleChange,
  onLogout,
  onSettingsOpen,
  user,
}: AppSidebarProps) {
  const { t } = useTranslation(['common']);
  const location = useLocation();

  // Get current help topic based on route
  const helpTopic = getHelpTopicForRoute(location.pathname);

  const drawerContent = (
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

  return (
    <Box
      component="nav"
      sx={{
        width: { md: drawerWidth },
        flexShrink: { md: 0 },
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: { md: 'column' },
      }}
    >
      {/* Mobile Drawer (temporary, hidden on md+) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer (permanent, hidden on xs) */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          flex: 1,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            height: '100%',
            position: 'relative',
            overflowY: 'auto',
            pb: 1,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
