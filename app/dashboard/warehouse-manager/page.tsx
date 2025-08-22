'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { LayoutDashboard, ListTodo, FileText, MessageSquare, Menu, MapPin, UserCog, ListChecks, Warehouse, Package, BarChart2, Truck } from 'lucide-react';

const WarehouseManagerPage = () => {
    const router = useRouter();
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

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
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
                            {/* New To Do link */}
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
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link href="/dashboard/warehouse-manager" className={cn(
                                                buttonVariants({ variant: 'ghost', size: 'sm' }),
                                                isCollapsed ? 'w-full' : 'w-full justify-start',
                                                'text-gray-700 hover:bg-gray-200'
                                            )}>
                                                <Warehouse className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                                {!isCollapsed && 'Warehouse'}
                                            </Link>
                                        </TooltipTrigger>
                                        {isCollapsed && <TooltipContent side="right">Warehouse</TooltipContent>}
                                    </Tooltip>
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
                    <span>Warehouse Management</span>
                </div>
                <h1 className="text-4xl font-bold text-gray-800 mb-6">Warehouse Management</h1>
                <p className="text-gray-600 mb-8">Select a section to manage warehouse assets and inventory.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/dashboard/warehouse-manager/asset-management">
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-2xl font-bold">Asset Management</CardTitle>
                                <Package className="h-8 w-8 text-cyan-500" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500">Add, view, and modify all assets in the warehouse.</p>
                                <p className="text-sm font-semibold text-cyan-600 mt-2">Go to Asset Management →</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/dashboard/warehouse-manager/reports">
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-2xl font-bold">Reports</CardTitle>
                                <BarChart2 className="h-8 w-8 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500">View reports on stock levels and inventory value.</p>
                                <p className="text-sm font-semibold text-orange-600 mt-2">Go to Reports →</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/dashboard/warehouse-manager/stock-updater">
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-2xl font-bold">Stock Updater</CardTitle>
                                <Truck className="h-8 w-8 text-indigo-500" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500">Quickly add or remove stock from existing assets.</p>
                                <p className="text-sm font-semibold text-indigo-600 mt-2">Go to Stock Updater →</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default WarehouseManagerPage;