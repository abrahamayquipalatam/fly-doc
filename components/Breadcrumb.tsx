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

const Breadcrumb = ({ breadcrumb, onClick }: BreadcrumbProps) => {
  const MAX_ITEMS = 3; // Number of items to show from the end if truncated
  const isTruncated = breadcrumb.length > MAX_ITEMS + 1;

  const itemsToDisplay = isTruncated
    ? [breadcrumb[0], ...breadcrumb.slice(-MAX_ITEMS)]
    : breadcrumb;

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '0 16px',
      background: 'var(--explorer-bg)',
      border: '1px solid var(--border-color)',
      borderRadius: '4px',
      height: '40px',
      width: '100%',
      overflowX: 'hidden',
      whiteSpace: 'nowrap',
      fontSize: '0.85rem',
      flexShrink: 0,
      zIndex: 10
    }}>
      {itemsToDisplay.map((item, index) => {
        // Find original index for onClick
        const originalIndex = isTruncated
          ? (index === 0 ? 0 : breadcrumb.length - MAX_ITEMS + (index - 1))
          : index;

        const isLast = index === itemsToDisplay.length - 1;

        return (
          <React.Fragment key={item.id + index}>
            <button
              onClick={() => onClick(originalIndex)}
              className="win11-hover"
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                fontWeight: isLast ? 600 : 400,
                gap: '6px',
                color: isLast ? 'var(--text-primary)' : 'var(--text-secondary)',
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {originalIndex === 0 ? (
                <Icon name="home" size={16} />
              ) : (
                item.name
              )}
            </button>

            {index === 0 && isTruncated && (
              <>
                <Icon name="chevron-right" size={10} className="text-neutral-500" />
                <span style={{ padding: '0 4px', color: 'var(--text-secondary)' }}>...</span>
              </>
            )}

            {!isLast && (
              <Icon name="chevron-right" size={10} className="text-neutral-500" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;