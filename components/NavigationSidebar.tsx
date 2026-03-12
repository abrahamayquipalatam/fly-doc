'use client';

import React, { useState, useEffect } from 'react';
import Win11Icon from './Win11Icon';
import { Icon } from './Icon';
import Image from 'next/image';
import Logo from '../assets/flydoc-logo-negro.png';

interface FileItem {
    id: string;
    name: string;
    mimeType: string;
}

interface NavigationSidebarProps {
    currentFolderId: string;
    rootFolders: { id: string, name: string }[];
    onFolderSelect: (id: string, name: string) => void;
    onFileSelect?: (file: FileItem) => void;
}

const TreeItem: React.FC<{
    item: FileItem;
    level: number;
    currentFolderId: string;
    onFolderSelect: (id: string, name: string) => void;
    onFileSelect?: (file: FileItem) => void;
}> = ({ item, level, currentFolderId, onFolderSelect, onFileSelect }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [children, setChildren] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
    const isSelected = currentFolderId === item.id;

    const toggleExpand = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isFolder) return;

        const newExpanded = !isExpanded;
        setIsExpanded(newExpanded);

        if (newExpanded && children.length === 0) {
            setLoading(true);
            try {
                const res = await fetch(`/api/folders/${item.id}`);
                const data = await res.json();
                setChildren(data.files || []);
            } catch (err) {
                console.error('Error fetching tree children:', err);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleClick = () => {
        if (isFolder) {
            onFolderSelect(item.id, item.name);
            if (!isExpanded) toggleExpand({ stopPropagation: () => { } } as any);
        } else if (onFileSelect) {
            onFileSelect(item);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button
                onClick={handleClick}
                className={`win11-hover transition-standard ${isSelected ? 'selected' : ''}`}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 12px',
                    paddingLeft: `${12 + level * 16}px`,
                    borderRadius: '6px',
                    background: isSelected ? 'var(--selected-bg)' : 'transparent',
                    textAlign: 'left',
                    width: '100%',
                    fontSize: '0.85rem',
                    color: isSelected ? 'var(--accent-color)' : 'inherit',
                    position: 'relative',
                }}
            >
                {isFolder && (
                    <Icon
                        name="chevron-right"
                        size={10}
                        onClick={toggleExpand}
                        style={{
                            transform: isExpanded ? 'rotate(90deg)' : 'none',
                            transition: 'transform 0.2s',
                            opacity: 0.6
                        }}
                    />
                )}
                {!isFolder && <span style={{ width: '12px' }}></span>}
                <Win11Icon type={item.mimeType} size={18} />
                <span style={{
                    flex: 1,
                    fontWeight: isSelected ? 600 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>{item.name}</span>
            </button>
            {isExpanded && (
                <div className="tree-children">
                    {loading ? (
                        <div style={{ paddingLeft: `${32 + level * 16}px`, fontSize: '0.75rem', width: '100%', textAlign: 'center', padding: '8px 0', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Cargando...
                        </div>
                    ) : (
                        children.map(child => (
                            <TreeItem
                                key={child.id}
                                item={child}
                                level={level + 1}
                                currentFolderId={currentFolderId}
                                onFolderSelect={onFolderSelect}
                                onFileSelect={onFileSelect}
                            />
                        ))
                    )}
                    {!loading && children.length === 0 && (
                        <div style={{ paddingLeft: `${32 + level * 16}px`, fontSize: '0.75rem', width: '100%', textAlign: 'center', padding: '8px 0', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Vacio
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ currentFolderId, rootFolders, onFolderSelect, onFileSelect }) => {
    return (
        <aside className="acrylic no-select" style={{
            width: '260px',
            height: '100%',
            borderRight: '1px solid var(--border-color)',
            padding: '16px 4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            overflowY: 'auto'
        }}>
            <div style={{ padding: '8px 12px 16px 24px' }}>
                <Image src={Logo} alt="FlyDoc Logo" height={42} />
            </div>

            <div style={{
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 700,
                padding: '0 16px 8px 24px',

            }}>
                ESTRUCTURA DE ARCHIVOS
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px 8px 24px' }}>
                {rootFolders.map((folder) => (
                    <TreeItem
                        key={folder.id}
                        item={{ id: folder.id, name: folder.name, mimeType: 'application/vnd.google-apps.folder' }}
                        level={0}
                        currentFolderId={currentFolderId}
                        onFolderSelect={onFolderSelect}
                        onFileSelect={onFileSelect}
                    />
                ))}
            </div>

            <footer style={{ marginTop: 'auto', padding: '16px 0 0 24px', fontSize: '0.7rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600 }}>FlyDoc LATAM Explorer</div>
                <div>v1.0.0</div>
            </footer>
        </aside>
    );
};

export default NavigationSidebar;
