// src/Home.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

/**
 * Home route that redirects based on user login status
 */
const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(user ? '/dashboard' : '/login');
  }, [user, navigate]);

  return null;
};

export default Home;

