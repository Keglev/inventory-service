import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Dashboard from '../pages/Dashboard';
import Inventory from '../pages/Inventory';
import Suppliers from '../pages/Suppliers';
import Auth from '../pages/Auth';
import Home from '../pages/Home'; // ← formerly LandingPage
import TopBar from '../components/Topbar';
/**
 * Defines all application routes, including fallback handling.
 */
const AppRouter = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <TopBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/inventory" element={user ? <Inventory /> : <Navigate to="/login" />} />
        <Route path="/suppliers" element={user ? <Suppliers /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

export default AppRouter;
