'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800">Field Service Dashboard</h1>
          <button
            // You will add a logout function here later
            className="bg-red-500 text-white font-bold py-2 px-4 rounded-md shadow-md hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Hello, you are logged in!</h2>
          <p className="text-gray-600">This is your main dashboard. We'll build out the task management features here in the next step.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
