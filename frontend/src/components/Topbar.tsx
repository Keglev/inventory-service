// src/components/Topbar.tsx
import { AppBar, Box, Toolbar, Typography, Button } from '@mui/material';
import { useAuth } from '../context/useAuth';

/**
 * Application top bar displaying branding, user info, and logout functionality.
 */
const Topbar = () => {
  const { user, logout } = useAuth();

  return (
      <AppBar position="static" color="primary" enableColorOnDark>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6">Smart Supply Pro</Typography>
          <Box display="flex" alignItems="center" gap={2}>
            {user && (
              <>
                <Typography variant="body1">
                  {user.fullName} ({user.role})
                </Typography>
                <Button color="inherit" onClick={async () => {
                  // POST /logout and then go to /logout-success
                  await fetch(`${import.meta.env.VITE_BACKEND_URL}/logout`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' },
                  }).catch(() => {});
                  logout(); // clear context + navigate (if your hook does)
                }}>
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
