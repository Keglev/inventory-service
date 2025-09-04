import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function LogoutSuccess() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Box textAlign="center">
        <Typography variant="h5" sx={{ mb: 2 }}>Logout successful</Typography>
        <Button variant="contained" onClick={() => navigate('/login')}>
          Back to Login
        </Button>
      </Box>
    </Box>
  );
}
