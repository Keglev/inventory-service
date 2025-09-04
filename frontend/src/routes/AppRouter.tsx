import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Dashboard from '../pages/Dashboard';
import Inventory from '../pages/Inventory';
import Suppliers from '../pages/Suppliers';
import Auth from '../pages/Auth';
import Home from '../pages/Home';
import AuthCallback from '../pages/AuthCallback';
import LogoutSuccess from '../pages/LogoutSuccess';
import TopBar from '../components/Topbar';
import RequireAuth from '../components/RequireAuth';
import { CircularProgress, Box } from '@mui/material';

const AppRouter = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box className="flex items-center justify-center h-screen">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {user && <TopBar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth />} />

        {/* NEW: silent verifier after Google */}
        <Route path="/auth" element={<AuthCallback />} />

        {/* Optional: show a friendly page after logout */}
        <Route path="/logout-success" element={<LogoutSuccess />} />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/inventory"
          element={
            <RequireAuth>
              <Inventory />
            </RequireAuth>
          }
        />
        <Route
          path="/suppliers"
          element={
            <RequireAuth>
              <Suppliers />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const NotFound = () => (
  <Box className="flex items-center justify-center h-screen">
    <h1>404 - Page not found</h1>
  </Box>
);

export default AppRouter;
