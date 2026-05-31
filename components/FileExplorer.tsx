'use client'

import { useState, useEffect, useCallback } from 'react';
import NavigationSidebar from '../components/NavigationSidebar';
import FileList from '../components/FileList';
import Breadcrumb from '../components/Breadcrumb';
import PreviewModal from '../components/PreviewModal';
import Toast from './Toast';
import { FLOTA_FOLDER_IDS } from '@/config/constants';
import { Icon } from './Icon';
import AvatarMenu from './AvatarMenu';
import { isIOS } from '@/lib/utils';

interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
}

const FileExplorer = ({ userEmail }: { userEmail: string }) => {
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [userName, setUserName] = useState<string>('');
  const [rootFolders, setRootFolders] = useState<{ id: string, name: string }[]>([]);
  const [flota, setFlota] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Obteniendo archivo...');

  // Pagination state & logic
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredFiles.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

  // Reset pagination when search or folder changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentFolder, searchTerm]);

  // fetch user info once at startup
  useEffect(() => {
    fetch(`/api/user?email=${encodeURIComponent(userEmail)}`)
      .then(res => res.json())
      .then(data => {
        if (data.folders && data.folders.length > 0) {
          const sortedFolders = [...data.folders].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }));
          setRootFolders(sortedFolders);
          if (data.folders.length > 1) {
            setCurrentFolder('root');
            setBreadcrumb([{ id: 'root', name: 'Inicio' }]);
          } else {
            setCurrentFolder(data.folders[0].id);
            setBreadcrumb([{ id: data.folders[0].id, name: data.folders[0].name }]);
          }
        } else if (data.folderId) {
          setRootFolders([{ id: data.folderId, name: data.flota ? `Flota ${data.flota}` : 'Google Drive' }]);
          setCurrentFolder(data.folderId);
          setBreadcrumb([{ id: data.folderId, name: data.flota ? `Flota ${data.flota}` : 'Google Drive' }]);
        }
        if (data.name) setUserName(data.name);
        if (data.flota) setFlota(data.flota);
      })
      .catch(err => console.error('failed to fetch user info', err));
  }, [userEmail]);


  const loadFiles = useCallback(() => {
    if (!currentFolder) return;
    setLoading(true);
    setSearchTerm(''); // Limpiar búsqueda al cambiar de carpeta

    if (currentFolder === 'root') {
      const virtualFiles: FileItem[] = rootFolders.map(folder => ({
        id: folder.id,
        name: folder.name,
        mimeType: 'application/vnd.google-apps.folder',
        modifiedTime: new Date().toISOString()
      }));
      setFiles(virtualFiles);
      setLoading(false);
      return;
    }

    fetch(`/api/folders/${currentFolder}`)
      .then(res => res.json())
      .then(async data => {
        const fetched = data.files || [];
        setFiles(fetched);

        // Update breadcrumb with official folder name from API
        setBreadcrumb(prev => {
          const idx = prev.findIndex(item => item.id === currentFolder);
          if (idx !== -1) {
            const newBreadcrumb = [...prev];
            newBreadcrumb[idx] = { id: currentFolder, name: data.folderName || newBreadcrumb[idx].name };
            return newBreadcrumb;
          }
          return prev;
        });

        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching folder:', err);
        setLoading(false);
      });
  }, [currentFolder, rootFolders]);

  // load files whenever currentFolder changes
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFolderClick = (folder: FileItem) => {
    setCurrentFolder(folder.id);
    setBreadcrumb([...breadcrumb, { id: folder.id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    setBreadcrumb(newBreadcrumb);
    setCurrentFolder(newBreadcrumb[newBreadcrumb.length - 1].id);
  };

  const handleDownload = async (file: FileItem) => {
    const url = `/api/files/${file.id}/download`;
    setToastMessage('Obteniendo archivo...');
    setShowToast(true);

    if (isIOS()) {
      try {
        if (!navigator.share || !navigator.canShare) {
          setToastMessage('Web Share API no disponible en este dispositivo iOS');
          return;
        }

        const response = await fetch(url, { credentials: 'same-origin' });
        if (!response.ok) {
          throw new Error('No se pudo obtener el archivo para compartir');
        }

        const blob = await response.blob();
        const sharedFile = new File([blob], file.name, { type: file.mimeType || 'application/octet-stream' });

        if (!navigator.canShare({ files: [sharedFile] })) {
          setToastMessage('Web Share API no soporta archivos en este dispositivo iOS');
          return;
        }

        //setToastMessage('Abriendo el diálogo de compartir...');
        await navigator.share({
          files: [sharedFile]
        });
        //setToastMessage('Compartir completado.');
      } catch (error: any) {
        const cancelled = error?.name === 'AbortError' || /cancel/i.test(error?.message || '');
        if (cancelled) {
          //setToastMessage('Compartir cancelado.');
        } else {
          console.error('Error sharing file on iOS:', error);
          setToastMessage('Error al guardar el archivo.');
        }
      } finally {
        setTimeout(() => setShowToast(false), 3000);
      }
      return;
    }

    // Para otros dispositivos (Android, Windows), usamos un link temporal con atributo download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', file.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSidebarFolderSelect = (id: string, name: string, path?: { id: string; name: string }[]) => {
    setCurrentFolder(id);
    if (path) {
      setBreadcrumb(path);
    } else {
      setBreadcrumb([{ id, name }]);
    }
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    handleResize(); // initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden', position: 'relative' }}>

      <NavigationSidebar
        currentFolderId={currentFolder}
        rootFolders={rootFolders}
        onFolderSelect={handleSidebarFolderSelect}
        onFileSelect={(file: any) => { setShowToast(true); setPreviewFile(file as any); }}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--explorer-bg)',
        position: 'relative',
        overflow: 'hidden',
        padding: '0px 0px', // Removed top padding to let breadcrumb sit at the top
      }}>
        <div className="breadcrumb-mobile">
          <Breadcrumb breadcrumb={breadcrumb} onClick={handleBreadcrumbClick} />
        </div>

        {/* Barra de herramientas superior estilo Win11 */}
        <header style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => handleBreadcrumbClick(Math.max(0, breadcrumb.length - 2))}
              style={{ padding: '4px', opacity: breadcrumb.length > 1 ? 1 : 0.3 }}
              disabled={breadcrumb.length <= 1}
            >
              <Icon name="arrow-left" size={20} />
            </button>

            <div className="breadcrumb-desktop">
              <Breadcrumb breadcrumb={breadcrumb} onClick={handleBreadcrumbClick} />
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '0.85rem',
                minWidth: '150px',
                flex: 1,
                maxWidth: '300px'
              }}>
                <Icon name="search" size={16} className="text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ background: 'transparent', outline: 'none', border: 'none', color: 'inherit', width: '100%' }}
                />
              </div>

              <AvatarMenu userEmail={userEmail} userName={userName} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setViewMode('list')}
                className={`win11-hover ${viewMode === 'list' ? 'selected' : ''}`}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: viewMode === 'list' ? 'var(--selected-bg)' : 'transparent',
                  border: '1px solid ' + (viewMode === 'list' ? 'var(--accent-color)' : 'transparent'),
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon name="list" size={16} /> Lista
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`win11-hover ${viewMode === 'grid' ? 'selected' : ''}`}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: viewMode === 'grid' ? 'var(--selected-bg)' : 'transparent',
                  border: '1px solid ' + (viewMode === 'grid' ? 'var(--accent-color)' : 'transparent'),
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon name="layout-grid" size={16} /> Cuadrícula
              </button>
            </div>
            <button
              onClick={loadFiles}
              disabled={loading}
              className="win11-hover"
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                whiteSpace: 'nowrap',
                color: 'inherit',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              <Icon name="refresh" size={16} className={loading ? 'animate-spin' : ''} /> Recargar
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex-center" style={{ flex: 1 }}>
            <div className="animate-spin" style={{
              width: '40px',
              height: '40px',
              border: '4px solid var(--accent-color)',
              borderTopColor: 'transparent',
              borderRadius: '50%'
            }}></div>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <FileList
                files={paginatedFiles}
                onFolderClick={handleFolderClick}
                onFileClick={(file: FileItem) => { setShowToast(true); setPreviewFile(file); }}
                onDownload={handleDownload}
                viewMode={viewMode}
              />
            </div>

            {/* Componente inferior de paginación */}
            <div style={{
              padding: '12px 24px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'var(--bg-color)',
              userSelect: 'none',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              gap: '12px',
              flexWrap: 'wrap',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="win11-hover"
                  style={{
                    padding: '6px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.4 : 1,
                    color: 'inherit'
                  }}
                >
                  <span>&lt; Anterior</span>
                </button>

                <span style={{ fontWeight: 500 }}>
                  Página {currentPage} de {totalPages} ({filteredFiles.length} archivos)
                </span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="win11-hover"
                  style={{
                    padding: '6px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.4 : 1,
                    color: 'inherit'
                  }}
                >
                  <span>Siguiente &gt;</span>
                </button>
              </div>
            </div>
          </>
        )}

        {previewFile && (
          <PreviewModal
            file={previewFile}
            onClose={() => { setPreviewFile(null); setShowToast(false); }}
            onDownload={() => handleDownload(previewFile)}
            onLoadComplete={() => setShowToast(false)}
          />
        )}

        <Toast isVisible={showToast} message={toastMessage} />
      </main>
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 768px) {
          aside {
            display: none !important;
          }
        }
        
        /* Breadcrumb Desktop vs Mobile logic */
        @media (min-width: 1025px) {
          .breadcrumb-mobile {
            display: none !important;
          }
          .breadcrumb-desktop {
            display: block !important;
          }
        }
        
        @media (max-width: 1024px) {
          .breadcrumb-mobile {
            display: block !important;
          }
          .breadcrumb-desktop {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
};

export default FileExplorer;