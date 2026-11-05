/**
 * @file AppRouter.tsx
 * @module routes/AppRouter
 *
 * @summary
 * Application routing for Smart Supply Pro.
 *
 * @enterprise
 * - Public routes (login, OAuth callback, logout-success, home/landing) render
 *   *outside* of the application shell to keep the unauthenticated UI minimal.
 * - Authenticated routes render *inside* `AppShell` (SAP/Fiori-style chrome),
 *   and are protected by `RequireAuth`.
 * - A single 404 fallback (NotFoundPage) handles unknown routes.
 * - Every authenticated route passes `allowDemo`: the demo sees each page
 *   read-only (writes are blocked by the dialogs and the backend).
 * - If the authentication context is still resolving on first load, we render a
 *   centered progress indicator to avoid guard flicker.
 */
import * as React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

import { useAuth } from '../hooks/useAuth';
import { RequireAuth } from '../features/auth/guards/RequireAuth';
import { default as AppShell } from '../app/layout/AppShell';

// Public pages
import Home from '../pages/home/Home';                       
import LoginPage from '../pages/auth/LoginPage';       
import AuthCallback from '../pages/auth/AuthCallback';
import LogoutSuccess from '../pages/auth/LogoutSuccess';
import NotFoundPage from '../pages/system/NotFoundPage';
import ImpressumPage from '../pages/legal/ImpressumPage';
import DatenschutzPage from '../pages/legal/DatenschutzPage';
import AppPublicShell from '../app/public-shell/AppPublicShell';

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
      <Routes>
        {/* PUBLIC ROUTES (no AppShell) */}
      <Route element={<AppPublicShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth" element={<AuthCallback />} />
        <Route path="/logout-success" element={<LogoutSuccess />} />
        {/* Legal pages: public, reachable from every page via the footer */}
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/datenschutz" element={<DatenschutzPage />} />
        {/* 404 fallback inside the public shell, so header, footer and legal links stay reachable */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      {/* Make /logout public: it's safe & avoids RequireAuth race during cleanup */}
      <Route path="/logout" element={<LogoutPage />} />

      {/* AUTHENTICATED ROUTES: inside AppShell, each also guarded by RequireAuth */}
      <Route element={<AppShell />}>
        <Route
          path="/dashboard"
          element={
            <RequireAuth allowDemo>
              <Dashboard />
            </RequireAuth>
          }
        />
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

      </Routes>
    </>
  );
};

export default AppRouter;
