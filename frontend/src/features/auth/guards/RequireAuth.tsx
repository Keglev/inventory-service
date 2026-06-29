import * as React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../../hooks/useAuth';

/**
 * @file RequireAuth.tsx
 * @module features/auth/guards/RequireAuth
 * @summary
 * Route guard for authenticated pages: gates rendering on the AuthContext state
 * and routes unauthenticated/blocked-demo users away from the protected children.
 *
 * @enterprise
 * - Single production consumer: routes/AppRouter.tsx, 4 instantiations, ALL with
 *   `allowDemo`. The blocked-demo branch (redirect to /dashboard) is dead code
 *   today — kept as defensive code for future demo-restricted routes.
 * - LogoutPage is INTENTIONALLY outside RequireAuth (AppRouter line 69) — avoids
 *   a guard race during logout cleanup. RequireAuth must NOT be applied to /logout.
 * - Reads three AuthContext fields: user, loading, logoutInProgress. The
 *   `logoutInProgress` guard (held by AuthContext's 4s safety valve — CB-APP31)
 *   prevents flashing the login page during the post-logout transition.
 * - Unauthenticated redirect preserves location state so LoginPage can
 *   post-login-redirect back to the originally requested route.
 */
type Props = {
  children: React.ReactElement;
  fallback?: React.ReactNode;
  allowDemo?: boolean;
};

/** Centered fallback indicator shown while auth state is being determined. */
const DefaultLoading = () => (
  <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 160 }}>
    <CircularProgress size={22} />
  </Box>
);

const RequireAuth: React.FC<Props> = ({ children, fallback, allowDemo }) => {
  const { user, loading, logoutInProgress } = useAuth();
  const location = useLocation();

  if (loading) return (fallback ?? <DefaultLoading />);

  // WHY: hold the guard during post-logout transition — AuthContext's logoutInProgress flag (4s safety valve, CB-APP31) bridges the gap between local state clear and the /logout navigation.
  if (!user && logoutInProgress) {
    return (fallback ?? <DefaultLoading />);
  }

  // WHY: pass current location in state so LoginPage can post-login-redirect back to the originally requested route.
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
