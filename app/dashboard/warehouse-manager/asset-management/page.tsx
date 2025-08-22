'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Link from 'next/link';
import React from 'react';

// Import shadcn/ui components
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    Package,
    BarChart2,
    Truck
} from 'lucide-react';

// Import sub-components for this page
import AssetForm from './AssetForm';
import AssetList from './AssetList';

const AssetManagementPage = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/login');
            } else {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserRole(userDoc.data().role as string);
                }
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    // Effect to handle initial state for mobile and window resizing
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            if (error instanceof Error) {
                alert('Error logging out: ' + error.message);
            } else {
                alert('An unknown error occurred.');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="text-xl font-semibold text-gray-700">Loading...</div>
            </div>
        );
    }

    const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';
    const isAdmin = userRole === 'admin';

    // Restrict access for non-managers and non-admins
    if (!isManagerOrAdmin) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100 p-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
                    <p className="text-lg text-gray-700">You do not have permission to view this page.</p>
                    <Button asChild className="mt-6">
                        <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <div className={cn(
                'flex flex-col min-h-screen bg-white shadow-lg transition-all duration-300 ease-in-out',
                isCollapsed ? 'w-20 p-2' : 'w-64 p-6'
            )}>
                <div className="flex justify-between items-center mb-6">
                    {!isCollapsed && (
                        <h2 className="text-2xl font-bold text-gray-800">Warehouse</h2>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCollapsed(!isCollapsed)}
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
                            {/* Sub-menu for Warehouse Manager */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href="/dashboard/warehouse-manager/asset-management" className={cn(
                                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                                        isCollapsed ? 'w-full' : 'w-full justify-start',
                                        'text-gray-700 hover:bg-gray-200',
                                        pathname.startsWith('/dashboard/warehouse-manager/asset-management') && 'bg-gray-200'
                                    )}>
                                        <Package className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                        {!isCollapsed && 'Asset Management'}
                                    </Link>
                                </TooltipTrigger>
                                {isCollapsed && <TooltipContent side="right">Asset Management</TooltipContent>}
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href="/dashboard/warehouse-manager/reports" className={cn(
                                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                                        isCollapsed ? 'w-full' : 'w-full justify-start',
                                        'text-gray-700 hover:bg-gray-200',
                                        pathname.startsWith('/dashboard/warehouse-manager/reports') && 'bg-gray-200'
                                    )}>
                                        <BarChart2 className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                        {!isCollapsed && 'Reports'}
                                    </Link>
                                </TooltipTrigger>
                                {isCollapsed && <TooltipContent side="right">Reports</TooltipContent>}
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href="/dashboard/warehouse-manager/stock-updater" className={cn(
                                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                                        isCollapsed ? 'w-full' : 'w-full justify-start',
                                        'text-gray-700 hover:bg-gray-200',
                                        pathname.startsWith('/dashboard/warehouse-manager/stock-updater') && 'bg-gray-200'
                                    )}>
                                        <Truck className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                        {!isCollapsed && 'Stock Updater'}
                                    </Link>
                                </TooltipTrigger>
                                {isCollapsed && <TooltipContent side="right">Stock Updater</TooltipContent>}
                            </Tooltip>
                        </TooltipProvider>
                    </nav>
                </div>

                <div className="mt-auto">
                    <Separator />
                    <Button onClick={handleLogout} variant="destructive" className="w-full mt-4">
                        {!isCollapsed && 'Logout'}
                        {isCollapsed && <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex-1 p-8">
                <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
                    <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                        Dashboard
                    </Link>
                    <span>/</span>
                    <Link href="/dashboard/warehouse-manager" className="hover:text-blue-600 transition-colors">
                        Warehouse
                    </Link>
                    <span>/</span>
                    <span>Asset Management</span>
                </div>
                <h1 className="text-4xl font-bold text-gray-800 mb-6">Asset Management</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <AssetForm />
                    <AssetList />
                </div>
            </div>
        </div>
    );
};

export default AssetManagementPage;