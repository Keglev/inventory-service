/**
 * @file AppHeader.tsx
 * @module app/layout/AppHeader
 *
 * @summary
 * Fixed application header (AppBar) with title, system health badge, and toolbar actions.
 *
 * @enterprise
 * - Fixed positioning with z-index above the drawer so the toolbar always overlaps the sidebar on scroll.
 * - Delegates health status to HealthBadge (it reads the shared health query) and the demo indicator to HeaderDemoBadge, keeping this component agnostic of their implementation details.
 * - Receives all state via props; intentionally stateless, so its owners (AppShell, ShellPreferencesProvider for theme and locale) stay the only ones.
 * - Mobile drawer toggle forwarded to AppShell rather than controlling the drawer directly, keeping drawer state colocated with its owner.
 */

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTranslation } from 'react-i18next';
import AppToolbarActions from './AppToolbarActions';
import { default as HealthBadge } from './header/HealthBadge';
import { default as HeaderDemoBadge } from './header/HeaderDemoBadge';

export interface AppHeaderProps {
  /** Opens the About dialog */
  onAboutOpen: () => void;

  /** Callback for logout action */
  onLogout: () => void;

  /** Help topic ID for context-sensitive help */
  helpTopic: string;

  /** Whether user is on demo account */
  isDemo: boolean;

  /** Callback to toggle mobile drawer */
  onDrawerToggle: () => void;
}

/**
 * Application header component.
 *
 * Thin orchestrator that delegates rendering to focused sub-components.
 * Renders the fixed AppBar with title, health status, demo badge, and toolbar actions.
 *
 * @param props - Component props
 * @returns JSX element rendering the application header
 */
export default function AppHeader({
  onAboutOpen,
  onLogout,
  helpTopic,
  isDemo,
  onDrawerToggle,
}: AppHeaderProps) {
  const { t } = useTranslation(['common']);

  return (
    <AppBar
      position="fixed"
      color="primary"
      sx={{ width: '100%', zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      {/* Phones get 8px gutters so the full title fits at 360px */}
      <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
        {/* Navigation drawer toggle, phones only (desktop shows the rail) */}
        <IconButton
          edge="start"
          color="inherit"
          onClick={onDrawerToggle}
          aria-label={t('actions.openNavigation')}
          sx={{ mr: 1, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* One line on phones: the full name, smaller, never wrapped */}
        <Typography
          variant="h6"
          noWrap
          sx={(theme) => ({ fontWeight: 700, [theme.breakpoints.down('sm')]: { fontSize: '0.9375rem' } })}
        >
          {t('app.title')}
        </Typography>

        <HeaderDemoBadge isDemo={isDemo} />

        <Box sx={{ flex: 1 }} />

        {/* System Health Badge (hidden on xs, shown on sm+) */}
        <HealthBadge />

        {/* Toolbar actions: bell, help, avatar menu */}
        <AppToolbarActions
          onAboutOpen={onAboutOpen}
          onLogout={onLogout}
          helpTopic={helpTopic}
        />
      </Toolbar>
    </AppBar>
  );
}
