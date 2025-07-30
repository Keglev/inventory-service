import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protects routes by checking user authentication status.
 * Redirects unauthenticated users to login page.
 */ 
const RequireAuth = ({ children }: { children: React.ReactElement }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  return user ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

export default RequireAuth;
