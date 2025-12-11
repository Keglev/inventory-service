import * as React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../../hooks/useAuth';

/**
 * @file RequireAuth.tsx
 * @description
 * Authorization gate for routed pages.
 * Ensures only authenticated users can access protected routes.
 * Redirects unauthenticated users to the login page.
 *
 * @enterprise
 * - If `allowDemo` is true, DEMO users may access the route (read-only areas).
 * - Otherwise, DEMO sessions are redirected to /analytics/overview.
 * - Accepts a `fallback` prop to customize the loading indicator while auth state is being determined.
 */
type Props = {
  children: React.ReactElement;
  fallback?: React.ReactNode;
  allowDemo?: boolean;
};

/**
 * 
 * @returns React.ReactElement
 * @description
 * Default loading indicator while auth state is being determined.
 * Centered circular progress indicator.
 * @private
 * @enterprise
 * - Consistent styling with MUI components
 * - Minimal and non-blocking UI
 * - Used when no custom `fallback` is provided 
 * @example
 * ```tsx
 * <RequireAuth>
 *  <ProtectedPage />
 * </RequireAuth>
 * ```
 */
const DefaultLoading = () => (
  <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 160 }}>
    <CircularProgress size={22} />
  </Box>
);

/**
 * @component
 * @description
 * Authorization gate for routed pages.
 * Ensures only authenticated users can access protected routes.
 * Redirects unauthenticated users to the login page.
 * 
 * @enterprise
 * - If `allowDemo` is true, DEMO users may access the route (read-only areas).
 * - Otherwise, DEMO sessions are redirected to /dashboard.
 * - Accepts a `fallback` prop to customize the loading indicator while auth state is being determined.
 */
const RequireAuth: React.FC<Props> = ({ children, fallback, allowDemo }) => {
  const { user, loading, logoutInProgress } = useAuth();
  const location = useLocation();

  // Show loading indicator while auth state is being determined
  if (loading) return (fallback ?? <DefaultLoading />);

  // If a logout was just triggered, hold the guard to avoid flashing the login page
  if (!user && logoutInProgress) {
    return (fallback ?? <DefaultLoading />);
  }

  // Redirect unauthenticated users to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect DEMO users if not allowed
  if (user.isDemo && !allowDemo) {
    return <Navigate to="/dashboard" replace />;
  }

  // Allow access to authorized users
  return children;
};

export { RequireAuth };
export default RequireAuth;
