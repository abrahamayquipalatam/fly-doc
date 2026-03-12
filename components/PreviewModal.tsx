'use client'

import { useEffect } from 'react';
import Win11Icon from './Win11Icon';
import { Icon } from './Icon';

interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

interface PreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
  userId: string;
  userName?: string;
}

const PreviewModal = ({ file, onClose, userId, userName }: PreviewModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!file) return null;

  const isImage = file.mimeType.includes('image');
  const isPDF = file.mimeType.includes('pdf');
  const isVideo = file.mimeType.includes('video');
  const isAudio = file.mimeType.includes('audio');

  const getPreviewUrl = (file: FileItem) => {
    const base = `/api/files/${file.id}/download?userId=${userId}${userName ? `&userName=${encodeURIComponent(userName)}` : ''}`;
    if (isImage || isPDF || isVideo || isAudio) {
      // Usar nuestro propio proxy para tipos que el navegador puede renderizar directamente
      return `${base}&preview=true`;
    }
    // Para otros archivos, usar el visor oficial de Google Drive
    return `https://drive.google.com/file/d/${file.id}/preview`;
  };

  return (
    <div className="flex-center" style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-color)',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        width: '90%',
        maxWidth: '1200px',
        height: '85vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        animation: 'win-open 0.2s cubic-bezier(0, 0, 0.2, 1)'
      }}>
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes win-open {
                from { transform: scale(0.95); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
        `}} />

        {/* Title Bar style Win11 */}
        <div style={{
          height: '50px',
          background: 'var(--bg-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 8px',
          borderBottom: '1px solid var(--border-color)',
          userSelect: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
            <Win11Icon type={file.mimeType} size={20} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{file.name} - Previsualización</span>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8px',
          }}>
            <a
              href={file.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                height: '32px',
                padding: '0px 16px',
                background: 'var(--accent-color)',
                color: 'white',
                borderRadius: '4px',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Abrir con Google Drive
              <div style={{ marginLeft: '4px' }}>
                <Icon name="external-link" size={14} />
              </div>
            </a>
            <button
              onClick={onClose}
              className="win11-hover"
              style={{
                width: '46px',
                height: '35px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#666',
                borderTopRightRadius: '8px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E81123', e.currentTarget.style.color = 'white')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent', e.currentTarget.style.color = '#666')}
            >
              <Icon name="x" size={20} />
            </button>
          </div>
        </div>
        {/* Preview Content */}
        <div style={{ flex: 1, backgroundColor: '#f0f2f5', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
          {isImage ? (
            <img
              src={getPreviewUrl(file)}
              alt={file.name}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', background: 'white', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
          ) : isVideo ? (
            <video
              controls
              autoPlay
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            >
              <source src={getPreviewUrl(file)} type={file.mimeType} />
              Tu navegador no soporta la reproducción de video.
            </video>
          ) : isAudio ? (
            <div style={{ padding: '40px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <audio controls autoPlay>
                <source src={getPreviewUrl(file)} type={file.mimeType} />
                Tu navegador no soporta la reproducción de audio.
              </audio>
            </div>
          ) : (
            <iframe
              src={getPreviewUrl(file)}
              width="100%"
              height="100%"
              frameBorder="0"
              title={file.name}
              style={{ background: 'white' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;