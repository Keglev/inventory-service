// src/pages/LogoutSuccess.tsx
import React from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

/**
 * LogoutSuccess
 *
 * Simple confirmation page after logout with a clear CTA back to /login.
 * This route must be PUBLIC (no auth guard), otherwise you'll bounce back to /login immediately.
 */
const LogoutSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh", p: 2 }}>
      <Paper sx={{ p: 4, maxWidth: 520, width: "100%" }} elevation={2}>
        <Typography variant="h5" gutterBottom>
          Logout successful
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          You have been signed out securely.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/login", { replace: true })}
          sx={{ mt: 2 }}
        >
          Back to login
        </Button>
      </Paper>
    </Box>
  );
};

export default LogoutSuccess;
