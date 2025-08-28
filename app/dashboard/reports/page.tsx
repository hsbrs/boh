'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, DocumentData, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Import shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Import report components
import ReportCalendar from './reportcalendar';
import ReportUser from './reportuser';

// Define the type for a task
type Task = {
  id: string;
  summary?: string;
  assignee?: string;
  assigneeUid?: string;
  description?: string;
  serviceType?: string;
  priority?: string;
  scheduledTime?: string;
  estimatedDuration?: number;
  dueDate?: string;
  location?: string;
  locationUrl?: string;
  customerName?: string;
  customerContact?: string;
  status?: string;
};

type ReportType = 'overview' | 'calendar' | 'resource';

const ReportsPage = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<ReportType>('overview');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (!user) {
            router.push('/login');
            return;
        }
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            setUserRole(userDoc.data().role as string);
        } else {
            setUserRole('employee');
        }
    });

    const unsubscribeTasks = onSnapshot(query(collection(db, 'tasks')), (snapshot) => {
      let tasksArray: Task[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as DocumentData),
      }));
      setTasks(tasksArray);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tasks: ", error);
      setLoading(false);
    });

    return () => {
        unsubscribeAuth();
        unsubscribeTasks();
    };
  }, [router]);

  const canViewReports = userRole === 'admin' || userRole === 'manager';

  if (loading || userRole === null) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Berichte werden geladen...</div>
      </div>
    );
  }

  if (!canViewReports) {
    return (
      <div className="p-8 text-center text-red-500 bg-gray-100 min-h-screen">
        <h1 className="text-4xl font-bold mb-4">Zugriff verweigert</h1>
        <p>Sie haben nicht die erforderlichen Berechtigungen, um diese Seite anzuzeigen.</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">Zurück zum Dashboard</Link>
      </div>
    );
  }

  // Calculate summary statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'Done').length;
  const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
  const plannedTasks = tasks.filter(task => task.status === 'Planned').length;
  const delayedTasks = tasks.filter(task => task.status === 'Delayed').length;
  const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planned': return 'bg-blue-200 text-blue-800 border-blue-400';
      case 'In Progress': return 'bg-yellow-200 text-yellow-800 border-yellow-400';
      case 'Done': return 'bg-green-200 text-green-800 border-green-400';
      case 'Delayed': return 'bg-red-200 text-red-800 border-red-400';
      default: return 'bg-gray-200 text-gray-800 border-gray-400';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Badge variant="outline">{totalTasks}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">All work orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Badge className="bg-green-200 text-green-800">Done</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Badge className="bg-yellow-200 text-yellow-800">Active</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">Currently being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Badge variant="outline">{completionRate}%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">Of total tasks completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Aufgabenstatus-Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="font-medium">Geplant</span>
              <Badge className="bg-blue-200 text-blue-800">{plannedTasks}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="font-medium">In Bearbeitung</span>
              <Badge className="bg-yellow-200 text-yellow-800">{inProgressTasks}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="font-medium">Abgeschlossen</span>
              <Badge className="bg-green-200 text-green-800">{completedTasks}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="font-medium">Verzögert</span>
              <Badge className="bg-red-200 text-red-800">{delayedTasks}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte Aufgaben</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{task.summary}</h4>
                  <p className="text-sm text-gray-500">Zugewiesen an: {task.assignee}</p>
                </div>
                <Badge className={getStatusColor(task.status || '')}>
                  {task.status || 'Unbekannt'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex-1 p-8">
      <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span>Berichte</span>
      </div>
      
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Berichte & Analysen</h1>

      {/* Report Navigation */}
      <div className="flex space-x-2 mb-6">
        <Button
          variant={activeReport === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveReport('overview')}
        >
          Übersicht
        </Button>
        <Button
          variant={activeReport === 'calendar' ? 'default' : 'outline'}
          onClick={() => setActiveReport('calendar')}
        >
          Kalenderansicht
        </Button>
        <Button
          variant={activeReport === 'resource' ? 'default' : 'outline'}
          onClick={() => setActiveReport('resource')}
        >
          Ressourcenplanung
        </Button>
      </div>

      {/* Report Content */}
      <div className="h-[calc(100vh-200px)]">
        {activeReport === 'overview' && renderOverview()}
        {activeReport === 'calendar' && <ReportCalendar tasks={tasks} userRole={userRole} />}
        {activeReport === 'resource' && <ReportUser tasks={tasks} />}
      </div>
    </div>
  );
};

export default ReportsPage;