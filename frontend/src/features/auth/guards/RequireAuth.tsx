import * as React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../../hooks/useAuth';

/**
 * @file RequireAuth.tsx
 * @description
 * Authorization gate for routed pages.
 *
 * @enterprise
 * - If `allowDemo` is true, DEMO users may access the route (read-only areas).
 * - Otherwise, DEMO sessions are redirected to /analytics/overview.
 */
type Props = {
  children: React.ReactElement;
  fallback?: React.ReactNode;
  allowDemo?: boolean;
};

const DefaultLoading = () => (
  <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 160 }}>
    <CircularProgress size={22} />
  </Box>
);

const RequireAuth: React.FC<Props> = ({ children, fallback, allowDemo }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (fallback ?? <DefaultLoading />);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.isDemo && !allowDemo) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export { RequireAuth };
export default RequireAuth;
