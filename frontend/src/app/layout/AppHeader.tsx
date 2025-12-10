/**
 * @file AppHeader.tsx
 * @module app/layout/AppHeader
 *
 * @summary
 * Fixed application header (AppBar) with title, system health badge, and toolbar actions.
 * Thin orchestrator delegating to HealthBadge and HeaderDemoBadge sub-components.
 *
 * @enterprise
 * - Fixed positioning with consistent z-index stacking
 * - System health status via HealthBadge sub-component
 * - Demo mode indicator via HeaderDemoBadge sub-component
 * - Responsive toolbar with mobile drawer toggle
 * - Full TypeDoc coverage for header layout and component coordination
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
import { HealthBadge, HeaderDemoBadge } from './header';
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
