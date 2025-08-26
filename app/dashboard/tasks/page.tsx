'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { collection, onSnapshot, query, getDocs, where, DocumentData } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Toaster, toast } from 'sonner';

type Task = {
  id: string;
  summary?: string;
  scheduledTime?: string;
  priority?: string;
  status?: string;
  // Add other fields as needed
};

const TasksPage = () => {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userUid, setUserUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [metrics, setMetrics] = useState({ completedToday: 0, totalAssigned: 0 });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

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
        setUserUid(user.uid);
      } else {
        setUserRole('employee');
        setUserEmail(user.email);
        setUserUid(user.uid);
      }

      // Fetch metrics for managers/admins
      if (userDoc.exists() && (userDoc.data().role === 'admin' || userDoc.data().role === 'manager')) {
        const today = format(new Date(), 'yyyy-MM-dd');
        const tasksQuery = query(collection(db, 'tasks'));
        const snapshot = await getDocs(tasksQuery);
        const fetchedTasks = snapshot.docs.map(doc => doc.data());
        const completedToday = fetchedTasks.filter(task => task.status === 'Done' && task.scheduledTime?.startsWith(today)).length;
        const totalAssigned = fetchedTasks.length;
        setMetrics({ completedToday, totalAssigned });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch tasks for calendar events (real-time)
  useEffect(() => {
    let q = query(collection(db, 'tasks'));
    // For employees, filter by assigneeUid
    if (userRole === 'employee' && userUid) {
      q = query(collection(db, 'tasks'), where('assigneeUid', '==', userUid));
    }

    const unsubscribeTasks = onSnapshot(q, (snapshot) => {
      const fetchedTasks: Task[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as DocumentData,
      }));

      // Map tasks to FullCalendar events
      const events = fetchedTasks.map(task => ({
        id: task.id,
        title: task.summary || 'Untitled Task',
        start: task.scheduledTime ? new Date(task.scheduledTime) : new Date(),
        backgroundColor: task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f59e0b' : '#10b981', // Red/Yellow/Green based on priority
        borderColor: task.priority === 'High' ? '#dc2626' : task.priority === 'Medium' ? '#d97706' : '#059669',
        textColor: 'white',
        extendedProps: {
          status: task.status,
          // Add more props like description, assignee
        },
      }));

      setTasks(fetchedTasks);
      setCalendarEvents(events);
    });

    return () => unsubscribeTasks();
  }, [userRole, userUid]);

  // Handle date click (e.g., create new task)
  const handleDateClick = (info: any) => {
    toast.info(`Clicked on ${info.dateStr}. You can create a new task here!`);
    // Optional: Open a modal to create a task on this date
  };

  // Handle event click (e.g., view task details)
  const handleEventClick = (info: any) => {
    const task = tasks.find(t => t.id === info.event.id);
    if (task) {
      toast.info(`Task: ${task.summary} - Status: ${task.status}`);
      // Optional: Open a modal to edit/view task
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center w-screen h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading Work Orders...</div>
      </div>
    );
  }

  const canViewTaskForm = userRole === 'admin' || userRole === 'manager';

  return (
    <div className="flex flex-col w-screen h-screen bg-gray-100 p-4">
      <Toaster />
      <div className="flex flex-col h-full">
        <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <span>/</span>
          <span>Work Orders</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-6">Work Orders</h1>
        {canViewTaskForm && (
          <div className="mb-4 flex justify-between items-center">
            <Input
              placeholder="Search work orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <div className="text-sm text-gray-600">
              Completed Today: {metrics.completedToday} / Total Assigned: {metrics.totalAssigned}
            </div>
          </div>
        )}
        <Tabs defaultValue={canViewTaskForm ? 'list' : 'my-orders'} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            {canViewTaskForm && <TabsTrigger value="create">Create Work Order</TabsTrigger>}
            <TabsTrigger value="list">My Work Orders</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>
          {canViewTaskForm && (
            <TabsContent value="create" className="flex-1">
              <TaskForm />
            </TabsContent>
          )}
          <TabsContent value="list" className="flex-1 overflow-auto">
            <TaskList userRole={userRole} userEmail={userEmail} userUid={userUid} search={search} />
          </TabsContent>
          <TabsContent value="calendar" className="flex-1 overflow-auto">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth" // Start with month view
              events={calendarEvents}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              height="100%" // Full height
              editable={true} // Allow drag-drop (optional, can update Firestore on drop)
              selectable={true} // Allow selecting date ranges
              selectMirror={true}
              dayMaxEvents={true} // Show "+" if too many events
              weekends={true}
              nowIndicator={true} // Show current time line
              className="bg-white rounded-md shadow-md" // shadcn/ui-like styling
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TasksPage;