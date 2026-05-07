'use client'

import { useEffect, useState } from 'react';
import Win11Icon from './Win11Icon';
import { Icon } from './Icon';
import { isIOS } from '@/lib/utils';

interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

interface PreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
  onDownload: () => void;
  onLoadComplete?: () => void;
}

const PreviewModal = ({ file, onClose, onDownload, onLoadComplete }: PreviewModalProps) => {
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
  const isDoc = file.mimeType.includes('word') || file.mimeType.includes('document');

  const getPreviewUrl = (file: FileItem) => {
    const base = `/api/files/${file.id}/download`;
    if (isPDF || isDoc) {
      if (isPDF) {
        return isIOS() ? `${base}?preview=true` : `${base}?preview=true#toolbar=1&navpanes=1&scrollbar=1&page=1`;
      }
      return `https://docs.google.com/viewer?srcid=${file.id}&pid=explorer&efh=false&cp=1-3&a=v&chrome=false&embedded=true`;
    }
    if (isImage || isVideo || isAudio) {
      return `${base}?preview=true`;
    }
    return `https://drive.google.com/file/d/${file.id}/preview`;
  };

  const handleDownload = () => {
    onDownload();
  };

  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const truncateFileName = (name: string) => {
    let maxLength = 50; // desktop

    if (screenWidth <= 640) {
      maxLength = 30; // mobile
    } else if (screenWidth <= 1024) {
      maxLength = 50; // tablet
    }

    if (name.length <= maxLength) return name;
    return name.slice(0, maxLength) + '...';
  };

  return (
    <div className="flex-center" style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      zIndex: 99999,
      backdropFilter: 'blur(8px)',
    }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={{
        backgroundColor: 'var(--bg-color)',
        borderRadius: '12px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        width: '94%',
        maxWidth: '1300px',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        animation: 'win-open 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes win-open {
                from { transform: scale(0.9); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
        `}} />
        {/* Title Bar style Win11 */}
        <div style={{
          minHeight: '60px',
          background: 'var(--bg-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-color)',
          userSelect: 'none',
          flexWrap: 'wrap', // 👈 clave responsive
          gap: '8px'
        }}>

          {/* LEFT */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flex: '1 1 auto',
            minWidth: 0 // 👈 evita overflow
          }}>
            <Win11Icon type={file.mimeType} size={22} />

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {truncateFileName(file.name)}
              </span>

              <span style={{
                fontSize: '0.65rem',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Previsualización
              </span>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0
          }}>
            {/* Download */}
            <button
              onClick={handleDownload}
              className="win11-hover"
              style={{
                height: '36px',
                display: 'flex',
                gap: '8px',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'var(--accent-color)',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                padding: '0 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Icon name="download" size={18} />
              <span className="hide-mobile">DESCARGAR</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="win11-hover"
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'var(--text-secondary)',
                borderRadius: '4px',
                border: 'none',
                background: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E81123';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <Icon name="x" size={20} />
            </button>
          </div>

          {/* 🔥 MEDIA QUERY INLINE */}
          <style dangerouslySetInnerHTML={{
            __html: `
                @media (max-width: 640px) {
                  .hide-mobile {
                    display: none;
                  }
                }
              `
          }} />
        </div>
        {/* Preview Content */}
        <div style={{
          flex: 1,
          backgroundColor: isIOS() ? '#2c2c2c' : 'var(--explorer-bg)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          position: 'relative',
          padding: isIOS() ? '20px' : '0'
        }}>
          {isImage ? (
            <img
              src={getPreviewUrl(file)}
              alt={file.name}
              onLoad={onLoadComplete}
              style={{
                maxWidth: isIOS() ? '80%' : '90%',
                maxHeight: isIOS() ? '80%' : '90%',
                objectFit: 'contain',
                background: 'white',
                padding: '10px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                borderRadius: '8px'
              }}
            />
          ) : isVideo ? (
            <video
              controls
              autoPlay
              onLoadedData={onLoadComplete}
              style={{
                maxWidth: isIOS() ? '80%' : '100%',
                maxHeight: isIOS() ? '80%' : '100%',
                borderRadius: '8px'
              }}
            >
              <source src={getPreviewUrl(file)} type={file.mimeType} />
              Tu navegador no soporta la reproducción de video.
            </video>
          ) : isAudio ? (
            <div style={{
              padding: '40px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              maxWidth: isIOS() ? '80%' : '100%'
            }}>
              <audio controls autoPlay onCanPlayThrough={onLoadComplete}>
                <source src={getPreviewUrl(file)} type={file.mimeType} />
                Tu navegador no soporta la reproducción de audio.
              </audio>
            </div>
          ) : isPDF ? (
            <iframe
              src={getPreviewUrl(file)}
              onLoad={onLoadComplete}
              width={isIOS() ? "80%" : "100%"}
              height={isIOS() ? "80%" : "100%"}
              frameBorder="0"
              title={file.name}
              style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
              }}
            />
          ) : (
            <iframe
              src={getPreviewUrl(file)}
              onLoad={onLoadComplete}
              width={isIOS() ? "80%" : "100%"}
              height={isIOS() ? "80%" : "100%"}
              frameBorder="0"
              title={file.name}
              style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;