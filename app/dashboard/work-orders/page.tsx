'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Link from 'next/link';

// Import shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircleIcon, FileTextIcon } from 'lucide-react';

interface UserData {
  uid: string;
  fullName?: string;
  role?: string;
  email?: string;
  isApproved?: boolean;
}

const WorkOrdersPage = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Fetch current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Get current user data
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.data() as UserData;
          
          setCurrentUser({
            ...userData,
            uid: user.uid
          });
          
          // Check if user has permission to access work orders
          if (!userData || !['pm', 'manager', 'admin'].includes(userData.role || '')) {
            router.push('/dashboard');
            return;
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          router.push('/dashboard');
        }
      } else {
        router.push('/login');
      }
      setLoadingUser(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Show loading while checking user permissions
  if (loadingUser) {
    return (
      <div className="flex-1 p-8">
        <div className="text-center text-gray-500">Überprüfe Berechtigungen...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span>Work Orders</span>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-4xl font-bold text-gray-800">Work Order Management</h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileTextIcon className="h-6 w-6 text-blue-600" />
              <span>Work Order Operations</span>
            </CardTitle>
            <p className="text-gray-600">
              Manage work orders for your projects. Create new assignments and track progress through reports.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Create Work Order Card */}
              <Link href="/dashboard/work-orders/create">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
                  <CardContent className="p-6 text-center">
                    <PlusCircleIcon className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                    <h3 className="text-xl font-semibold mb-3">Create Work Order</h3>
                    <p className="text-gray-600 mb-4">
                      Assign tasks to team members, set schedules, and track work progress
                    </p>
                    <div className="text-sm text-blue-600 font-medium">
                      Create New Work Order →
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Work Order Reports Card */}
              <Link href="/dashboard/work-orders/reports">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-200">
                  <CardContent className="p-6 text-center">
                    <FileTextIcon className="h-16 w-16 mx-auto mb-4 text-green-600" />
                    <h3 className="text-xl font-semibold mb-3">Work Order Reports</h3>
                    <p className="text-gray-600 mb-4">
                      View all work orders, track status, and monitor team performance
                    </p>
                    <div className="text-sm text-green-600 font-medium">
                      View Reports →
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkOrdersPage;
