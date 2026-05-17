'use client'

import { useEffect, useRef, useState } from 'react';
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

  const pdfContainerRef = useRef<HTMLDivElement | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!file || !isPDF || !isIOS()) return;

    let cancelled = false;
    const container = pdfContainerRef.current;

    const renderPdf = async () => {
      setLoadingPdf(true);
      setPdfError(null);

      try {
        const loadPdfJs = async () => {
          if (typeof window === 'undefined') return null;
          if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

          return new Promise<any>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.122/pdf.min.js';
            script.async = true;
            script.onload = () => {
              const pdfjsLib = (window as any).pdfjsLib;
              if (!pdfjsLib) {
                reject(new Error('No se pudo cargar pdf.js'));
                return;
              }
              resolve(pdfjsLib);
            };
            script.onerror = () => reject(new Error('No se pudo cargar pdf.js'));
            document.body.appendChild(script);
          });
        };

        const pdfjsLib = await loadPdfJs();
        if (!pdfjsLib) {
          throw new Error('pdf.js no está disponible');
        }

        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.122/pdf.worker.min.js';

        const response = await fetch(`/api/files/${file.id}/download?preview=true`);
        if (!response.ok) {
          throw new Error('No se pudo cargar el PDF');
        }

        const data = await response.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;

        if (cancelled || !container) return;

        container.innerHTML = '';

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          if (cancelled) return;

          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1 });
          const maxWidth = Math.min(container.clientWidth - 32, 1100);
          const scale = maxWidth / viewport.width;
          const scaledViewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = scaledViewport.width;
          canvas.height = scaledViewport.height;
          canvas.style.width = '100%';
          canvas.style.maxWidth = '1100px';
          canvas.style.borderRadius = '8px';
          canvas.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
          canvas.style.marginBottom = '18px';
          canvas.style.background = 'white';

          if (!context) {
            throw new Error('No se pudo renderizar la página del PDF');
          }

          await page.render({ canvasContext: context, viewport: scaledViewport }).promise;

          const pageWrapper = document.createElement('div');
          pageWrapper.style.display = 'flex';
          pageWrapper.style.justifyContent = 'center';
          pageWrapper.appendChild(canvas);
          container.appendChild(pageWrapper);
        }

        if (!cancelled) {
          onLoadComplete?.();
        }
      } catch (error) {
        if (!cancelled) {
          setPdfError((error as Error).message || 'Error al cargar el PDF');
        }
      } finally {
        if (!cancelled) {
          setLoadingPdf(false);
        }
      }
    };

    renderPdf();

    return () => {
      cancelled = true;
      if (container) container.innerHTML = '';
    };
  }, [file, isPDF, onLoadComplete]);

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
              <span className="hide-mobile">Descargar</span>
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
          backgroundColor: isIOS() ? '#1e1e1e' : 'var(--explorer-bg)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          position: 'relative',
          padding: 0
        }}>
          {isImage ? (
            <img
              src={getPreviewUrl(file)}
              alt={file.name}
              onLoad={onLoadComplete}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                boxShadow: isIOS() ? 'none' : '0 10px 30px rgba(0,0,0,0.1)',
                borderRadius: isIOS() ? '0' : '8px'
              }}
            />
          ) : isVideo ? (
            <video
              controls
              autoPlay
              onLoadedData={onLoadComplete}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: isIOS() ? '0' : '8px'
              }}
            >
              <source src={getPreviewUrl(file)} type={file.mimeType} />
              Tu navegador no soporta la reproducción de video.
            </video>
          ) : isAudio ? (
            <div style={{
              padding: isIOS() ? '20px' : '40px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              maxWidth: '90%'
            }}>
              <audio controls autoPlay onCanPlayThrough={onLoadComplete}>
                <source src={getPreviewUrl(file)} type={file.mimeType} />
                Tu navegador no soporta la reproducción de audio.
              </audio>
            </div>
          ) : isPDF ? (
            isIOS() ? (
              <div style={{
                width: '100%',
                height: '100%',
                overflowY: 'auto',
                padding: '20px',
                boxSizing: 'border-box'
              }}>
                {loadingPdf && (
                  <div style={{
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                    marginTop: '24px'
                  }}>
                    Cargando PDF…
                  </div>
                )}
                {pdfError && (
                  <div style={{
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                    marginTop: '24px'
                  }}>
                    {pdfError}
                  </div>
                )}
                <div
                  ref={pdfContainerRef}
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                />
              </div>
            ) : (
              <iframe
                src={getPreviewUrl(file)}
                onLoad={onLoadComplete}
                width="100%"
                height="100%"
                frameBorder="0"
                title={file.name}
                style={{
                  background: 'white',
                  borderRadius: isIOS() ? '0' : '8px',
                  boxShadow: isIOS() ? 'none' : '0 10px 30px rgba(0,0,0,0.1)'
                }}
              />
            )
          ) : (
            <iframe
              src={getPreviewUrl(file)}
              onLoad={onLoadComplete}
              width="100%"
              height="100%"
              frameBorder="0"
              title={file.name}
              style={{
                background: 'white',
                borderRadius: isIOS() ? '0' : '8px',
                boxShadow: isIOS() ? 'none' : '0 10px 30px rgba(0,0,0,0.1)'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;