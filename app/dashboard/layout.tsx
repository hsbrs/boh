'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import React from 'react';
import Sidebar from '@/components/Sidebar';

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
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="text-xl font-semibold text-gray-700">Laden...</div>
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