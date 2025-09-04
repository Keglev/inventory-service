import { useEffect, useState } from 'react';
import { testConnection } from '../api/testConnection';
import { useAuth } from '../context/useAuth';

const Dashboard = () => {
  const [status, setStatus] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    testConnection()
      .then(setStatus)
      .catch(() => setStatus('Connection failed'));
  }, []);

  return (
    <>
      <h2>Dashboard</h2>
      <p>Login successful{user ? `, ${user.fullName}!` : '!'}</p>
      <p>Backend status: {status}</p>
    </>
  );
};

export default Dashboard;



