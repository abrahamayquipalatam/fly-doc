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

  const rootFolderConfigs = flotaFolderId
    ? [{ id: flotaFolderId, name: flota ? `Flota ${flota}` : 'Mi carpeta' }]
    : [];

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [complianceVisible, setComplianceVisible] = useState(false);

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
        rootFolders={rootFolderConfigs}
        onFolderSelect={handleSidebarFolderSelect}
        onFileSelect={(file) => setPreviewFile(file as any)}
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
        padding: '20px 0px',
        zIndex: 1
      }}>
        {/* Barra de herramientas superior estilo Win11 */}
        <header style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => handleBreadcrumbClick(Math.max(0, breadcrumb.length - 2))}
                style={{ padding: '4px', opacity: breadcrumb.length > 1 ? 1 : 0.3 }}
                disabled={breadcrumb.length <= 1}
              >
                <Icon name="arrow-left" size={20} />
              </button>
              <Breadcrumb breadcrumb={breadcrumb} onClick={handleBreadcrumbClick} />
            </div>
            
            <div style={{
              marginLeft: 'auto',
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

            <button
              onClick={() => setComplianceVisible(!complianceVisible)}
              className="win11-hover"
              style={{
                display: 'none', // Shown only on tablet via media query (handled by class)
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
              }}
              id="compliance-toggle-btn"
            >
              <Icon name="info" size={20} color={complianceVisible ? 'var(--accent-color)' : 'inherit'} />
            </button>
            <style dangerouslySetInnerHTML={{ __html: `
              @media (max-width: 1024px) {
                #compliance-toggle-btn { display: flex !important; }
              }
            `}} />
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
            onFileClick={(file: FileItem) => setPreviewFile(file)}
            userId={userId}
            userName={userName}
            viewMode={viewMode}
          />
        )}

        {previewFile && (
          <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} userId={userId} userName={userName} />
        )}
      </main>

      {/* Compliance Sidebar - On desktop it's fixed, on tablet it can be toggled */}
      <aside className={`compliance-container ${complianceVisible ? 'visible' : ''}`} style={{
        height: '100%',
        zIndex: 10,
        transition: 'transform 0.3s ease-in-out',
        background: 'var(--bg-color)',
      }}>
        <ComplianceSidebar userId={userId} userName={userName} />
      </aside>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
          .compliance-container {
            position: absolute;
            right: 0;
            top: 0;
            transform: translateX(100%);
            box-shadow: -10px 0 30px rgba(0,0,0,0.1);
          }
          .compliance-container.visible {
            transform: translateX(0);
          }
        }
        @media (min-width: 1025px) {
          .compliance-container {
            display: block !important;
            transform: none !important;
            position: relative !important;
          }
        }
      `}} />
    </div>
  );
};

export default FileExplorer;