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
        <Typography variant="h6" component="div">
          Smart Supply Pro
        </Typography>

        <Box display="flex" alignItems="center" gap={2}>
          {user && (
            <>
              <Typography variant="body1">
                {user.fullName} ({user.role})
              </Typography>
              <Button color="inherit" onClick={logout}>
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
