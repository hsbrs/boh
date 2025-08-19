'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

const DashboardPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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
      {/* Sidebar for navigation */}
      <div className="w-64 bg-white p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
        <nav className="space-y-4">
          <Link href="/dashboard" className="block p-2 rounded-md bg-blue-100 text-blue-600 font-semibold transition-colors">
            Home
          </Link>
          <Link href="/dashboard/tasks" className="block p-2 rounded-md text-gray-700 hover:bg-gray-200 transition-colors">
            Tasks
          </Link>
          <Link href="#" className="block p-2 rounded-md text-gray-700 hover:bg-gray-200 transition-colors">
            Reports
          </Link>
          <Link href="#" className="block p-2 rounded-md text-gray-700 hover:bg-gray-200 transition-colors">
            Discuss
          </Link>
        </nav>
      </div>

      {/* Main content area */}
      <div className="flex-1 p-8">
        <div className="flex justify-end mb-6">
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white font-bold py-2 px-4 rounded-md shadow-md hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to your Dashboard!</h1>
        <p className="text-gray-600 mb-8">Select an option from the sidebar to get started.</p>

        <div className="p-6 bg-white rounded-2xl shadow-xl">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/dashboard/tasks" className="block p-6 bg-blue-50 rounded-lg shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-blue-600">Tasks</h3>
              <p className="text-sm text-gray-500 mt-1">View, create, and manage all your field service tasks.</p>
            </Link>
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-gray-600">Reports</h3>
              <p className="text-sm text-gray-500 mt-1">Access detailed reports on your team's performance.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-gray-600">Discuss</h3>
              <p className="text-sm text-gray-500 mt-1">Communicate and collaborate with your team.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;