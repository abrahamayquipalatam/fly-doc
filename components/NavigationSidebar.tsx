'use client';

import React, { useState, useEffect } from 'react';
import Win11Icon from './Win11Icon';
import { Icon } from './Icon';
import Image from 'next/image';
import Logo from '../assets/flydoc-logo-negro.png';
import LogoShort from '../assets/logo-short.png';

interface FileItem {
    id: string;
    name: string;
    mimeType: string;
}

interface NavigationSidebarProps {
    currentFolderId: string;
    rootFolders: { id: string, name: string }[];
    onFolderSelect: (id: string, name: string, path?: { id: string, name: string }[]) => void;
    onFileSelect?: (file: FileItem) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const TreeItem: React.FC<{
    item: FileItem;
    level: number;
    currentFolderId: string;
    onFolderSelect: (id: string, name: string, path?: { id: string, name: string }[]) => void;
    onFileSelect?: (file: FileItem) => void;
    isSidebarCollapsed: boolean;
    path: { id: string, name: string }[];
}> = ({ item, level, currentFolderId, onFolderSelect, onFileSelect, isSidebarCollapsed, path }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [children, setChildren] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
    const isSelected = currentFolderId === item.id;

    // Auto-expand if this item is selected or if we should show its children
    // Removed to keep the tree closed by default as requested.

    const toggleExpand = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!isFolder) return;

        const newExpanded = !isExpanded;
        setIsExpanded(newExpanded);

        if (newExpanded && children.length === 0) {
            setLoading(true);
            try {
                const res = await fetch(`/api/folders/${item.id}`);
                const data = await res.json();
                const fetchedFiles = data.files || [];
                
                // Sort: Folders first, then alphabetically
                const sorted = [...fetchedFiles].sort((a, b) => {
                    const aIsFolder = a.mimeType === 'application/vnd.google-apps.folder';
                    const bIsFolder = b.mimeType === 'application/vnd.google-apps.folder';
                    if (aIsFolder && !bIsFolder) return -1;
                    if (!aIsFolder && bIsFolder) return 1;
                    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });
                });
                
                setChildren(sorted);
            } catch (err) {
                console.error('Error fetching tree children:', err);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleClick = () => {
        if (isFolder) {
            onFolderSelect(item.id, item.name, path);
            if (!isExpanded) toggleExpand();
        } else if (onFileSelect) {
            onFileSelect(item);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button
                onClick={handleClick}
                title={isSidebarCollapsed ? item.name : ''}
                className={`win11-hover transition-standard tree-item-button ${isSelected ? 'selected' : ''}`}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: isSidebarCollapsed ? '8px' : '12px 12px',
                    paddingLeft: isSidebarCollapsed ? '0px' : `${12 + level * 16}px`,
                    borderRadius: isSidebarCollapsed ? '2px' : '6px',
                    background: isSelected ? 'var(--selected-bg)' : 'transparent',
                    textAlign: 'left',
                    width: '100%',
                    fontSize: '0.85rem',
                    color: isSelected ? 'var(--accent-color)' : 'inherit',
                    position: 'relative',
                }}
            >
                {isFolder && !isSidebarCollapsed && (
                    <div
                        onClick={(e) => { e.stopPropagation(); toggleExpand(e); }}
                        style={{
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <Icon
                            name="chevron-right"
                            size={10}
                            style={{
                                transform: isExpanded ? 'rotate(90deg)' : 'none',
                                transition: 'transform 0.2s',
                                opacity: 0.6
                            }}
                        />
                    </div>
                )}
                <Win11Icon type={item.mimeType} size={18} />
                {!isSidebarCollapsed && (
                    <span className="tree-item-text" style={{
                        flex: 1,
                        fontWeight: isSelected ? 600 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>{item.name}</span>
                )}
            </button>
            {isExpanded && !isSidebarCollapsed && (
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
                                isSidebarCollapsed={isSidebarCollapsed}
                                path={[...path, { id: child.id, name: child.name }]}
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

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ currentFolderId, rootFolders, onFolderSelect, onFileSelect, isCollapsed, onToggleCollapse }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isMobile) return null;

    return (
        <aside className={`acrylic no-select transition-standard ${isCollapsed ? 'sidebar-collapsed' : ''}`} style={{
            width: isCollapsed ? '72px' : '260px',
            height: '100%',
            borderRight: '1px solid var(--border-color)',
            padding: '16px 4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            overflowY: 'auto',
            transition: 'width 0.3s ease'
        }}>
            <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isCollapsed ? '8px 0 16px 0' : '8px 12px 16px 24px', flexWrap: 'nowrap' }}>
                {!isCollapsed && (
                    <div className="logo-container">
                        <Image src={Logo} alt="FlyDoc Logo" height={42} style={{ width: 'auto' }} />
                    </div>
                )}
                <button
                    onClick={onToggleCollapse}
                    className="win11-hover"
                    style={{
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: isCollapsed ? 'auto' : '0',
                        marginRight: isCollapsed ? 'auto' : '0',
                        color: '#cacacaff'
                    }}
                    title={isCollapsed ? "Expandir menu" : "Contraer menu"}
                >
                    <Icon name={isCollapsed ? "menu" : "chevron-left"} size={20} />
                </button>
            </div>

            {!isCollapsed && (
                <div className="sidebar-label" style={{
                    color: 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '0 16px 8px 24px',
                    letterSpacing: '0.05em'
                }}>
                    ESTRUCTURA DE ARCHIVOS
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', padding: isCollapsed ? '0 8px' : '0 16px 8px 24px' }}>
                {[...rootFolders]
                    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }))
                    .map((folder) => {
                        const basePath = rootFolders.length > 1 
                            ? [{ id: 'root', name: 'Inicio' }, { id: folder.id, name: folder.name }]
                            : [{ id: folder.id, name: folder.name }];
                            
                        return (
                            <TreeItem
                                key={folder.id}
                                item={{ id: folder.id, name: folder.name, mimeType: 'application/vnd.google-apps.folder' }}
                                level={0}
                                currentFolderId={currentFolderId}
                                onFolderSelect={onFolderSelect}
                                onFileSelect={onFileSelect}
                                isSidebarCollapsed={isCollapsed}
                                path={basePath}
                            />
                        );
                    })}
            </div>
        </aside>
    );
};
export default NavigationSidebar;

