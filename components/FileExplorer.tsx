'use client'

import { useState, useEffect } from 'react';
import NavigationSidebar from '../components/NavigationSidebar';
import ComplianceSidebar from '../components/ComplianceSidebar';
import FileList from '../components/FileList';
import Breadcrumb from '../components/Breadcrumb';
import PreviewModal from '../components/PreviewModal';
import { FLOTA_FOLDER_IDS } from '@/config/constants';
import { Icon } from './Icon';

interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
}

const FileExplorer = ({ userId }: { userId: string }) => {
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [userName, setUserName] = useState<string>('');
  const [flotaFolderId, setFlotaFolderId] = useState<string>('');
  const [flota, setFlota] = useState<string>('');

  // fetch user info (name, flota, folderId) once at startup
  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.folderId) {
          setFlotaFolderId(data.folderId);
          setCurrentFolder(data.folderId);
        }
        if (data.name) setUserName(data.name);
        if (data.flota) setFlota(data.flota);
        // breadcrumb initial
        if (data.folderId) setBreadcrumb([{ id: data.folderId, name: data.flota ? `Flota ${data.flota}` : 'Google Drive' }]);
      })
      .catch(err => console.error('failed to fetch user info', err));
  }, []);

  // load files whenever currentFolder changes
  useEffect(() => {
    if (!currentFolder) return;
    setLoading(true);
    setSearchTerm(''); // Limpiar búsqueda al cambiar de carpeta
    fetch(`/api/folders/${currentFolder}${userName ? `?userName=${encodeURIComponent(userName)}` : ''}`)
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
        // initialize control sheet rows for this user and these downloadables
        if (userName) {
          try {
            const downloadable = fetched.filter((f: any) => f.mimeType !== 'application/vnd.google-apps.folder');
            await fetch('/api/control', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userName, files: downloadable.map((f: any) => ({ id: f.id, name: f.name })) }),
            });
          } catch (err) {
            console.error('failed to init control rows', err);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching folder:', err);
        setLoading(false);
      });
  }, [currentFolder, userName]);

  const handleFolderClick = (folder: FileItem) => {
    setCurrentFolder(folder.id);
    setBreadcrumb([...breadcrumb, { id: folder.id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    setBreadcrumb(newBreadcrumb);
    setCurrentFolder(newBreadcrumb[newBreadcrumb.length - 1].id);
  };

  const handleSidebarFolderSelect = (id: string, name: string) => {
    setCurrentFolder(id);
    setBreadcrumb([{ id, name }]);
  };

  // only show the folder that corresponds to the user's flota, if known
  const rootFolderConfigs = flotaFolderId
    ? [{ id: flotaFolderId, name: flota ? `Flota ${flota}` : 'Mi carpeta' }]
    : [];

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      <NavigationSidebar
        currentFolderId={currentFolder}
        rootFolders={rootFolderConfigs}
        onFolderSelect={handleSidebarFolderSelect}
        onFileSelect={(file) => setPreviewFile(file as any)}
      />

      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--explorer-bg)',
        position: 'relative',
        overflow: 'hidden',
        padding: '20px 0px'
      }}>
        {/* Barra de herramientas superior estilo Win11 */}
        <header style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => handleBreadcrumbClick(Math.max(0, breadcrumb.length - 2))}
              style={{ padding: '4px', opacity: breadcrumb.length > 1 ? 1 : 0.3 }}
              disabled={breadcrumb.length <= 1}
            >
              <Icon name="arrow-left" size={20} />
            </button>
            <Breadcrumb breadcrumb={breadcrumb} onClick={handleBreadcrumbClick} />
            <div style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              fontSize: '0.85rem'
            }}>
              <Icon name="search" size={16} className="text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar en esta carpeta"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', outline: 'none', border: 'none', color: 'inherit', width: '200px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
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
                border: '1px solid ' + (viewMode === 'list' ? 'var(--accent-color)' : 'transparent')
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
                border: '1px solid ' + (viewMode === 'grid' ? 'var(--accent-color)' : 'transparent')
              }}
            >
              <Icon name="layout-grid" size={16} /> Cuadrícula
            </button>
          </div>
          {/* Las opciones de Nuevo, Pegar, Cortar y Copiar han sido eliminadas por solicitud del usuario */}
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
            onFileClick={(file) => setPreviewFile(file)}
            userId={userId}
            userName={userName}
            viewMode={viewMode}
          />
        )}

        {previewFile && (
          <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} userId={userId} userName={userName} />
        )}
      </main>

      <ComplianceSidebar userId={userId} userName={userName} />
    </div>
  );
};

export default FileExplorer;