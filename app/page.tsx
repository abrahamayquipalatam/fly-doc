'use client'

import { useState, useEffect } from 'react';
import FileExplorer from '../components/FileExplorer';
import Login from '../components/Login';

export default function Home() {
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Get/Set anonymous userId
    let id = localStorage.getItem('skyVaultUserId');
    if (!id) {
      const params = new URLSearchParams(window.location.search);
      id = params.get('pilotId') || crypto.randomUUID();
      localStorage.setItem('skyVaultUserId', id);
    }
    setUserId(id);

    // 2. Check if already logged in
    const storedEmail = localStorage.getItem('skyVaultUserEmail');
    if (storedEmail) {
      setUserEmail(storedEmail);
    }
    
    setIsReady(true);
  }, []);

  const handleLoginSuccess = (userData: { email: string }) => {
    localStorage.setItem('skyVaultUserEmail', userData.email);
    setUserEmail(userData.email);
  };

  if (!isReady) {
    return (
      <div className="flex-center" style={{ height: '100vh', background: 'var(--bg-color)', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--accent-color)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
          <p style={{ fontSize: '0.9rem' }}>Iniciando SkyVault Explorer...</p>
        </div>
      </div>
    );
  }

  if (!userEmail) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>
            <FileExplorer userId={userId} userEmail={userEmail} />
        </div>
    </div>
  );
}
