"use client";

import React, { CSSProperties } from 'react';
import * as Iconsax from 'iconsax-react';
import { cn } from '@/lib/utils';

/**
 * Available icon names mapped to Iconsax components.
 * We use 'Outline' style as mandatory for the whole system.
 */
export const ICON_MAP = {
    // General
    home: Iconsax.Home,
    search: Iconsax.SearchNormal1,
    notification: Iconsax.Notification,
    settings: Iconsax.Setting2,
    user: Iconsax.User,
    logout: Iconsax.Logout,
    menu: Iconsax.Menu,
    close: Iconsax.CloseCircle,
    plus: Iconsax.Add,
    add: Iconsax.AddSquare,
    edit: Iconsax.Edit2,
    trash: Iconsax.Trash,
    send: Iconsax.Send2,
    save: Iconsax.Save2,
    mail: Iconsax.Sms,
    upload: Iconsax.DocumentUpload,
    download: Iconsax.DocumentDownload,
    calendar: Iconsax.Calendar,
    clock: Iconsax.Clock,
    eye: Iconsax.Eye,
    'eye-off': Iconsax.EyeSlash,
    copy: Iconsax.Copy,
    filter: Iconsax.Filter,
    sort: Iconsax.Sort,
    more: Iconsax.More,
    command: Iconsax.Command,

    // Navigation
    'chevron-down': Iconsax.ArrowDown2,
    'chevron-up': Iconsax.ArrowUp2,
    'chevron-left': Iconsax.ArrowLeft2,
    'chevron-right': Iconsax.ArrowRight3,
    'arrow-left': Iconsax.ArrowLeft,
    'arrow-right': Iconsax.ArrowRight,
    'arrow-up-right': Iconsax.TrendUp,
    'arrow-down-right': Iconsax.TrendDown,
    'external-link': Iconsax.Export,

    // UI Elements
    pin: Iconsax.AttachSquare,
    paperclip: Iconsax.Paperclip,
    'message-square': Iconsax.MessageText1,
    'layout-grid': Iconsax.Grid5,
    'check-circle': Iconsax.TickCircle,
    'shield-check': Iconsax.ShieldTick,
    'folder-open': Iconsax.FolderOpen,
    image: Iconsax.Image,
    x: Iconsax.CloseCircle,
    bell: Iconsax.Notification,
    info: Iconsax.InfoCircle,
    help: Iconsax.MessageQuestion,
    clipboard: Iconsax.ClipboardText,
    list: Iconsax.FormatSquare,

    // Business / Data
    apps: Iconsax.Category,
    communications: Iconsax.MessageText1,
    support: Iconsax.MessageQuestion,
    analytics: Iconsax.Chart1,
    releases: Iconsax.Flash,
    access: Iconsax.Key,
    'trending-up': Iconsax.TrendUp,
    users: Iconsax.People,
    briefcase: Iconsax.Briefcase,
    file: Iconsax.DocumentText,

    // Status
    success: Iconsax.TickCircle,
    error: Iconsax.Danger,
    warning: Iconsax.Warning2,
    danger: Iconsax.Danger,
    info_circle: Iconsax.InfoCircle,
} as const;

export type IconName = keyof typeof ICON_MAP;

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

export interface IconProps {
    /** Name of the icon to display */
    name: IconName;
    /** Size of the icon. Can be a preset or a number in pixels */
    size?: IconSize;
    /** Additional CSS classes */
    className?: string;
    /** Stroke width/thickness (default: 1.5) */
    strokeWidth?: number;
    color?: string;
    style?: CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
}

const SIZE_MAP: Record<Exclude<IconSize, number>, number> = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
};

/**
 * Standardized Icon component.
 * Uses Iconsax (Outline style) exclusively.
 */
export const Icon: React.FC<IconProps> = ({
    name,
    size = 'md',
    className,
    strokeWidth = 1.5,
    color = 'currentColor',
    style,
    onClick,
    ...props
}) => {
    const IconComponent = ICON_MAP[name];

    if (!IconComponent) {
        console.warn(`Icon "${name}" not found in IconMap`);
        return null;
    }

    const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size];

    return (
        <IconComponent
            size={pixelSize}
            variant="Outline"
            className={cn('shrink-0', className)}
            style={{ strokeWidth, ...style }}
            color={color}
            onClick={onClick}
            {...props}
        />
    );
};
