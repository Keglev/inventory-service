/**
 * @file AppSidebar.tsx
 * @module app/layout/AppSidebar
 *
 * @summary
 * Left sidebar navigation drawer with profile info, settings, and logout.
 * Thin orchestrator delegating to focused sub-components for navigation, profile, and actions.
 *
 * @enterprise
 * - Two Drawer variants (temporary on mobile, permanent on desktop) share one content tree via SidebarDrawerContent, avoiding JSX duplication for each breakpoint.
 * - Delegates all content areas to sub-components (SidebarNavList, SidebarUserProfile, SidebarEnvironment, SidebarActions) through SidebarDrawerContent so this file only controls drawer chrome.
 * - Receives state via props from AppShell, which is the single state owner; sidebar never reads localStorage directly.
 * - helpTopic is re-derived from location inside SidebarDrawerContent (not forwarded from AppShell) because the sidebar needs it independently for its own help button.
 */

import { Box, Drawer } from '@mui/material';
import type { SupportedLocale } from '../../theme';
import { SidebarDrawerContent } from './SidebarDrawerContent';

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
  const drawerContent = (
    <SidebarDrawerContent
      themeMode={themeMode}
      onThemeModeChange={onThemeModeChange}
      locale={locale}
      onLocaleChange={onLocaleChange}
      onLogout={onLogout}
      onSettingsOpen={onSettingsOpen}
      user={user}
    />
  );

  return (
    <Box
      component="nav"
      sx={{
        // Height is bounded by the viewport-fit shell row (CB-APP73/74):
        // the sidebar must end above the footer, never overflow beneath it.
        width: { md: drawerWidth },
        flexShrink: { md: 0 },
        minHeight: 0,
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
