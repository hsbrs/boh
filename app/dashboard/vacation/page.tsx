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
        // Pending includes all non-final statuses (pending, hr_review, pm_review)
        pending: requests.filter((r: any) => 
          r.status === 'pending' || r.status === 'hr_review' || r.status === 'pm_review'
        ).length,
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
        <div className="text-xl">Laden...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Bitte melden Sie sich an, um auf diese Seite zuzugreifen.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Urlaubsverwaltung</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Urlaubsanträge und Genehmigungen verwalten
          </p>
        </div>
        <Badge variant="outline" className="text-xs sm:text-sm w-fit">
          {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Gesamtanträge</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Ausstehend</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Genehmigt</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Abgelehnt</CardTitle>
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.denied}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="requests" className="text-xs sm:text-sm py-2 sm:py-3">Urlaubsanträge</TabsTrigger>
          {userRole === 'employee' && (
            <TabsTrigger value="submit" className="text-xs sm:text-sm py-2 sm:py-3">Antrag einreichen</TabsTrigger>
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
           <CardHeader className="pb-3">
             <CardTitle className="flex items-center gap-2 text-blue-800 text-sm sm:text-base">
               <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
               Genehmigungsworkflow & Aufsicht
             </CardTitle>
           </CardHeader>
           <CardContent className="text-blue-700">
             <div className="space-y-2 text-xs sm:text-sm">
               {userRole === 'hr' && (
                 <div>
                   <p>• Sie können anfängliche Urlaubsanträge von Mitarbeitern überprüfen und genehmigen/ablehnen.</p>
                   <p>• Sie können alle Urlaubsanträge zur Aufsicht und Verfolgung einsehen.</p>
                   <p>• Anträge, die Ihre Aktion erfordern, sind mit einem blauen Rahmen hervorgehoben.</p>
                 </div>
               )}
               {userRole === 'pm' && (
                 <div>
                   <p>• Sie können Urlaubsanträge überprüfen, die von der Personalabteilung genehmigt wurden, und sie für Projektplanungszwecke genehmigen/ablehnen.</p>
                   <p>• Sie können alle Urlaubsanträge zur Aufsicht und Verfolgung einsehen.</p>
                   <p>• Anträge, die Ihre Aktion erfordern, sind mit einem blauen Rahmen hervorgehoben.</p>
                 </div>
               )}
               {userRole === 'manager' && (
                 <div>
                   <p>• Sie haben die endgültige Genehmigungsbefugnis für alle Urlaubsanträge, die die Überprüfungen der Personalabteilung und des Projektmanagements durchlaufen haben.</p>
                   <p>• Wenn Sie genehmigen, wird der Antrag vollständig genehmigt. Wenn Sie ablehnen, wird er abgelehnt.</p>
                   <p>• Sie können alle Urlaubsanträge zur Aufsicht und Verfolgung einsehen.</p>
                   <p>• Anträge, die Ihre Aktion erfordern, sind mit einem blauen Rahmen hervorgehoben.</p>
                 </div>
               )}
               {userRole === 'admin' && (
                 <div>
                   <p>• Sie haben vollen Zugriff auf alle Urlaubsanträge und können auf jeder Ebene genehmigen/ablehnen.</p>
                   <p>• Sie können alle Urlaubsanträge zur vollständigen Systemaufsicht einsehen.</p>
                   <p>• Anträge, die eine Aktion erfordern, sind mit einem blauen Rahmen hervorgehoben.</p>
                 </div>
               )}
             </div>
           </CardContent>
         </Card>
       )}
    </div>
  );
}
