'use client'

import { useState, useEffect } from 'react';
import FileExplorer from '../components/FileExplorer';

export default function Home() {
  const [userId, setUserId] = useState('');

  useEffect(() => {
    let id = localStorage.getItem('skyVaultUserId');
    if (!id) {
      // Intentamos obtener el ID del piloto desde la URL por si acaso
      const params = new URLSearchParams(window.location.search);
      id = params.get('pilotId') || crypto.randomUUID();
      localStorage.setItem('skyVaultUserId', id);
    }
    setUserId(id);
  }, []);

  if (!userId) return (
      <div className="flex-center" style={{ height: '100vh', background: 'var(--bg-color)', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--accent-color)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
              <p style={{ fontSize: '0.9rem' }}>Iniciando SkyVault Explorer...</p>
          </div>
      </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>
            <FileExplorer userId={userId} />
        </div>
    </div>
  );
}
