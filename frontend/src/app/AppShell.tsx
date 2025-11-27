/**
 * @file AppShell.tsx
 * @description
 * SAP/Fiori-style application shell: AppBar (header), left Drawer (nav), and content area.
 * Authenticated pages render inside this shell via <Outlet />.
 *
 * @enterprise
 * - Single source of truth for chrome (no duplicated Topbar).
 * - Language toggle (🇩🇪/🇺🇸) persists in localStorage and syncs with i18next + MUI theme locale.
 * - Toast context for lightweight notifications (replace with notistack later if desired).
 * - Drawer supports temporary (mobile) and permanent (desktop) variants.
 * - **Demo mode UX:** shows a DEMO badge in the AppBar, an inline info banner
 *   (“changes disabled”), and disables CRUD nav items via Drawer tooltips.
 *
 * @routing
 * Links point to authenticated routes (/dashboard, /inventory, /suppliers, /orders, /analytics).
 * Logout action currently navigates to /logout (redirects to /logout-success).
 */
import * as React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  CssBaseline,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  Avatar,
  CircularProgress,
  Chip,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import InsightsIcon from '@mui/icons-material/Insights';
import MenuIcon from '@mui/icons-material/Menu';
import DensitySmallIcon from '@mui/icons-material/DensitySmall';
import LogoutIcon from '@mui/icons-material/Logout';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import { useTranslation } from 'react-i18next';
import { useSessionTimeout } from '../features/auth/hooks/useSessionTimeout';
import { ToastContext } from '../app/ToastContext';
import { buildTheme } from '../theme';
import type { SupportedLocale } from '../theme';
import { useAuth } from '../context/useAuth';
import { useHealthCheck } from '../features/health/hooks/useHealthCheck';
import { useHelp } from '../hooks/useHelp';
import AppSettingsDialog from './AppSettingsDialog';
import deFlag from '/flags/de.svg';
import usFlag from '/flags/us.svg';

/* Layout constants */
const drawerWidth = 248;
const LS_KEY = 'i18nextLng';

/**
 * Normalize i18n language to SupportedLocale.
 * Examples:
 *  - 'de-DE' -> 'de'
 *  - 'en-US' -> 'en'
 */
const normalize = (lng?: string): SupportedLocale => (lng?.startsWith('en') ? 'en' : 'de');

/**
 * Side navigation item (highlights when current path matches).
 * Accepts optional `disabled` and `tooltip` for demo-readonly UX.
 */
const NavItem: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  tooltip?: string;
}> = ({ to, icon, label, disabled, tooltip }) => {
  const location = useLocation();
  const selected =
    location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  const button = (
    <ListItemButton
      component={Link}
      to={to}
      selected={selected}
      sx={{ borderRadius: 1, mx: 1 }}
      disabled={disabled}
    >
      <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  );

  return tooltip ? <Tooltip title={tooltip}>{button}</Tooltip> : button;
};

/**
 * Suspense fallback for lazy views.
 */
const Fallback: React.FC = () => (
  <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
    <CircularProgress />
  </Box>
);

export default function AppShell() {
  const { t, i18n } = useTranslation(['common', 'auth']);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openHelp } = useHelp();
  const isDemo = Boolean(user?.isDemo);

  // System health (for header badge)
  const { health } = useHealthCheck();
  const backendOnline = health.status === 'online';
  const dbOnline = health.database === 'online';
  const allOk = backendOnline && dbOnline;

  const healthTone: 'success' | 'warning' | 'error' =
    allOk ? 'success' : backendOnline ? 'warning' : 'error';

  // Initialize locale from i18n/localStorage and keep theme in sync with i18n changes.
  const initial = normalize(localStorage.getItem(LS_KEY) || i18n.resolvedLanguage || 'de');
  const [locale, setLocale] = React.useState<SupportedLocale>(initial);

  // Theme mode (light/dark) with localStorage persistence
  const LS_THEME_KEY = 'themeMode';
  const [themeMode, setThemeMode] = React.useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(LS_THEME_KEY) as 'light' | 'dark' | null;
    return saved || 'light';
  });

  React.useEffect(() => {
    // Keep locale state in sync with i18n (in case language was changed elsewhere).
    const handler = (lng: string) => setLocale(normalize(lng));
    i18n.on('languageChanged', handler);
    return () => {
      i18n.off('languageChanged', handler);
    };
  }, [i18n]);

  // Update MUI theme when locale or theme mode changes.
  const theme = React.useMemo(() => buildTheme(locale, themeMode), [locale, themeMode]);

  // Toggle theme mode and persist to localStorage
  const toggleThemeMode = () => {
    setThemeMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(LS_THEME_KEY, next);
      setToast({
        open: true,
        msg: next === 'dark' ? 'Dark mode enabled' : 'Light mode enabled',
        severity: 'info',
      });
      return next;
    });
  };

  // Session timeout/ping (see hook for details).
  useSessionTimeout({
    pingEndpoint: '/api/me',
    pingIntervalMs: 60_000,
    enableIdleTimeout: false, // flip to true if you want strict idle enforcement
    idleTimeoutMs: 15 * 60_000,
  });

  // Drawer + toast state.
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [toast, setToast] = React.useState<{
    open: boolean;
    msg: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  } | null>(null);

  // Settings dialog state
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  // Profile menu.
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const profileOpen = Boolean(anchorEl);

  /**
   * Toggle language (DE <-> EN), persist choice, and let i18n drive the theme update via effect.
   */
  const toggleLocale = () => {
    const next: SupportedLocale = locale === 'de' ? 'en' : 'de';
    localStorage.setItem(LS_KEY, next);
    setLocale(next); // optimistic
    i18n.changeLanguage(next);
    setToast({
      open: true,
      msg: next === 'de' ? 'Sprache: Deutsch' : 'Language: English',
      severity: 'info',
    });
  };

  /**
   * Logout UX:
   * - Navigate to `/logout` (page handles server/demo-specific flows),
   *   which then redirects to `/logout-success`.
   */
  const handleLogout = () => {
    navigate('/logout', { replace: true });
  };

  const toggleDrawer = () => setMobileOpen((v) => !v);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar>
        <Typography variant="subtitle1" fontWeight={700}>
          Smart Supply Pro
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ flex: 1, py: 1 }}>
        <List>
          <NavItem to="/dashboard" icon={<DashboardIcon />} label={t('nav.dashboard')} />
          {/* In demo mode, disable CRUD routes with an explanatory tooltip */}
          <NavItem
            to="/inventory"
            icon={<InventoryIcon />}
            label={t('nav.inventory')}
            disabled={isDemo}
            tooltip={isDemo ? t('auth:demoNotice') : undefined}
          />
          <NavItem
            to="/suppliers"
            icon={<LocalShippingIcon />}
            label={t('nav.suppliers')}
            disabled={isDemo}
            tooltip={isDemo ? t('auth:demoNotice') : undefined}
          />
          <NavItem
            to="/orders"
            icon={<ReceiptLongIcon />}
            label={t('nav.orders')}
            disabled={isDemo}
            tooltip={isDemo ? t('auth:demoNotice') : undefined}
          />
          <NavItem
            to="/analytics/overview"
            icon={<InsightsIcon />}
            label={t('nav.analytics')}
          />
        </List>
      </Box>
      <Divider />
      <Box sx={{ p: 1 }}>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1 }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary={t('nav.logout')} />
        </ListItemButton>
      </Box>

      {/* User Info & Settings Section */}
      <Divider />
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        
        {/* User Info */}
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
            {t('common:loggedInAs', 'Logged in as:')}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {user?.fullName || 'User'}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mt: 0.5, mb: 0.5 }}>
            {t('common:role', 'Role:')}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {user?.role || 'user'}
          </Typography>
        </Box>

        {/* Environment & Version */}
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
            {t('footer:meta.environment', 'Environment:')}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Production (Koyeb)
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mt: 0.5, mb: 0.5 }}>
            {t('footer:meta.version', 'Version:')}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            1.0.0
          </Typography>
        </Box>

        {/* Icons Row: Theme toggle, Language, Settings */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-around', alignItems: 'center' }}>
          <Tooltip title={themeMode === 'light' ? 'Dark mode' : 'Light mode'}>
            <IconButton 
              size="small" 
              onClick={toggleThemeMode}
              sx={{
                color: themeMode === 'light' ? 'warning.main' : 'info.main',
                transition: 'color 0.3s ease',
              }}
            >
              {themeMode === 'light' ? (
                <LightModeIcon fontSize="small" />
              ) : (
                <DarkModeIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title={t('actions.toggleLanguage', 'Toggle language')}>
            <IconButton size="small" onClick={toggleLocale}>
              <img
                src={locale === 'de' ? deFlag : usFlag}
                alt={locale === 'de' ? 'Deutsch' : 'English'}
                width={16}
                height={16}
              />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('actions.settings', 'Settings')}>
            <IconButton size="small" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Help Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Tooltip title={t('actions.help', 'Help')}>
            <IconButton size="small" onClick={() => openHelp('app.main')}>
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContext.Provider
        value={(msg, severity = 'success') => setToast({ open: true, msg, severity })}
      >
        {/* Fixed AppBar */}
        <AppBar position="fixed" color="primary" sx={{ width: '100%', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton edge="start" onClick={toggleDrawer} sx={{ mr: 1, display: { md: 'none' } }}>
              <MenuIcon />
            </IconButton>

            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('app.title')}
            </Typography>

            {/* DEMO badge (right next to the title) */}
            {isDemo && (
              <Chip
                size="small"
                label={t('auth:demoBadge', 'DEMO')}
                color="warning"
                variant="outlined"
                sx={{ 
                  ml: 1,
                  fontWeight: 700,
                  '& .MuiChip-label': {
                    fontWeight: 700,
                    color: '#000',
                  }
                }}
              />
            )}

            <Box sx={{ flex: 1 }} />

            {/* System health badge (SAP/Fiori-style) */}
            <Box
              sx={{
                mr: 1.5,
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
              }}
            >
              <Tooltip
                title={
                  allOk
                    ? t('app.health.okTooltip', 'Backend & database online')
                    : backendOnline && !dbOnline
                    ? t('app.health.dbDownTooltip', 'Database reachable, DB issue')
                    : t('app.health.downTooltip', 'Backend not reachable')
                }
              >
                <Chip
                  size="small"
                  color={healthTone}
                  variant="outlined"
                  icon={
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor:
                          healthTone === 'success'
                            ? 'success.main'
                            : healthTone === 'warning'
                            ? 'warning.main'
                            : 'error.main',
                      }}
                    />
                  }
                  label={
                    allOk
                      ? t('app.health.okLabel', 'System OK')
                      : backendOnline
                      ? t('app.health.degradedLabel', 'Degraded')
                      : t('app.health.downLabel', 'Offline')
                  }
                  sx={{
                    '& .MuiChip-icon': {
                      mr: 0.5,
                    },
                    fontWeight: 700,
                    '& .MuiChip-label': {
                      fontWeight: 700,
                      color: healthTone === 'success' ? '#1b5e20' : healthTone === 'warning' ? '#e65100' : '#b71c1c',
                    }
                  }}
                />
              </Tooltip>
            </Box>

            {/* Density (informational for now) */}
            <Tooltip title={t('actions.toggleDensity')}>
              <span>
                <IconButton
                  onClick={() =>
                    setToast({
                      open: true,
                      msg: t('toast.densityStatic'),
                      severity: 'info',
                    })
                  }
                >
                  <DensitySmallIcon />
                </IconButton>
              </span>
            </Tooltip>

            {/* Language toggle: 🇩🇪 <-> 🇺🇸 */}
            <Tooltip title={t('actions.toggleLanguage')}>
              <IconButton onClick={toggleLocale}>
                <img
                  src={locale === 'de' ? deFlag : usFlag}
                  alt={locale === 'de' ? 'Deutsch' : 'English'}
                  width={20}
                  height={20}
                />
              </IconButton>
            </Tooltip>

            {/* Profile menu */}
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 28, height: 28 }}>
                {user?.fullName?.slice(0, 2).toUpperCase() || 'SS'}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={profileOpen} onClose={() => setAnchorEl(null)}>
              <MenuItem disabled>
                {/* Example: "Ada Lovelace (ADMIN)" */}
                {user ? `${user.fullName} (${user.role})` : '—'}
              </MenuItem>
              <MenuItem onClick={handleLogout}>{t('nav.logout')}</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Main container with sidebar + content, positioned below fixed AppBar */}
        <Box sx={{ display: 'flex', bgcolor: 'background.default' }}>
          {/* Side nav */}
          <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
            {/* Mobile drawer */}
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={toggleDrawer}
              ModalProps={{ keepMounted: true }}
              sx={{
                display: { xs: 'block', md: 'none' },
                '& .MuiDrawer-paper': { width: drawerWidth },
              }}
            >
              {drawer}
            </Drawer>
            {/* Desktop drawer */}
            <Drawer
              variant="permanent"
              open
              sx={{
                display: { xs: 'none', md: 'block' },
                '& .MuiDrawer-paper': {
                  width: drawerWidth,
                  boxSizing: 'border-box',
                  position: 'relative',    
                  left: 'auto',
                  top: 'auto',
                  height: '100%',           
                  overflowY: 'auto',
                },
              }}
            >
              {drawer}
            </Drawer>
          </Box>

          {/* Content area */}
          <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, overflowY: 'auto' }}>
            {/* Demo notice banner (non-blocking, subtle) */}
            <Toolbar />
            {isDemo && (
              <Alert
                severity="info"
                icon={false}
                sx={{
                  mb: 2,
                  borderLeft: (theme) => `4px solid ${theme.palette.info.main}`,
                  bgcolor: (theme) => theme.palette.info.light,
                }}
              >
                {t('auth:demoNotice', 'You are browsing in demo mode. Changes are disabled.')}
              </Alert>
            )}

            <React.Suspense fallback={<Fallback />}>
              <Outlet />
            </React.Suspense>
          </Box>
        </Box>

        {/* Toasts */}
        <Snackbar
          open={!!toast?.open}
          onClose={() => setToast((t) => (t ? { ...t, open: false } : t))}
          autoHideDuration={2500}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity={toast?.severity || 'success'} elevation={1} variant="filled">
            {toast?.msg}
          </Alert>
        </Snackbar>

        {/* Settings Dialog */}
        <AppSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </ToastContext.Provider>
    </ThemeProvider>
  );
}
