// src/components/Topbar.tsx
import React from "react";
import { AppBar, Box, Toolbar, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const Topbar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    // SPA navigation (no full reload, server not involved)
    navigate("/logout-success?auto=1", { replace: true });
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
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
