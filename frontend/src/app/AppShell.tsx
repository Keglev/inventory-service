/**
 * @file AppShell.tsx
 * @description
 * SAP/Fiori-style application shell: AppBar (header), left Drawer (nav), and content area.
 * Authenticated pages render inside this shell via <Outlet />.
 *
 * @enterprise
* Single source of truth for chrome (no duplicated Topbar).
* Language toggle (🇩🇪/🇺🇸) persists in localStorage and syncs with i18next + MUI theme locale.
* Toast context for lightweight notifications (replace with notistack later if desired).
* Drawer supports temporary (mobile) and permanent (desktop) variants.
* 
* @routing
* Links point to authenticated routes (/dashboard, /inventory, /suppliers, /orders, /analytics).
* Logout action currently navigates to /logout-success (friendly confirmation page).
* You can later introduce a dedicated /logout route that clears caches and then redirects to /logout-success.
**/
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
import { useTranslation } from 'react-i18next';
import { useSessionTimeout } from '../features/auth/hooks/useSessionTimeout';
import { ToastContext } from '../app/ToastContext';

import { buildTheme } from '../theme';
import type { SupportedLocale } from '../theme';
import i18n from '../i18n';
import { useAuth } from '../context/useAuth';

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
 */
const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({
  to,
  icon,
  label,
}) => {
  const location = useLocation();
  const selected = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <ListItemButton component={Link} to={to} selected={selected} sx={{ borderRadius: 1, mx: 1 }}>
      <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  );
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Initialize locale from i18n/localStorage and keep theme in sync with i18n changes.
  const initial = normalize(localStorage.getItem(LS_KEY) || i18n.resolvedLanguage);
  const [locale, setLocale] = React.useState<SupportedLocale>(initial);
  React.useEffect(() => {
    const handler = (lng: string) => setLocale(normalize(lng));
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, []);
  const theme = React.useMemo(() => buildTheme(locale), [locale]);

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

  // Profile menu.
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const profileOpen = Boolean(anchorEl);

  /**
   * Toggle language (DE <-> EN), persist choice, and let i18n drive the theme update via effect.
   */
  const toggleLocale = () => {
    const next: SupportedLocale = locale === 'de' ? 'en' : 'de';
    localStorage.setItem(LS_KEY, next);
    i18n.changeLanguage(next);
    setToast({
      open: true,
      msg: next === 'de' ? 'Sprache: Deutsch' : 'Language: English',
      severity: 'info',
    });
  };

  /**
   * Logout UX:
   * - Navigate to `/logout-success` (current flow)
   * - Later: introduce `/logout` page that clears caches (React Query) and invalidates session, then redirects.
   */
  const handleLogout = () => {
    navigate('/logout-success?auto=1', { replace: true });
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
          <NavItem to="/dashboard" icon={<DashboardIcon />} label={t('nav.dashboard', 'Dashboard')} />
          <NavItem to="/inventory" icon={<InventoryIcon />} label={t('nav.inventory', 'Inventory')} />
          <NavItem to="/suppliers" icon={<LocalShippingIcon />} label={t('nav.suppliers', 'Suppliers')} />
          <NavItem to="/orders" icon={<ReceiptLongIcon />} label={t('nav.orders', 'Purchase Orders')} />
          <NavItem to="/analytics" icon={<InsightsIcon />} label={t('nav.analytics', 'Analytics')} />
        </List>
      </Box>
      <Divider />
      <Box sx={{ p: 1 }}>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1 }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary={t('nav.logout', 'Logout')} />
        </ListItemButton>
      </Box>
    </Box>
  );
    return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContext.Provider
        value={(msg, severity = 'success') => setToast({ open: true, msg, severity })}
      >
        <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'background.default' }}>
          {/* Header */}
          <AppBar position="fixed" color="inherit" sx={{ bgcolor: 'background.paper' }}>
            <Toolbar>
              <IconButton edge="start" onClick={toggleDrawer} sx={{ mr: 1, display: { md: 'none' } }}>
                <MenuIcon />
              </IconButton>

              <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>
                {t('app.title', 'Smart Supply Pro')}
              </Typography>

              {/* Density (informational for now) */}
              <Tooltip title={t('actions.toggleDensity', 'Toggle compact density')}>
                <span>
                  <IconButton
                    onClick={() =>
                      setToast({
                        open: true,
                        msg: t('toast.densityStatic', 'Density is set via theme defaults.'),
                        severity: 'info',
                      })
                    }
                  >
                    <DensitySmallIcon />
                  </IconButton>
                </span>
              </Tooltip>

              {/* Language toggle: 🇩🇪 <-> 🇺🇸 */}
              <Tooltip title={t('actions.toggleLanguage', 'Switch language')}>
                <IconButton onClick={toggleLocale}>
                  <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>
                    {locale === 'de' ? '🇩🇪' : '🇺🇸'}
                  </span>
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
                <MenuItem onClick={handleLogout}>{t('nav.logout', 'Logout')}</MenuItem>
              </Menu>
            </Toolbar>
          </AppBar>
        
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
                '& .MuiDrawer-paper': { width: drawerWidth, position: 'relative' },
              }}
            >
              {drawer}
            </Drawer>
          </Box>

          {/* Content */}
          <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, ml: { md: `${drawerWidth}px` } }}>
            <Toolbar />
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
      </ToastContext.Provider>
    </ThemeProvider>
  );
}