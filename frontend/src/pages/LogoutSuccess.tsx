// src/pages/LogoutSuccess.tsx
import React, { useEffect } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import httpClient from "../api/httpClient";
import { useAuth } from "../context/useAuth";

/**
 * Public page. If query ?auto=1 is present, it:
 *  1) POSTs /api/auth/logout (idempotent; 204)
 *  2) clears client-side auth state via logout()
 */
const LogoutSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { search } = useLocation();           // BrowserRouter -> query lives in location.search
  const params = new URLSearchParams(search);

  useEffect(() => {
    if (params.get("auto") === "1") {
      (async () => {
        try { await httpClient.post("/api/auth/logout"); } catch { /* ignore */ }
        logout(); // safe here (public route)
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "70vh" }}>
      <Box sx={{ textAlign: "center", maxWidth: 560, px: 3 }}>
        <Typography variant="h5" gutterBottom>Logout successful</Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          You have been signed out. See you next time!
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate("/login", { replace: true })}>
          Back to login
        </Button>
      </Box>
    </Box>
  );
};

export default LogoutSuccess;
