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
import { LayoutDashboard, ListTodo, FileText, MessageSquare, Menu, MapPin, ListChecks } from 'lucide-react';

const DashboardPage = () => {
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
                                {isCollapsed && <TooltipContent side="right">To Do</TooltipContent>}
                            </Tooltip>
                            {/* End of new code */}
                            {isManagerOrAdmin && (
                                <>
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
                                </>
                            )}
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
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-bold text-gray-800">Welcome to your Dashboard!</h1>
                </div>
                
                <p className="text-gray-600 mb-8">Select an option from the sidebar to get started.</p>
        
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/dashboard/tasks">
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-2xl font-bold">Work Orders</CardTitle>
                                <ListTodo className="h-8 w-8 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500">View, create, and manage all your field service work orders.</p>
                                <p className="text-sm font-semibold text-blue-600 mt-2">Go to Work Orders →</p>
                            </CardContent>
                        </Card>
                    </Link>
                    {/* New To Do card */}
                    <Link href="/dashboard/todo">
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-2xl font-bold">To Do</CardTitle>
                                <ListChecks className="h-8 w-8 text-indigo-500" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500">Create and manage personal to-do items.</p>
                                <p className="text-sm font-semibold text-indigo-600 mt-2">Go to To Do →</p>
                            </CardContent>
                        </Card>
                    </Link>
                    {/* End of new code */}
                    {isManagerOrAdmin && (
                        <>
                            <Link href="/dashboard/reports">
                                <Card className="hover:shadow-lg transition-shadow">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-2xl font-bold">Reports</CardTitle>
                                        <FileText className="h-8 w-8 text-red-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-500">Access detailed reports on your team's performance.</p>
                                        <p className="text-sm font-semibold text-red-600 mt-2">Go to Reports →</p>
                                    </CardContent>
                                </Card>
                            </Link>
                            
                            <Link href="/dashboard/webgis">
                                <Card className="hover:shadow-lg transition-shadow">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-2xl font-bold">WebGIS</CardTitle>
                                        <MapPin className="h-8 w-8 text-green-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-500">Visualize task data on an interactive map.</p>
                                        <p className="text-sm font-semibold text-green-600 mt-2">Go to WebGIS →</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        </>
                    )}

                    <Link href="/dashboard/discuss">
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-2xl font-bold">Discuss</CardTitle>
                                <MessageSquare className="h-8 w-8 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500">Communicate and collaborate with your team.</p>
                                <p className="text-sm font-semibold text-orange-600 mt-2">Go to Discuss →</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;