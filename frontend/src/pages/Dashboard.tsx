import { useEffect, useState } from 'react';
import { testConnection } from '../api/testConnection';

const Dashboard = () => {
  const [status, setStatus] = useState('');

  useEffect(() => {
    testConnection()
      .then(setStatus)
      .catch((error) => {
        console.error('Connection error:', error);
        setStatus('Connection failed');
      });
  }, []);

  return (
    <>
      <h2>Dashboard</h2>
      <p>Backend status: {status}</p>
    </>
  );
};

export default Dashboard;


