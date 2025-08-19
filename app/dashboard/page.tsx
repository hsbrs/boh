'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import TaskForm from './TaskForm';
import TaskList from './TaskList';

const DashboardPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Use useEffect to check for the user's authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // If no user is logged in, redirect them to the login page
      if (!user) {
        router.push('/login');
      } else {
        // If the user is logged in, set loading to false and display the dashboard
        setLoading(false);
      }
    });

    // Clean up the subscription when the component unmounts
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Redirect to login page after successful logout
      router.push('/login');
    } catch (error) {
      if (error instanceof Error) {
        alert('Error logging out: ' + error.message);
      } else {
        alert('An unknown error occurred.');
      }
    }
  };

  // Show a loading screen while checking authentication status
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  // Once authenticated, display the dashboard content
  return (
    <div className="flex min-h-screen bg-gray-100 p-8">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800">Field Service Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white font-bold py-2 px-4 rounded-md shadow-md hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Task Form */}
          <TaskForm />

          {/* Task List */}
          <TaskList />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
