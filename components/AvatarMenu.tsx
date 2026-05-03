'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Icon } from './Icon';

interface AvatarMenuProps {
  userEmail: string;
}

const AvatarMenu: React.FC<AvatarMenuProps> = ({ userEmail }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAvatarUrl(user.user_metadata.avatar_url);
      } else {
        setAvatarUrl("");
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('skyVaultUserEmail');
    localStorage.removeItem('skyVaultUserId');
    window.location.reload();
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '24px',
          color: 'var(--text-primary)',
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color, #ccc)' }}
          />
        ) : (
          <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'var(--border-color, #ccc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="user" size={16} />
          </div>
        )}
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }} className="hide-on-mobile">
          {userEmail}
        </span>
        <Icon name="chevron-down" size={16} style={{ color: 'var(--text-secondary)' }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          backgroundColor: 'var(--explorer-bg, #fff)',
          border: '1px solid var(--border-color, #e5e7eb)',
          borderRadius: '8px',
          padding: '8px 0px',
          minWidth: '180px',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div className="show-on-mobile" style={{
            fontSize: '0.85rem',
            fontWeight: 500,
            borderBottom: '1px solid var(--border-color, #e5e7eb)',
            paddingBottom: '12px',
            wordBreak: 'break-all',
            color: 'var(--text-primary)'
          }}>
            {userEmail}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '12px',
              padding: '10px 20px',
              borderRadius: '6px',
              color: '#ff4d4d',
              background: 'transparent',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
          >
            <Icon name="logout" size={20} />
            Cerrar Sesión
          </button>
        </div>
      )}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 767px) {
          .hide-on-mobile { display: none !important; }
        }
        @media (min-width: 768px) {
          .show-on-mobile { display: none !important; }
        }
        `
      }} />
    </div>
  );
};

export default AvatarMenu;
