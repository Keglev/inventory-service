import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Inventory from '../pages/Inventory';
import Suppliers from '../pages/Suppliers';
import Auth from '../pages/Auth';
/**
 * Defines all application routes, including fallback handling.
 */
const AppRouter = () => (
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/inventory" element={<Inventory />} />
    <Route path="/suppliers" element={<Suppliers />} />
    <Route path="/login" element={<Auth />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRouter;
