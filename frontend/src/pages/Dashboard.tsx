// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { testConnection } from "../api/testConnection";

/**
 * Dashboard
 *
 * Displays a quick confirmation of the authenticated session and a backend health probe.
 * Assumes AuthCallback populated the auth context with { email, fullName, role }.
 */
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>("Checking...");

  useEffect(() => {
    let cancelled = false;
    testConnection()
      .then((ok) => !cancelled && setStatus(ok ? "OK" : "Connection failed"))
      .catch(() => !cancelled && setStatus("Connection failed"));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <h2>Dashboard</h2>
      <p>
        Login successful{user?.fullName ? `, ${user.fullName}!` : "!"}
      </p>
      <p>Backend status: {status}</p>
    </>
  );
};

export default Dashboard;
