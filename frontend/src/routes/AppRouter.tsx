/**
 * @file AppRouter.tsx
 * @description
 * Application routing for Smart Supply Pro.
 *
 * @design
 * - Public routes (login, OAuth callback, logout-success, home/landing) render
 *   *outside* of the application shell to keep the unauthenticated UI minimal.
 * - Authenticated routes render *inside* `AppShell` (SAP/Fiori-style chrome),
 *   and are protected by `RequireAuth`.
 * - A single 404 fallback (NotFoundPage) handles unknown routes.
 *
 * @notes
 * - We intentionally removed the legacy `Topbar.tsx`. The AppBar / nav lives in
 *   `AppShell`, which wraps all authenticated pages.
 * - If the authentication context is still resolving on first load, we render a
 *   centered progress indicator to avoid guard flicker.
 */
import * as React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

import { useAuth } from '../hooks/useAuth';
import { RequireAuth } from '../features/auth';
import AppShell from '../app/layout/AppShell';

// Public pages
import Home from '../pages/home/Home';                       
import LoginPage from '../pages/auth/LoginPage';       
import AuthCallback from '../pages/auth/AuthCallback';
import LogoutSuccess from '../pages/auth/LogoutSuccess';
import NotFoundPage from '../pages/system/NotFoundPage';
import { AppPublicShell } from '../app/public-shell';
import RouterDebug from '../app/debug/RouterDebug';

// Authenticated pages
import Dashboard from '../pages/dashboard/Dashboard';            
import InventoryBoard from '../pages/inventory/InventoryBoard';            
import SuppliersBoard from '../pages/suppliers/SuppliersBoard';
import LogoutPage from '../pages/auth/LogoutPage';
import Analytics from '../pages/analytics/Analytics';

const LoadingScreen: React.FC = () => (
  <Box sx={{ display: 'grid', placeItems: 'center', height: '100dvh' }}>
    <CircularProgress />
  </Box>
);

/**
 * Top-level router. Decides between public vs. authenticated route groups.
 */
const AppRouter: React.FC = () => {
  const { loading } = useAuth();

  // During initial auth bootstrap (e.g., session cookie check), avoid rendering routes.
  if (loading) return <LoadingScreen />;

  return (
    <>
      <RouterDebug />
      <Routes>
        {/**
         * PUBLIC ROUTES (no AppShell)
         */}
      <Route element={<AppPublicShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth" element={<AuthCallback />} />
        <Route path="/logout-success" element={<LogoutSuccess />} />
      </Route>
      {/* Make /logout public: it's safe & avoids RequireAuth race during cleanup */}
      <Route path="/logout" element={<LogoutPage />} />

      {/**
       * AUTHENTICATED ROUTES (inside AppShell)
       * - Children below render within AppShell's AppBar+Drawer+Content layout.
       * - Each child is additionally protected with RequireAuth for safety.
       */}
      <Route element={<AppShell />}>
        <Route
          path="/dashboard"
          element={
            <RequireAuth allowDemo>
              <Dashboard />
            </RequireAuth>
          }
        />
        {/**
         * Inventory route (read-only in demo – write ops blocked by backend/dialogs).
         * Demo users are allowed to access for viewing, but cannot modify data.
         * @enterprise Guarded route: requires auth, allowDemo enables demo user access.
        */}
        <Route
          path="/inventory"
          element={
            <RequireAuth allowDemo>
              <InventoryBoard />
            </RequireAuth>
          }
        />
        <Route
          path="/suppliers"
          element={
            <RequireAuth allowDemo>
              <SuppliersBoard />
            </RequireAuth>
          }
        />
        <Route 
          path="/analytics/:section?" 
          element={
            <RequireAuth allowDemo>
              <Analytics />
            </RequireAuth>
          }
        />
      </Route>

      {/**
       * 404 FALLBACK: unknown paths (public)
       * - Offers a button to go to Dashboard if logged-in, or Login otherwise.
       */}
      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};

export default AppRouter;
