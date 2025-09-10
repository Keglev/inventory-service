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

import { useAuth } from '../context/useAuth';
import RequireAuth from '../features/auth/guards/RequireAuth';
import AppShell from '../app/AppShell';

// Public pages
import Home from '../pages/home/Home';                       
import LoginPage from '../pages/auth/LoginPage';       
import AuthCallback from '../pages/auth/AuthCallback';
import LogoutSuccess from '../pages/auth/LogoutSuccess';
import NotFoundPage from '../pages/system/NotFoundPage';

// Authenticated pages
import Dashboard from '../pages/dashboard/Dashboard';            
import Inventory from '../pages/inventory/Inventory';            
import Suppliers from '../pages/suppliers/Suppliers';             
import LogoutPage from '../pages/auth/LogoutPage';

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
    <Routes>
      {/**
       * PUBLIC ROUTES (no AppShell)
       */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth" element={<AuthCallback />} />
      <Route path="/logout-success" element={<LogoutSuccess />} />
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
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/inventory"
          element={
            <RequireAuth>
              <Inventory />
            </RequireAuth>
          }
        />
        <Route
          path="/suppliers"
          element={
            <RequireAuth>
              <Suppliers />
            </RequireAuth>
          }
        />
        <Route
          path="/logout"
          element={
            <RequireAuth>
              <LogoutPage />
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
  );
};

export default AppRouter;
