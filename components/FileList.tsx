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
  userId: string;
  userName?: string;
  viewMode?: 'list' | 'grid';
}

const FileList = ({ files, onFolderClick, onFileClick, userId, userName, viewMode = 'list' }: FileListProps) => {
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
      <table className="explorer-table no-select" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th style={{ width: 'auto', minWidth: '200px' }}>Nombre</th>
            <th className="hide-on-tablet" style={{ width: '25%' }}>Fecha de modificación</th>
            <th className="hide-on-tablet" style={{ width: '15%' }}>Tamaño</th>
            <th style={{ width: '180px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sortedFiles.map(file => (
            <tr key={file.id} className="transition-standard pointer">
              <td onClick={() => isFolder(file) ? onFolderClick(file) : onFileClick(file)}>
                <div className="flex items-center" style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <Win11Icon type={file.mimeType} size={28} />
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: '400'
                  }} title={file.name}>{file.name}</span>
                </div>
              </td>
              <td className="hide-on-tablet" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {formatDate(file.modifiedTime)}
              </td>
              <td className="hide-on-tablet" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {isFolder(file) ? '' : formatSize(file.size)}
              </td>
              <td>
                <div className="flex items-center gap-2" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {!isFolder(file) && (
                    <>
                      <a
                        href={`/api/files/${file.id}/download?userId=${userId}${userName ? `&userName=${encodeURIComponent(userName)}` : ''}`}
                        className="win11-hover"
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
                          gap: '4px',
                          whiteSpace: 'nowrap'
                        }}

                        onClick={(e) => {
                          e.stopPropagation();
                          // notify sidebar that a file download was initiated
                          window.dispatchEvent(new Event('file-downloaded'));
                        }}
                      >
                        <Icon name="download" size={16} />
                        Descargar
                      </a>
                      <button
                        className="win11-hover"
                        style={{
                          padding: '4px 8px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onFileClick(file);
                        }}
                      >
                        <Icon name="eye" size={16} />
                        Ver
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
                {/* Si hay archivos pero el filtro los quita todos, mostramos 'No se encontraron resultados' */}
                No se encontraron resultados o la carpeta está vacía
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FileList;