'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import React from 'react';

// Import shadcn/ui components
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

import { cn } from '@/lib/utils';
import { LayoutDashboard, ListTodo, FileText, MessageSquare, Menu } from 'lucide-react';

const DashboardPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push('/login');
            } else {
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
                                        {!isCollapsed && 'Tasks'}
                                    </Link>
                                </TooltipTrigger>
                                {isCollapsed && <TooltipContent side="right">Tasks</TooltipContent>}
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
                                    <Link href="#" className={cn(
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
                            <CardHeader>
                                <CardTitle>Tasks</CardTitle>
                                <CardDescription>View, create, and manage all your field service tasks.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-blue-600">Go to Tasks →</p>
                            </CardContent>
                        </Card>
                    </Link>
        
                    <Link href="/dashboard/reports">
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle>Reports</CardTitle>
                                <CardDescription>Access detailed reports on your team's performance.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-blue-600">Go to Reports →</p>
                            </CardContent>
                        </Card>
                    </Link>
        
                    <Card>
                        <CardHeader>
                            <CardTitle>Discuss</CardTitle>
                            <CardDescription>Communicate and collaborate with your team.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500">Coming Soon</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;