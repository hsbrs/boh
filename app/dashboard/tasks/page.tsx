'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const TasksPage = () => {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
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
        setUserEmail(user.email);
      } else {
        setUserRole('employee');
        setUserEmail(user.email);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading tasks...</div>
      </div>
    );
  }

  const canViewTaskForm = userRole === 'admin' || userRole === 'manager';

  return (
    <div className="flex min-h-screen bg-gray-100 p-8">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span>Task Management</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-6">Task Management</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {canViewTaskForm && <TaskForm />}
          <TaskList userRole={userRole} userEmail={userEmail} />
        </div>
      </div>
    </div>
  );
};

export default TasksPage;