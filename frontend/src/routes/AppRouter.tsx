// src/routs/AppRouter.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

import { useAuth } from "../context/useAuth";
import TopBar from "../components/Topbar";
import RequireAuth from "../components/RequireAuth";

import Home from "../pages/Home";
import Auth from "../pages/Auth";
import AuthCallback from "../pages/AuthCallback";
import LogoutSuccess from "../pages/LogoutSuccess";
import Dashboard from "../pages/Dashboard";
import Inventory from "../pages/Inventory";
import Suppliers from "../pages/Suppliers";

/**
 * AppRouter
 *
 * Top-level router for the SPA. Responsibilities:
 *  - Shows a global spinner while the initial auth state is loading
 *  - Shows the TopBar once a user is authenticated
 *  - Defines public routes (/login, /auth, /logout-success, /) and
 *    protected routes (/dashboard, /inventory, /suppliers)
 *  - Ensures the OAuth callback route (/auth) is accessible without a guard
 *    and routes unauthenticated users to /login by default.
 */
const AppRouter: React.FC = () => {
  const { user, loading } = useAuth();

  // While the app verifies any existing session (e.g., on full page refresh),
  // keep the UI stable and avoid flicker/guard thrash.
  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {/* Show the TopBar only when authenticated */}
      {user && <TopBar />}

      <Routes>
        {/**
         * PUBLIC ROUTES
         *  - "/" : public landing (Home); if already authenticated, we auto-redirect to /dashboard
         *  - "/login" : explicit sign-in page; also gated by PublicOnly so we don't show login to signed-in users
         *  - "/auth" : OAuth2 callback (MUST remain public). It will set user and navigate to /dashboard or back to /login on failure.
         *  - "/logout-success" : friendly confirmation page after logout; also treated as public
         */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/auth" element={<AuthCallback />} />
        <Route path="/logout-success" element={<LogoutSuccess />} />

        {/**
         * PROTECTED ROUTES
         *  - RequireAuth enforces presence of an authenticated session
         *  - If not authenticated, RequireAuth should redirect to /login
         */}
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/inventory" element={<RequireAuth><Inventory /></RequireAuth>} />
        <Route path="/suppliers" element={<RequireAuth><Suppliers /></RequireAuth>} />

        {/**
         * FALLBACK
         *  - Any unknown path navigates to /login (or /dashboard if already authenticated)
         *  - Using Navigate avoids accidentally landing on /auth and getting stuck on a spinner
         */}
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </>
  );
};

export default AppRouter;
