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
import { format } from 'date-fns';
import { Toaster } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

type Task = {
  id: string;
  summary?: string;
  scheduledTime?: string;
  priority?: string;
  status?: string;
  assignee?: string;
  description?: string;
  serviceType?: string;
};

const TasksPage = () => {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userUid, setUserUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ completedToday: 0, totalAssigned: 0 });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [calendarFilter, setCalendarFilter] = useState('All');
  const [calendarSearch, setCalendarSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  useEffect(() => {
    let q = query(collection(db, 'tasks'));
    if (userRole === 'employee' && userUid) {
      q = query(collection(db, 'tasks'), where('assigneeUid', '==', userUid));
    }

    const unsubscribeTasks = onSnapshot(q, (snapshot) => {
      const fetchedTasks: Task[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as DocumentData,
      }));

      const events = fetchedTasks.map(task => ({
        id: task.id,
        title: task.summary || 'Untitled Task',
        start: task.scheduledTime ? new Date(task.scheduledTime) : new Date(),
        extendedProps: { ...task },
      }));

      setTasks(fetchedTasks);
      setCalendarEvents(events);
    });

    return () => unsubscribeTasks();
  }, [userRole, userUid]);

  if (loading) {
    return (
      <div className="flex justify-center items-center w-screen h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading Work Orders...</div>
      </div>
    );
  }

  const canViewTaskForm = userRole === 'admin' || userRole === 'manager';

  const filteredEvents = calendarEvents.filter(ev => {
    const matchesSearch = ev.title.toLowerCase().includes(calendarSearch.toLowerCase());
    const matchesFilter = calendarFilter === 'All' || ev.extendedProps.status === calendarFilter;
    return matchesSearch && matchesFilter;
  });

  // 🔹 Consistent badge helper (aligned with TaskList.tsx)
  const renderBadge = (label: string, type: 'priority' | 'status') => {
    if (!label) return null;
    if (type === 'priority') {
      if (label === 'High') return <Badge variant="destructive">High</Badge>;
      if (label === 'Medium') return <Badge variant="secondary">Medium</Badge>;
      return <Badge variant="outline">Low</Badge>;
    } else {
      if (label === 'Planned') return <Badge className="bg-blue-500 text-white">Planned</Badge>;
      if (label === 'In Progress') return <Badge className="bg-yellow-500 text-black">In Progress</Badge>;
      if (label === 'Done') return <Badge className="bg-green-600 text-white">Done</Badge>;
      if (label === 'Delayed') return <Badge className="bg-red-600 text-white">Delayed</Badge>;
      return <Badge variant="outline">{label}</Badge>;
    }
  };

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
            <TaskList userRole={userRole} userEmail={userEmail} userUid={userUid} />
          </TabsContent>
          <TabsContent value="calendar" className="flex-1 overflow-auto">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Work Orders Calendar</CardTitle>
                <div className="flex flex-col md:flex-row justify-between items-center mt-4 w-full">
                  <Input
                    placeholder="Search events..."
                    value={calendarSearch}
                    onChange={(e) => setCalendarSearch(e.target.value)}
                    className="mb-4 md:mb-0 max-w-sm"
                  />
                  <Select value={calendarFilter} onValueChange={setCalendarFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Planned">Planned</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                      <SelectItem value="Delayed">Delayed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="h-full min-h-[60vh]">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  events={filteredEvents}
                  eventClick={(info) => {
                    const task = tasks.find(t => t.id === info.event.id);
                    if (task) setSelectedTask(task);
                  }}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  height="100%"
                  selectable
                  dayMaxEvents
                  weekends
                  nowIndicator
                  eventContent={(arg) => {
                    const task = arg.event.extendedProps as Task;
                    return (
                      <div className="flex flex-col">
                        <span className="font-medium truncate">{arg.event.title}</span>
                        <div className="flex gap-1 mt-1">
                          {renderBadge(task.priority || '', 'priority')}
                          {renderBadge(task.status || '', 'status')}
                        </div>
                      </div>
                    );
                  }}
                />
              </CardContent>
            </Card>

              {/* Dialog for event details */}
              <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
                <DialogContent className="max-w-lg p-0 border-none bg-transparent">
                  {selectedTask && (
                    <Card className="w-full">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {selectedTask.summary}
                          <div className="flex gap-2">
                            {renderBadge(selectedTask.priority || '', 'priority')}
                            {renderBadge(selectedTask.status || '', 'status')}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-gray-600 space-y-2">
                        <p><strong>Assignee:</strong> {selectedTask.assignee}</p>
                        <p><strong>Scheduled:</strong> {selectedTask.scheduledTime}</p>
                        <p><strong>Service Type:</strong> {selectedTask.serviceType}</p>
                        <p><strong>Description:</strong> {selectedTask.description}</p>
                      </CardContent>
                    </Card>
                  )}
                </DialogContent>
              </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TasksPage;
