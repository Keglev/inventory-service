/**
 * @file Home.tsx
 * @description
 * Redirect hub for the root route (/):
 * - If authenticated, redirect to /dashboard.
 * - If not authenticated, redirect to /login.
 * - While auth state is hydrating, show a loading spinner.
 * 
 * @enterprise
 * - Uses useAuth() to access auth state.
 * - Uses Navigate from react-router-dom for redirection.
 * - Simple and focused component with no side effects.
 * - Uses <Navigate replace> to keep history clean
 */
import * as React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/useAuth';

/**
 * Home component
 */
const Home: React.FC = () => {
  const { user, loading } = useAuth();

  // While auth state is hydrating, show a loading spinner
  if (loading) {
    return (
      <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  // Redirect based on authentication status
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
};

export default Home;

