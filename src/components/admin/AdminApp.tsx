import React, { useState, useEffect } from 'react';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { getAdminSession } from '../../services/productsService';

interface AdminAppProps {
  onBackToStore: () => void;
}

export function AdminApp({ onBackToStore }: AdminAppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    async function checkCurrentSession() {
      const session = await getAdminSession();
      if (session) {
        setIsAuthenticated(true);
      }
      setCheckingAuth(false);
    }
    checkCurrentSession();
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#C5A880] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminLogin
        onLoginSuccess={() => setIsAuthenticated(true)}
        onBackToStore={onBackToStore}
      />
    );
  }

  return (
    <AdminDashboard
      onBackToStore={onBackToStore}
      onLogout={() => setIsAuthenticated(false)}
    />
  );
}
