'use client'

import { useState, useEffect } from 'react';
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


  // load files whenever currentFolder changes
  useEffect(() => {
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
  }, [currentFolder, userName, rootFolders]);

  const handleFolderClick = (folder: FileItem) => {
    setCurrentFolder(folder.id);
    setBreadcrumb([...breadcrumb, { id: folder.id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    setBreadcrumb(newBreadcrumb);
    setCurrentFolder(newBreadcrumb[newBreadcrumb.length - 1].id);
  };

  const handleDownload = (file: FileItem) => {
    // Initiates download via API route
    setShowToast(true);
    const url = `/api/files/${file.id}/download`;

    if (isIOS()) {
      // En iOS, usar el visor nativo y abrir en nueva pestaña para evitar bloqueos de PWA/Safari
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } else {
      // Para otros dispositivos (Android, Windows), usamos un link temporal con atributo download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Hide toast after a reasonable time for download to start
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

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
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
            <FileList
              files={files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))}
              onFolderClick={handleFolderClick}
              onFileClick={(file: FileItem) => { setShowToast(true); setPreviewFile(file); }}
              onDownload={handleDownload}
              viewMode={viewMode}
            />
          )}

          {previewFile && (
            <PreviewModal
              file={previewFile}
              onClose={() => { setPreviewFile(null); setShowToast(false); }}
              onDownload={() => handleDownload(previewFile)}
              onLoadComplete={() => setShowToast(false)}
            />
          )}

          <Toast isVisible={showToast} message="Obteniendo archivo..." />
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