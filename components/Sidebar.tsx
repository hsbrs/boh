'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    ListTodo,
    FileText,
    MessageSquare,
    Menu,
    MapPin,
    UserCog,
    ListChecks,
    Warehouse,
    ChevronDown,
    ChevronRight,
    Package,
    BarChart2,
    Truck,
} from 'lucide-react';

interface SidebarProps {
    isCollapsed: boolean;
    userRole: string | null;
    userName: string | null; // New prop for user's name
    onToggleCollapse: () => void;
    onLogout: () => void;
}

export default function Sidebar({ isCollapsed, userRole, userName, onToggleCollapse, onLogout }: SidebarProps) {
    const [isWarehouseExpanded, setIsWarehouseExpanded] = useState(false);
    const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';
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
            'flex flex-col min-h-screen bg-white shadow-lg transition-all duration-300 ease-in-out',
            isCollapsed ? 'w-20 p-2' : 'w-64 p-6'
        )}>
            <div className="flex justify-between items-center mb-6">
                {!isCollapsed && (
                    <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleCollapse}
                    className={isCollapsed ? 'w-full' : ''}
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </div>
            <Separator />
            
            <div className="flex-1 mt-6">
                <nav className="flex flex-col space-y-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/dashboard" className={cn(
                                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                                    isCollapsed ? 'w-full' : 'w-full justify-start',
                                    'text-gray-700 hover:bg-gray-200'
                                )}>
                                    <LayoutDashboard className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                    {!isCollapsed && 'Home'}
                                </Link>
                            </TooltipTrigger>
                            {isCollapsed && <TooltipContent side="right">Home</TooltipContent>}
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/dashboard/tasks" className={cn(
                                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                                    isCollapsed ? 'w-full' : 'w-full justify-start',
                                    'text-gray-700 hover:bg-gray-200'
                                )}>
                                    <ListTodo className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                    {!isCollapsed && 'Work Orders'}
                                </Link>
                            </TooltipTrigger>
                            {isCollapsed && <TooltipContent side="right">Work Orders</TooltipContent>}
                        </Tooltip>
                        
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/dashboard/discuss" className={cn(
                                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                                    isCollapsed ? 'w-full' : 'w-full justify-start',
                                    'text-gray-700 hover:bg-gray-200'
                                )}>
                                    <MessageSquare className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                    {!isCollapsed && 'Discuss'}
                                </Link>
                            </TooltipTrigger>
                            {isCollapsed && <TooltipContent side="right">Discuss</TooltipContent>}
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/dashboard/todo" className={cn(
                                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                                    isCollapsed ? 'w-full' : 'w-full justify-start',
                                    'text-gray-700 hover:bg-gray-200'
                                )}>
                                    <ListChecks className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                    {!isCollapsed && 'To Do'}
                                </Link>
                            </TooltipTrigger>
                            {isCollapsed && <TooltipContent side="right">Personal To Do</TooltipContent>}
                        </Tooltip>

                        {isManagerOrAdmin && (
                            <>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link href="/dashboard/webgis" className={cn(
                                            buttonVariants({ variant: 'ghost', size: 'sm' }),
                                            isCollapsed ? 'w-full' : 'w-full justify-start',
                                            'text-gray-700 hover:bg-gray-200'
                                        )}>
                                            <MapPin className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                            {!isCollapsed && 'WebGIS'}
                                        </Link>
                                    </TooltipTrigger>
                                    {isCollapsed && <TooltipContent side="right">WebGIS</TooltipContent>}
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link href="/dashboard/reports" className={cn(
                                            buttonVariants({ variant: 'ghost', size: 'sm' }),
                                            isCollapsed ? 'w-full' : 'w-full justify-start',
                                            'text-gray-700 hover:bg-gray-200'
                                        )}>
                                            <FileText className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                            {!isCollapsed && 'Reports'}
                                        </Link>
                                    </TooltipTrigger>
                                    {isCollapsed && <TooltipContent side="right">Reports</TooltipContent>}
                                </Tooltip>
                                
                                <div className="flex flex-col">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsWarehouseExpanded(!isWarehouseExpanded)}
                                        className={cn(
                                            'w-full justify-start text-gray-700 hover:bg-gray-200',
                                            isCollapsed && 'w-full'
                                        )}
                                    >
                                        <Warehouse className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                        {!isCollapsed && 'Warehouse'}
                                        {!isCollapsed && (
                                            isWarehouseExpanded ? <ChevronDown className="ml-auto h-4 w-4" /> : <ChevronRight className="ml-auto h-4 w-4" />
                                        )}
                                    </Button>
                                    {isWarehouseExpanded && !isCollapsed && (
                                        <nav className="flex flex-col pl-4 mt-2 space-y-1">
                                            <Link href="/dashboard/warehouse-manager/asset-management" className={cn(
                                                buttonVariants({ variant: 'ghost', size: 'sm' }),
                                                'w-full justify-start text-gray-700 hover:bg-gray-200'
                                            )}>
                                                <Package className="h-5 w-5 mr-2" />
                                                Asset Management
                                            </Link>
                                            <Link href="/dashboard/warehouse-manager/reports" className={cn(
                                                buttonVariants({ variant: 'ghost', size: 'sm' }),
                                                'w-full justify-start text-gray-700 hover:bg-gray-200'
                                            )}>
                                                <BarChart2 className="h-5 w-5 mr-2" />
                                                Reports
                                            </Link>
                                            <Link href="/dashboard/warehouse-manager/stock-updater" className={cn(
                                                buttonVariants({ variant: 'ghost', size: 'sm' }),
                                                'w-full justify-start text-gray-700 hover:bg-gray-200'
                                            )}>
                                                <Truck className="h-5 w-5 mr-2" />
                                                Stock Updater
                                            </Link>
                                        </nav>
                                    )}
                                </div>
                            </>
                        )}
                        {isAdmin && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href="/dashboard/admin" className={cn(
                                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                                        isCollapsed ? 'w-full' : 'w-full justify-start',
                                        'text-gray-700 hover:bg-gray-200'
                                    )}>
                                        <UserCog className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                        {!isCollapsed && 'Admin Panel'}
                                    </Link>
                                </TooltipTrigger>
                                {isCollapsed && <TooltipContent side="right">Admin Panel</TooltipContent>}
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </nav>
            </div>

            {userName && (
                <div className="mt-auto px-2">
                    <Separator className="mb-4" />
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={cn(
                                    'flex items-center gap-4 py-2 px-3 rounded-md transition-colors',
                                    isCollapsed ? 'justify-center' : 'justify-start'
                                )}>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-sm">
                                        {getInitials(userName)}
                                    </div>
                                    {!isCollapsed && (
                                        <div className="flex flex-col items-start leading-tight">
                                            <span className="font-semibold">{userName}</span>
                                            <span className="text-xs text-gray-500">{userRole}</span>
                                        </div>
                                    )}
                                </div>
                            </TooltipTrigger>
                            {isCollapsed && <TooltipContent side="right">{userName}</TooltipContent>}
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )}

            <div className={cn('px-2', !userName && 'mt-auto')}>
                <Separator className="mb-4" />
                <Button onClick={onLogout} variant="destructive" className="w-full">
                    {!isCollapsed && 'Logout'}
                    {isCollapsed && <Menu className="h-5 w-5" />}
                </Button>
            </div>
        </div>
    );
}