// src/components/Topbar.tsx
import React from "react";
import { AppBar, Box, Toolbar, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import httpClient from "../api/httpClient";

/**
 * Topbar
 *
 * Global app bar that:
 * - Shows branding
 * - Displays the current user's full name & role when authenticated
 * - Provides a Logout button that:
 *     1) POSTs to /logout (session invalidation on backend)
 *     2) Clears client-side auth context
 *     3) Navigates to /logout-success (public page)
 */
const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await httpClient.post("/logout"); // backend returns 204 for XHR in our SecurityConfig
    } catch {
      // Ignore network errors; we still clear client state below
    }
    logout(); // your hook should clear context; if it doesn't navigate, we do it here:
    navigate("/logout-success", { replace: true });
  };

  return (
    <AppBar position="static" color="primary" enableColorOnDark>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6">Smart Supply Pro</Typography>

        <Box display="flex" alignItems="center" gap={2}>
          {user && (
            <>
              <Typography variant="body1">
                {user.fullName} ({user.role})
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
