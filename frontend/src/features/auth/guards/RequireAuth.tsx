/**
 * @file RequireAuth.tsx
 * @description
 * Route guard for authenticated views. If the session is still hydrating, show a
 * small loading placeholder; if unauthenticated, redirect to /login and preserve
 * the original location in router state for a post-login redirect.
 *
 * @enterprise
 * - Keep guards dumb: no side effects (no HTTP, no context mutation).
 * - Separation of concerns: logout/session cleanup happens in dedicated pages/hooks.
 */

import * as React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../../context/useAuth';

type RequireAuthProps = {
  /** Component to render when authenticated. */
  children: React.ReactElement;
  /** Optional loading UI while auth state hydrates. */
  fallback?: React.ReactNode;
};

const DefaultLoading = () => (
  <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '40vh' }}>
    <CircularProgress size={24} />
  </Box>
);

const RequireAuth: React.FC<RequireAuthProps> = ({ children, fallback }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (fallback ?? <DefaultLoading />);
  if (user) return children;

  // Preserve where the user was headed; after login you can read state.from
  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default RequireAuth;

