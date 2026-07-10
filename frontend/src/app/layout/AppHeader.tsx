/**
 * @file AppHeader.tsx
 * @module app/layout/AppHeader
 *
 * @summary
 * Fixed application header (AppBar) with title, system health badge, and toolbar actions.
 * Thin orchestrator delegating to HealthBadge and HeaderDemoBadge sub-components.
 *
 * @enterprise
 * - Fixed positioning with z-index above the drawer so the toolbar always overlaps the sidebar on scroll.
 * - Delegates health status to HealthBadge (owns its own polling) and demo indicator to HeaderDemoBadge, keeping this component agnostic of their implementation details.
 * - Receives all state via props; intentionally stateless so AppShell remains the single owner of theme, locale, and session.
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
import type { SupportedLocale } from '../../theme';

interface AppHeaderProps {
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
  themeMode,
  onThemeModeChange,
  locale,
  onLocaleChange,
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
      <Toolbar>
        {/* Mobile Menu Toggle (hidden on md+) */}
        <IconButton
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 1, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Application Title */}
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t('app.title')}
        </Typography>

        {/* Demo Badge (shown if user is on demo account) */}
        <HeaderDemoBadge isDemo={isDemo} />

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* System Health Badge (hidden on xs, shown on sm+) */}
        <HealthBadge />

        {/* Toolbar Actions (language, help, hamburger) */}
        <AppToolbarActions
          themeMode={themeMode}
          onThemeModeChange={onThemeModeChange}
          locale={locale}
          onLocaleChange={onLocaleChange}
          onLogout={onLogout}
          helpTopic={helpTopic}
        />
      </Toolbar>
    </AppBar>
  );
}
