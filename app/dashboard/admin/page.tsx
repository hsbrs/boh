'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import React from 'react';
import Link from 'next/link';

// Import local components and shadcn/ui dialog
import UserManagement from './UserManagement';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const AdminPage = () => {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role);
      } else {
        setUserRole('employee');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Admin-Panel wird geladen...</div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="p-8 text-center text-red-500 bg-gray-100 min-h-screen">
        <h1 className="text-4xl font-bold mb-4">Zugriff verweigert</h1>
        <p>Sie haben nicht die erforderlichen Berechtigungen, um diese Seite anzuzeigen.</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">Zurück zum Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span>Admin-Panel</span>
      </div>
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Admin-Panel</h1>
      <UserManagement />
    </div>
  );
};

export default AdminPage;