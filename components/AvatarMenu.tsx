'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Icon } from './Icon';
import Toast from './Toast';
import { getTheme, setTheme } from '../lib/theme';

interface AvatarMenuProps {
  userEmail: string;
  userName?: string;
}

const AvatarMenu: React.FC<AvatarMenuProps> = ({ userEmail, userName }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDarkMode(getTheme() === 'dark');

    const handleThemeChange = () => {
      setIsDarkMode(getTheme() === 'dark');
    };
    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  const toggleDarkMode = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se cierre el menú al hacer clic en el switch
    const newTheme = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

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

  const handleLogout = () => {
    setIsLoggingOut(true);
    setIsOpen(false);
    localStorage.removeItem('skyVaultUserEmail');
    localStorage.removeItem('skyVaultUserId');
    
    supabase.auth.signOut().finally(() => {
      window.location.reload();
    });
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }} className="hide-on-mobile">
          <span style={{ fontSize: '0.95rem', fontWeight: 400, color: 'var(--text-main)' }}>
            {userName || 'Usuario'}
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
            {userEmail}
          </span>
        </div>
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
          minWidth: '220px',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--glass-shadow)'
        }}>
          <div className="show-on-mobile" style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-color, #e5e7eb)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-main)', wordBreak: 'break-word' }}>
              {userName || 'Usuario'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
              {userEmail}
            </div>
          </div>
          
          {/* Switch de Modo Oscuro */}
          <div style={{ padding: '4px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderRadius: '6px',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 500,
                gap: '8px'
              }}
              className="win11-hover"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isDarkMode ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="var(--accent-color)" fillOpacity="0.2" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                )}
                <span>Modo oscuro</span>
              </div>
              <button
                onClick={toggleDarkMode}
                aria-label="Alternar modo oscuro"
                style={{
                  width: '40px',
                  height: '22px',
                  borderRadius: '11px',
                  backgroundColor: isDarkMode ? 'var(--accent-color)' : 'var(--border-color)',
                  position: 'relative',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  transition: 'background-color 0.2s, border-color 0.2s',
                  padding: 0,
                  outline: 'none',
                  flexShrink: 0
                }}
              >
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: isDarkMode ? '#ffffff' : 'var(--text-secondary)',
                    position: 'absolute',
                    top: '3px',
                    left: isDarkMode ? '21px' : '3px',
                    transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                  }}
                />
              </button>
            </div>
          </div>

          <div style={{ padding: '4px' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '12px',
                padding: '10px 16px',
                borderRadius: '6px',
                color: '#ef4444',
                background: 'transparent',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              className="win11-hover"
            >
              <Icon name="logout" size={20} />
              Cerrar Sesión
            </button>
          </div>
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
      <Toast isVisible={isLoggingOut} message="Cerrando Sesión..." />
    </div>
  );
};

export default AvatarMenu;

