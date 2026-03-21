"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface App {
    id: string;
    name: string;
    url: string;
}

// Mock service for now, as Supabase is not configured in this project yet
const fetchApps = async (): Promise<App[]> => {
    return [
        { id: '1', name: 'Corporativo 01', url: '/?folder=root' },
        { id: '2', name: 'Manuales de Piloto', url: '/' },
        { id: '3', name: 'Protocolos de Seguridad', url: '/' },
        { id: '4', name: 'Configuración', url: '/settings' },
        { id: '5', name: 'Perfil de Usuario', url: '/profile' },
    ];
};

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [apps, setApps] = useState<App[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadApps = async () => {
            try {
                const data = await fetchApps();
                setApps(data);
            } catch (error) {
                console.error('Error loading apps:', error);
            }
        };
        loadApps();
    }, []);

    const filteredApps = apps.filter(app =>
        app.name.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen((open) => !open);
            }

            if (!isOpen) return;

            if (e.key === "Escape") {
                e.preventDefault();
                setIsOpen(false);
            }

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredApps.length));
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filteredApps.length) % Math.max(1, filteredApps.length));
            }

            if (e.key === "Enter") {
                e.preventDefault();
                if (filteredApps[selectedIndex]) {
                    handleSelect(filteredApps[selectedIndex].url);
                }
            }
        };

        const handleOpen = () => setIsOpen(true);

        document.addEventListener("keydown", handleKeyDown);
        window.addEventListener("open-command-palette", handleOpen);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("open-command-palette", handleOpen);
        };
    }, [isOpen, filteredApps, selectedIndex]);

    const handleSelect = (url: string) => {
        if (url.startsWith('http')) {
            window.open(url, '_blank');
        } else {
            router.push(url);
        }
        setIsOpen(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[15vh]">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[4px]"
                        onClick={() => setIsOpen(false)}
                    ></motion.div>

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-[600px] bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xl"
                        style={{ background: 'var(--explorer-bg)', color: 'var(--text-main)', borderColor: 'var(--border-color)' }}
                    >
                        {/* Search Input Area */}
                        <div className="p-6 pb-4 flex items-center gap-4">
                            <Icon name="search" size={22} className="text-neutral-400" />
                            <input
                                ref={inputRef}
                                autoFocus
                                type="text"
                                placeholder="Buscar aplicación o archivo..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-xl font-medium placeholder:text-neutral-400"
                                style={{ color: 'var(--text-main)' }}
                            />
                            <div
                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-neutral-200 bg-neutral-50 cursor-pointer"
                                style={{ background: 'var(--hover-bg)', borderColor: 'var(--border-color)' }}
                                onClick={() => setIsOpen(false)}
                            >
                                <span className="text-[10px] font-black text-neutral-400 tracking-tight">Esc</span>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-[1px] bg-neutral-100 mx-6" style={{ background: 'var(--border-color)' }}></div>

                        {/* Results List */}
                        <div className="py-4 max-h-[400px] overflow-y-auto no-scrollbar">
                            <div className="px-2">
                                {filteredApps.map((app, i) => (
                                    <button
                                        key={app.id}
                                        onClick={() => handleSelect(app.url)}
                                        onMouseEnter={() => setSelectedIndex(i)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-6 py-4 group transition-all rounded-lg",
                                            selectedIndex === i ? "bg-neutral-100" : "hover:bg-neutral-50/50"
                                        )}
                                        style={{
                                            background: selectedIndex === i ? 'var(--hover-bg)' : 'transparent',
                                        }}
                                    >
                                        <div className="text-left">
                                            <h4 className={cn(
                                                "text-[15px] font-bold leading-tight transition-colors",
                                                selectedIndex === i ? "text-blue-500" : "text-neutral-900"
                                            )}
                                                style={{ color: selectedIndex === i ? 'var(--accent-color)' : 'var(--text-main)' }}
                                            >
                                                {app.name}
                                            </h4>
                                            <p className="text-[12px] text-neutral-400 font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                                {app.url}
                                            </p>
                                        </div>
                                        <div
                                            className={cn(
                                                "px-3 py-1 text-[10px] font-black tracking-wid rounded-md transition-all",
                                                selectedIndex === i
                                                    ? "bg-blue-50 text-blue-600"
                                                    : "bg-neutral-100 text-neutral-500 group-hover:bg-blue-50 group-hover:text-blue-600"
                                            )}
                                            style={{
                                                background: selectedIndex === i ? 'var(--accent-color)20' : 'var(--hover-bg)',
                                                color: selectedIndex === i ? 'var(--accent-color)' : 'var(--text-secondary)'
                                            }}
                                        >
                                            Ir a la app
                                        </div>
                                    </button>
                                ))}

                                {filteredApps.length === 0 && (
                                    <div className="py-20 text-center">
                                        <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--hover-bg)' }}>
                                            <Icon name="search" size={20} className="text-neutral-300" />
                                        </div>
                                        <p className="text-neutral-400 font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>No hay aplicaciones que coincidan con tu búsqueda</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Hint */}
                        <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-100 flex items-center justify-between" style={{ background: 'var(--hover-bg)40', borderColor: 'var(--border-color)' }}>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <kbd className="px-1.5 py-1 rounded bg-white border border-neutral-200 shadow-sm text-[10px] font-black text-neutral-900" style={{ background: 'var(--explorer-bg)', color: 'var(--text-main)', borderColor: 'var(--border-color)' }}>ENTER</kbd>
                                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wid">Seleccionar</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <kbd className="px-1.5 py-1 rounded bg-white border border-neutral-200 shadow-sm text-[10px] font-black text-neutral-900" style={{ background: 'var(--explorer-bg)', color: 'var(--text-main)', borderColor: 'var(--border-color)' }}>↑↓</kbd>
                                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wid">Navegar</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Icon name="command" size={12} className="text-neutral-300" />
                                <span className="text-[10px] font-medium text-neutral-300 tracking-wid uppercase">SkyVault OS</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
