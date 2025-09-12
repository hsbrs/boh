'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    FileText,
    Menu,
    MapPin,
    UserCog,
    Package, // New icon for Project Management
    BarChart2,
    Plane, // New icon for Vacation
    ClipboardList, // New icon for Work Orders
} from 'lucide-react';

interface SidebarProps {
    isCollapsed: boolean;
    userRole: string | null;
    userName: string | null;
    onToggleCollapse: () => void;
    onLogout: () => void;
}

export default function Sidebar({ isCollapsed, userRole, userName, onToggleCollapse, onLogout }: SidebarProps) {
    const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin' || userRole === 'pm';
    const isAdmin = userRole === 'admin';

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length > 1) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return parts[0][0].toUpperCase();
    };

    return (
        <div className={cn(
            'flex flex-col min-h-screen bg-white shadow-lg transition-all duration-500 ease-in-out transform',
            isCollapsed ? 'w-16 sm:w-20 p-2' : 'w-64 p-4 sm:p-6'
        )}>
            <div className="flex justify-between items-center mb-4 sm:mb-6">
                <div className={cn(
                    'transition-all duration-300 ease-in-out overflow-hidden',
                    isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                )}>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-800 whitespace-nowrap">Dashboard</h2>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleCollapse}
                    className={cn(
                        'transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-gray-100',
                        isCollapsed ? 'w-full' : ''
                    )}
                >
                    <Menu className={cn(
                        'h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 ease-in-out',
                        isCollapsed ? 'rotate-180' : 'rotate-0'
                    )} />
                </Button>
            </div>
            <Separator />
            
            <div className="flex-1 mt-4 sm:mt-6">
                <nav className="flex flex-col space-y-1 sm:space-y-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/dashboard" className={cn(
                                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                                    isCollapsed ? 'w-full' : 'w-full justify-start',
                                    'text-gray-700 hover:bg-gray-200 text-xs sm:text-sm transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-sm'
                                )}>
                                    <LayoutDashboard className={cn(
                                        'h-4 w-4 sm:h-5 sm:w-5 transition-all duration-200 ease-in-out',
                                        !isCollapsed && 'mr-2'
                                    )} />
                                    <span className={cn(
                                        'transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap',
                                        isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                                    )}>
                                        Startseite
                                    </span>
                                </Link>
                            </TooltipTrigger>
                            {isCollapsed && <TooltipContent side="right">Startseite</TooltipContent>}
                        </Tooltip>

                        {/* Vacation Management - Available to all users */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/dashboard/vacation" className={cn(
                                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                                    isCollapsed ? 'w-full' : 'w-full justify-start',
                                    'text-gray-700 hover:bg-gray-200 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-sm'
                                )}>
                                    <Plane className={cn(
                                        'h-5 w-5 transition-all duration-200 ease-in-out',
                                        !isCollapsed && 'mr-2'
                                    )} />
                                    <span className={cn(
                                        'transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap',
                                        isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                                    )}>
                                        Urlaub
                                    </span>
                                </Link>
                            </TooltipTrigger>
                            {isCollapsed && <TooltipContent side="right">Urlaubsverwaltung</TooltipContent>}
                        </Tooltip>

                        {isManagerOrAdmin && (
                            <>
                                {/* New link for Project Management */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link href="/dashboard/projects" className={cn(
                                            buttonVariants({ variant: 'ghost', size: 'sm' }),
                                            isCollapsed ? 'w-full' : 'w-full justify-start',
                                            'text-gray-700 hover:bg-gray-200 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-sm'
                                        )}>
                                            <Package className={cn(
                                                'h-5 w-5 transition-all duration-200 ease-in-out',
                                                !isCollapsed && 'mr-2'
                                            )} />
                                            <span className={cn(
                                                'transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap',
                                                isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                                            )}>
                                                Projektmanagement
                                            </span>
                                        </Link>
                                    </TooltipTrigger>
                                    {isCollapsed && <TooltipContent side="right">Projektmanagement</TooltipContent>}
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link href="/dashboard/webgis" className={cn(
                                            buttonVariants({ variant: 'ghost', size: 'sm' }),
                                            isCollapsed ? 'w-full' : 'w-full justify-start',
                                            'text-gray-700 hover:bg-gray-200 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-sm'
                                        )}>
                                            <MapPin className={cn(
                                                'h-5 w-5 transition-all duration-200 ease-in-out',
                                                !isCollapsed && 'mr-2'
                                            )} />
                                            <span className={cn(
                                                'transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap',
                                                isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                                            )}>
                                                WebGIS
                                            </span>
                                        </Link>
                                    </TooltipTrigger>
                                    {isCollapsed && <TooltipContent side="right">WebGIS</TooltipContent>}
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link href="/dashboard/reports" className={cn(
                                            buttonVariants({ variant: 'ghost', size: 'sm' }),
                                            isCollapsed ? 'w-full' : 'w-full justify-start',
                                            'text-gray-700 hover:bg-gray-200 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-sm'
                                        )}>
                                            <FileText className={cn(
                                                'h-5 w-5 transition-all duration-200 ease-in-out',
                                                !isCollapsed && 'mr-2'
                                            )} />
                                            <span className={cn(
                                                'transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap',
                                                isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                                            )}>
                                                Reports
                                            </span>
                                        </Link>
                                    </TooltipTrigger>
                                    {isCollapsed && <TooltipContent side="right">Berichte</TooltipContent>}
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link href="/dashboard/work-orders" className={cn(
                                            buttonVariants({ variant: 'ghost', size: 'sm' }),
                                            isCollapsed ? 'w-full' : 'w-full justify-start',
                                            'text-gray-700 hover:bg-gray-200 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-sm'
                                        )}>
                                            <ClipboardList className={cn(
                                                'h-5 w-5 transition-all duration-200 ease-in-out',
                                                !isCollapsed && 'mr-2'
                                            )} />
                                            <span className={cn(
                                                'transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap',
                                                isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                                            )}>
                                                Work Orders
                                            </span>
                                        </Link>
                                    </TooltipTrigger>
                                    {isCollapsed && <TooltipContent side="right">Work Orders</TooltipContent>}
                                </Tooltip>
                            </>
                        )}
                        {isAdmin && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href="/dashboard/admin" className={cn(
                                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                                        isCollapsed ? 'w-full' : 'w-full justify-start',
                                        'text-gray-700 hover:bg-gray-200 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-sm'
                                    )}>
                                        <UserCog className={cn(
                                            'h-5 w-5 transition-all duration-200 ease-in-out',
                                            !isCollapsed && 'mr-2'
                                        )} />
                                        <span className={cn(
                                            'transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap',
                                            isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                                        )}>
                                            Admin-Panel
                                        </span>
                                    </Link>
                                </TooltipTrigger>
                                {isCollapsed && <TooltipContent side="right">Admin-Panel</TooltipContent>}
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </nav>
            </div>

            <div className={cn(
                "mt-auto space-y-4 px-2 py-4 border-t transition-all duration-300 ease-in-out",
                isCollapsed && "flex flex-col items-center justify-center space-y-2 py-2"
            )}>
                {userName && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={cn(
                                    'flex items-center gap-4 py-2 px-3 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-50 cursor-default w-full',
                                    isCollapsed ? 'justify-center' : 'justify-start'
                                )}>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-sm shrink-0 transition-all duration-200 ease-in-out hover:bg-blue-600 hover:scale-110">
                                        {getInitials(userName)}
                                    </div>
                                    <div className={cn(
                                        'transition-all duration-300 ease-in-out overflow-hidden',
                                        isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                                    )}>
                                        <div className="flex flex-col items-start leading-tight min-w-0">
                                            <span className="font-semibold truncate whitespace-nowrap">{userName}</span>
                                            <span className="text-xs text-gray-500 truncate whitespace-nowrap">{userRole}</span>
                                        </div>
                                    </div>
                                </div>
                            </TooltipTrigger>
                            {isCollapsed && <TooltipContent side="right">{userName}</TooltipContent>}
                        </Tooltip>
                    </TooltipProvider>
                )}
                
                <Button 
                    onClick={onLogout} 
                    variant="destructive" 
                    className="w-full transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md transform"
                >
                    <span className={cn(
                        'transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap',
                        isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                    )}>
                        Abmelden
                    </span>
                    {isCollapsed && <Menu className="h-5 w-5" />}
                </Button>
            </div>
        </div>
    );
}