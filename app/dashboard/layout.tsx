'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import React from 'react';
import Sidebar from '@/components/Sidebar';
import { SidebarLoadingSkeleton } from '@/components/LoadingSkeletons';

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null); // New state for user's full name
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isApproved, setIsApproved] = useState<boolean | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/login');
            } else {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserRole(userData.role as string);
                    setUserName(userData.fullName as string); // Fetch the full name
                    setIsApproved(userData.isApproved as boolean);
                    
                    // Redirect unapproved users to pending approval page
                    if (userData.isApproved === false) {
                        router.push('/pending-approval');
                        return;
                    }
                }
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

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
                alert('Fehler beim Abmelden: ' + error.message);
            } else {
                alert('Ein unbekannter Fehler ist aufgetreten.');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-100">
                <SidebarLoadingSkeleton />
                <div className="flex-1 p-8">
                    <div className="space-y-6">
                        {/* Header Loading */}
                        <div className="flex justify-between items-center">
                            <div className="h-10 bg-gray-200 rounded-md animate-pulse w-80"></div>
                            <div className="h-10 bg-gray-200 rounded-md animate-pulse w-32"></div>
                        </div>
                        
                        {/* Content Loading */}
                        <div className="h-4 bg-gray-200 rounded-md animate-pulse w-96"></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-lg border p-6 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="h-6 bg-gray-200 rounded-md animate-pulse w-32"></div>
                                        <div className="h-8 bg-gray-200 rounded-full animate-pulse w-8"></div>
                                    </div>
                                    <div className="h-4 bg-gray-200 rounded-md animate-pulse w-full"></div>
                                    <div className="h-4 bg-gray-200 rounded-md animate-pulse w-24"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const pathsWithoutSidebar = ['/dashboard/reports'];
    const showSidebar = !pathsWithoutSidebar.some(path => pathname.startsWith(path));

    return (
        <div className="flex min-h-screen bg-gray-100">
            {showSidebar && (
                <Sidebar
                    isCollapsed={isCollapsed}
                    userRole={userRole}
                    userName={userName} // Pass the new userName prop
                    onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                    onLogout={handleLogout}
                />
            )}
            {children}
        </div>
    );
}