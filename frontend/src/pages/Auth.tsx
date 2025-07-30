// src/pages/Auth.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Typography, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import httpClient from '../api/httpClient';

const Auth = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await httpClient.get('/api/me', { withCredentials: true });
        setUser(res.data);
        navigate('/dashboard');
      } catch (err) {
        console.error('Login failed or session invalid', err);
        navigate('/login'); // optionally redirect to login or show message
      }
    };

    fetchUser();
  }, []);

  return (
    <Box className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <CircularProgress />
      <Typography variant="body2" mt={2}>Verifying your login...</Typography>
    </Box>
  );
};

export default Auth;
