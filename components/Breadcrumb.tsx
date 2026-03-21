import React from 'react';
import { Icon } from './Icon';

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface BreadcrumbProps {
  breadcrumb: BreadcrumbItem[];
  onClick: (index: number) => void;
}

const Breadcrumb = ({ breadcrumb, onClick }: BreadcrumbProps) => (
  <nav style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 12px',
    background: 'var(--explorer-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    height: '34px',
    overflowX: 'hidden',
    whiteSpace: 'nowrap',
    fontSize: '0.85rem'
  }}>
    {breadcrumb.map((item, index) => (
      <React.Fragment key={item.id}>
        <button
          onClick={() => onClick(index)}
          style={{
            padding: '2px 8px',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            fontWeight: index === breadcrumb.length - 1 ? 600 : 400,
            gap: '4px'
          }}
        >
          {index === 0 ? (
            <Icon name="home" size={16} color="#555555ff" />
          ) : (
            item.name
          )}
        </button>
        {index < breadcrumb.length - 1 && (
          <Icon name="chevron-right" size={10} className="text-neutral-400" />
        )}
      </React.Fragment>
    ))}
  </nav>
);

export default Breadcrumb;