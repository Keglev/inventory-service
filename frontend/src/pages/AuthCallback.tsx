// pages/AuthCallback.tsx
import React, { useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import httpClient from "../api/httpClient";
import { useAuth } from "../context/useAuth";

/**
 * AuthCallback
 *
 * After a successful Google OAuth2 login, the backend redirects here (/auth).
 * We verify the session via /api/me, populate the AuthContext, then go to /dashboard.
 * NOTE: We only set { email, fullName, role } to match your current FE user type.
 */
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Expected response shape from backend: { email, fullName, role, pictureUrl? }
        const { data } = await httpClient.get("/api/me");

        if (!cancelled) {
          // Set ONLY the fields your current AuthContext type knows about
          setUser({
            email: data.email,
            fullName: data.fullName,
            role: data.role,
          });
          navigate("/dashboard", { replace: true });
        }
      } catch {
        if (!cancelled) {
          navigate("/login?error=session", { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, setUser]);

  // Lightweight loading UI while verifying the session
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <Box textAlign="center">
        <CircularProgress />
        <Typography variant="body2" mt={2}>
          Verifying your login…
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthCallback;
