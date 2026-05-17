'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import logo from '../assets/flydoc-logo-negro.png';
import { supabase } from '../lib/supabaseClient';

interface LoginProps {
  onLoginSuccess: (userData: { name: string; email: string; flota: string; folderId: string }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user?.email) {
        await handleBackendAuth(session.user.email);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        await handleBackendAuth(session.user.email);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBackendAuth = async (email: string) => {
    setLoading(true);

    if (!email.toLowerCase().endsWith('@latam.com')) {
      setError('Acceso denegado: solo correos @latam.com permitidos.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        onLoginSuccess(data);
      } else {
        setError(data.error || 'Acceso denegado: tu correo no está registrado en el sistema.');
        await supabase.auth.signOut();
      }
    } catch (err) {
      setError('Error de conexión al validar perfil.');
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      padding: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'url("/background.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      fontFamily: '"Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande", "Lucida Sans", Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255)',
        backdropFilter: 'blur(12px)',
        borderRadius: '8px',
        padding: '45px 50px',
        width: '100%',
        maxWidth: '440px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ marginBottom: '10px', textAlign: 'center' }}>
          <Image src={logo} alt="FlyDoc Logo" height={80} style={{ objectFit: 'contain' }} />
          <p style={{ fontSize: '1rem', color: '#4b5563', marginTop: '10px' }}>Gestiona tus documentos con un solo clic</p>
        </div>

        {error && (
          <div style={{
            width: '100%',
            backgroundColor: '#fef2f2',
            borderLeft: '4px solid #ef4444',
            color: '#991b1b',
            padding: '16px',
            marginBottom: '32px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            textAlign: 'left'
          }}>
            <div style={{ fontWeight: '700', marginBottom: '2px' }}>Error de acceso</div>
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: 'white',
            color: '#1f2937',
            padding: '16px 32px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: '1.05rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            filter: loading ? 'grayscale(0.5) opacity(0.8)' : 'none'
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
            }
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="spinner" style={{
                width: '20px',
                height: '20px',
                border: '3px solid rgba(0,0,0,0.1)',
                borderTop: '3px solid #111827',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span>Cargando perfil...</span>
            </div>
          ) : (
            <>
              <svg width="22" height="22" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continuar con Google</span>
            </>
          )}
        </button>

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{ marginTop: '16px', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', fontWeight: '500' }}>
          &copy; 2026 FlyDoc Portal &sdot; Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}
