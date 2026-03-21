import Win11Icon from './Win11Icon';
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

interface FileListProps {
  files: FileItem[];
  onFolderClick: (file: FileItem) => void;
  onFileClick: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  userId: string;
  userName?: string;
  viewMode?: 'list' | 'grid';
}

const FileList = ({ files, onFolderClick, onFileClick, onDownload, userId, userName, viewMode = 'list' }: FileListProps) => {
  const formatSize = (size?: string) => {
    if (!size) return '---';
    const bytes = parseInt(size);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isFolder = (file: FileItem) => file.mimeType === 'application/vnd.google-apps.folder';

  const sortedFiles = [...files].sort((a, b) => {
    const aIsFolder = isFolder(a);
    const bIsFolder = isFolder(b);
    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;
    return a.name.localeCompare(b.name);
  });

  if (viewMode === 'grid') {
    return (
      <div className="explorer-view" style={{ overflowY: 'auto', height: '100%', padding: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '20px'
        }}>
          {sortedFiles.map(file => (
            <div
              key={file.id}
              className="win11-hover transition-standard pointer"
              onClick={() => isFolder(file) ? onFolderClick(file) : onFileClick(file)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center'
              }}
            >
              <Win11Icon type={file.mimeType} size={48} />
              <span style={{
                fontSize: '0.85rem',
                wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>{file.name}</span>
            </div>
          ))}
        </div>
        {sortedFiles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No se encontraron resultados o la carpeta está vacía
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="explorer-view" style={{ overflowY: 'auto', height: '100%' }}>
      <table className="explorer-table no-select" style={{ width: '100%', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th style={{ width: '65%' }}>Nombre</th>
            <th className="hide-on-tablet" style={{ width: '25%' }}>Fecha de modificación</th>
            <th className="hide-on-tablet" style={{ width: '15%' }}>Tamaño</th>
            <th className="actions-column" style={{ width: '160px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sortedFiles.map(file => (
            <tr key={file.id} className="transition-standard pointer">
              <td onClick={() => isFolder(file) ? onFolderClick(file) : onFileClick(file)}>
                <div className="flex items-center" style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <Win11Icon type={file.mimeType} size={28} />
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: '400',
                    fontSize: '0.9rem'
                  }} title={file.name}>{file.name}</span>
                </div>
              </td>
              <td className="hide-on-tablet" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {formatDate(file.modifiedTime)}
              </td>
              <td className="hide-on-tablet" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {isFolder(file) ? '' : formatSize(file.size)}
              </td>
              <td className="actions-cell">
                <div className="flex items-center" style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', justifyContent: 'flex-start' }}>
                  {!isFolder(file) && (
                    <>
                      <button
                        className="win11-hover action-btn download-btn"
                        title="Descargar"
                        style={{
                          padding: '6px 10px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          color: 'var(--accent-color)',
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: '6px',
                          whiteSpace: 'nowrap',
                          background: 'transparent',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownload(file);
                        }}
                      >
                        <Icon name="download" size={16} />
                        <span className="btn-text">Descargar</span>
                      </button>
                      <button
                        className="win11-hover action-btn preview-btn"
                        title="Ver"
                        style={{
                          padding: '6px 10px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: '6px',
                          whiteSpace: 'nowrap',
                          background: 'transparent',
                          color: 'inherit',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onFileClick(file);
                        }}
                      >
                        <Icon name="eye" size={16} />
                        <span className="btn-text">Ver</span>
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {files.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No se encontraron resultados o la carpeta está vacía
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 640px) {
          .actions-column { width: 80px !important; }
          .btn-text { display: none; }
          .action-btn { padding: 8px !important; }
          .explorer-table td { padding: 8px 10px !important; }
          .explorer-table th { padding: 10px 10px !important; }
        }
      `}} />
    </div>
  );
};

export default FileList;