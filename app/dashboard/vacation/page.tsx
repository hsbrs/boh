'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import VacationRequestForm from './VacationRequestForm';
import VacationRequestList from './VacationRequestList';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function VacationPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    denied: 0,
    total: 0
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setUserId(user.uid);
        fetchUserRole(user.uid);
        fetchStats(user.uid);
      } else {
        setUser(null);
        setUserId('');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserRole = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role || 'employee');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchStats = (uid: string) => {
    let q;
    
    if (userRole === 'employee') {
      // Employees see only their own stats
      q = query(collection(db, 'vacation_requests'), where('employeeId', '==', uid));
    } else {
      // Managers, HR, and PM see all stats for oversight
      q = query(collection(db, 'vacation_requests'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => doc.data());
      
      const stats = {
        pending: requests.filter((r: any) => r.status === 'pending').length,
        approved: requests.filter((r: any) => r.status === 'approved').length,
        denied: requests.filter((r: any) => r.status === 'denied').length,
        total: requests.length
      };
      
      setStats(stats);
    });

    return unsubscribe;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Please log in to access this page.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vacation Management</h1>
          <p className="text-gray-600 mt-2">
            Manage vacation requests and approvals
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.denied}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests">Vacation Requests</TabsTrigger>
          {userRole === 'employee' && (
            <TabsTrigger value="submit">Submit Request</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <VacationRequestList userRole={userRole} userId={userId} />
        </TabsContent>

        {userRole === 'employee' && (
          <TabsContent value="submit" className="space-y-4">
            <VacationRequestForm 
              onSuccess={() => {
                // Refresh the requests list
                const event = new Event('refresh');
                window.dispatchEvent(event);
              }} 
            />
          </TabsContent>
        )}
      </Tabs>

             {/* Role-based Information */}
       {userRole !== 'employee' && (
         <Card className="bg-blue-50 border-blue-200">
           <CardHeader>
             <CardTitle className="flex items-center gap-2 text-blue-800">
               <AlertCircle className="h-5 w-5" />
               Approval Workflow & Oversight
             </CardTitle>
           </CardHeader>
           <CardContent className="text-blue-700">
             <div className="space-y-2 text-sm">
               {userRole === 'hr' && (
                 <div>
                   <p>• You can review and approve/deny initial vacation requests from employees.</p>
                   <p>• You can see all vacation requests for oversight and tracking.</p>
                   <p>• Requests requiring your action are highlighted with a blue border.</p>
                 </div>
               )}
               {userRole === 'pm' && (
                 <div>
                   <p>• You can review vacation requests that have been approved by HR and approve/deny them for project planning purposes.</p>
                   <p>• You can see all vacation requests for oversight and tracking.</p>
                   <p>• Requests requiring your action are highlighted with a blue border.</p>
                 </div>
               )}
               {userRole === 'manager' && (
                 <div>
                   <p>• You have final approval authority for all vacation requests that have passed HR and Project Management reviews.</p>
                   <p>• When you approve, the request becomes fully approved. When you deny, it becomes denied.</p>
                   <p>• You can see all vacation requests for oversight and tracking.</p>
                   <p>• Requests requiring your action are highlighted with a blue border.</p>
                 </div>
               )}
               {userRole === 'admin' && (
                 <div>
                   <p>• You have full access to all vacation requests and can approve/deny at any level.</p>
                   <p>• You can see all vacation requests for complete system oversight.</p>
                   <p>• Requests requiring action are highlighted with a blue border.</p>
                 </div>
               )}
             </div>
           </CardContent>
         </Card>
       )}
    </div>
  );
}
