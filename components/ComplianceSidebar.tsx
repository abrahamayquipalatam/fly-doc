import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';
import Win11Icon from './Win11Icon';

interface RequiredFile {
  // the control sheet only tracks file name, no consistent id
  name: string;
  downloaded: boolean;
  mimeType: string;
}

interface ComplianceData {
  downloaded: number;
  total: number;
  deadline: string;
  timeLeft: number;
  requiredFiles: RequiredFile[];
}

const ComplianceSidebar = ({ userId, userName, onClose }: { userId: string; userName?: string, onClose?: () => void }) => {
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  useEffect(() => {
    const fetchCompliance = () => {
      const params = new URLSearchParams();
      if (userName) params.set('userName', userName);
      else params.set('userId', userId);
      fetch(`/api/compliance?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          // the server may respond with an error object on failure; avoid
          // treating that as valid compliance data
          if (data.error) {
            console.error('Compliance API error:', data.error);
            setCompliance(null);
            return;
          }

          // ensure `requiredFiles` is always at least an empty array to avoid
          // runtime errors when rendering
          if (!Array.isArray(data.requiredFiles)) {
            data.requiredFiles = [];
          }

          setCompliance(data);
        });
    };

    fetchCompliance();
    const interval = setInterval(fetchCompliance, 10000); // UI sync with server every 10 seconds for faster feedback
    const listener = () => fetchCompliance();
    window.addEventListener('file-downloaded', listener);
    return () => {
      clearInterval(interval);
      window.removeEventListener('file-downloaded', listener);
    };
  }, [userId, userName]);

  useEffect(() => {
    if (!compliance?.deadline) return;

    const updateTimer = () => {
      const deadline = new Date(compliance.deadline).getTime();
      const now = new Date().getTime();
      const diff = deadline - now;
      setRemainingTime(Math.max(0, diff));
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [compliance?.deadline]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!compliance) return (
    <div className="acrylic no-select" style={{
      width: '300px',
      height: '100%',
      borderLeft: '1px solid var(--border-color)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div style={{ height: '24px', width: '150px', background: 'var(--hover-bg)', borderRadius: '4px' }}></div>
      <div style={{ height: '100px', width: '100%', background: 'var(--hover-bg)', borderRadius: '8px' }}></div>
    </div>
  );

  const progress = (compliance.downloaded / compliance.total) * 100;
  const hoursLeft = remainingTime / (1000 * 60 * 60);
  const status = hoursLeft > 24 ? 'EN PLAZO' : hoursLeft > 0 ? 'POR VENCER' : 'VENCIDO';
  const statusColor = hoursLeft > 24 ? '#4CAF50' : hoursLeft > 0 ? '#FF9800' : '#F44336';

  return (
    <aside className="acrylic no-select" style={{
      width: '330px',
      height: '100%',
      borderLeft: '1px solid var(--border-color)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      overflowY: 'auto'
    }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>FlyDoc LATAM Explorer</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Control de Publicaciones</p>
        </div>
        {onClose && (
          <button
            onClick={() => onClose()}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
            className="win11-hover"
          >
            <Icon name="x" size={24} color="var(--text-secondary)" />
          </button>
        )}
      </header>

      <section style={{
        background: 'var(--explorer-bg)',
        padding: '20px',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '8px' }}>Avance de descargas</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '5px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 700 }}>{Math.round(progress)}%</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{compliance.downloaded}/{compliance.total} Archivos</span>
          </div>
        </div>
        <div className="win11-progress">
          <div className="win11-progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      </section>

      <section style={{
        padding: '16px',
        borderRadius: '6px',
        background: `${statusColor}15`,
        border: `1px solid ${statusColor}40`,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: statusColor }}>ESTADO: {status}</span>
          <div style={{ fontSize: '1.2rem' }}>
            {hoursLeft > 24 ? (
              <Icon name="check-circle" size={20} color="#4CAF50" />
            ) : hoursLeft > 0 ? (
              <Icon name="warning" size={20} color="#FF9800" />
            ) : (
              <Icon name="error" size={20} color="#F44336" />
            )}
          </div>
        </div>
        <p style={{ color: statusColor, fontSize: '0.85rem' }}>Tiempo Restante antes de mandar reportar a Jefatura</p>
        <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '-3px' }}>
          {remainingTime > 0 ? (
            <span>{formatTime(remainingTime)}</span>
          ) : (
            <span style={{ color: '#F44336', fontSize: '1.7rem' }}>TIEMPO AGOTADO</span>
          )}
        </div>
        {remainingTime <= 0 && (
          <p style={{ fontSize: '0.75rem', color: '#F44336' }}>Se reportó la falta de descarga de archivos a Jefatura</p>
        )}
      </section>

      <section>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>Archivos que debes descargar</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {(compliance.requiredFiles || []).map((file, idx) => (
            <div key={file.name || idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '10px 12px',
              borderRadius: '6px',
              background: 'var(--explorer-bg)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem'
            }}>
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                border: `2px solid ${file.downloaded ? 'var(--accent-color)' : 'var(--text-secondary)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: file.downloaded ? 'var(--accent-color)' : 'transparent',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {file.downloaded && <span>✓</span>}
              </div>
              <Win11Icon type={file.mimeType} size={22} />
              <span style={{
                flex: 1,
                textDecoration: file.downloaded ? 'line-through' : 'none',
                color: file.downloaded ? 'var(--text-secondary)' : 'var(--text-main)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>{file.name}</span>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ marginTop: 'auto', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
        FlyDoc LATAM Explorer v1.0.0
      </footer>
    </aside>
  );
};

export default ComplianceSidebar;
