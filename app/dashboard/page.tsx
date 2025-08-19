'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import React from 'react';

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
          <Button variant="ghost" className="w-full justify-start font-semibold">
            <Link href="/dashboard">Home</Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start text-gray-700">
            <Link href="/dashboard/tasks">Tasks</Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start text-gray-700">
            <Link href="#">Reports</Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start text-gray-700">
            <Link href="#">Discuss</Link>
          </Button>
        </nav>
      </div>

      {/* Main content area */}
      <div className="flex-1 p-8">
        <div className="flex justify-end mb-6">
          <Button
            onClick={handleLogout}
            variant="destructive"
          >
            Logout
          </Button>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to your Dashboard!</h1>
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

          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Access detailed reports on your team's performance.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Coming Soon</p>
            </CardContent>
          </Card>

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
