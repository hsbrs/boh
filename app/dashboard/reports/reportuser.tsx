'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, DocumentData, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import React from 'react';
import Link from 'next/link';
import { format, parseISO, addDays, isSameDay, isWithinInterval, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { useRouter } from 'next/navigation';

// Import shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Define the new type for a task
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

// Define the type for the processed task
type ProcessedTask = Task & {
  start: Date;
  end: Date;
  duration: number;
};

const ReportUser = ({ tasks }: { tasks: Task[] }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<ProcessedTask | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [assignees, setAssignees] = useState<string[]>([]);

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

    // Fetch users dynamically
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersArray = snapshot.docs.map(doc => doc.data() as DocumentData);
      const fetchedAssignees = usersArray.map(user => {
        const email = user.email as string;
        const name = email.split('@')[0];
        return name.charAt(0).toUpperCase() + name.slice(1);
      });
      setAssignees(fetchedAssignees);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching users: ", error);
        setLoading(false);
    });

    return () => {
        unsubscribeAuth();
        unsubscribeUsers();
    };
  }, [router]);

  const { weekDays, assigneesWithTasks } = useMemo(() => {
    const start = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    const end = endOfWeek(selectedWeek, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start, end });
    const assigneeMap = new Map<string, ProcessedTask[]>();
    
    const totalHoursMap = new Map<string, number>();
    assignees.forEach(assignee => {
        assigneeMap.set(assignee, []);
        totalHoursMap.set(assignee, 0);
    });

    tasks.forEach(task => {
        if (task.scheduledTime && task.estimatedDuration && task.assignee) {
            const scheduledDate = parseISO(task.scheduledTime);
            
            if (isWithinInterval(scheduledDate, { start, end })) {
                const processedTask: ProcessedTask = {
                    ...task,
                    start: scheduledDate,
                    end: addDays(scheduledDate, task.estimatedDuration / 24), // Placeholder for end date
                    duration: task.estimatedDuration,
                };
                if (assigneeMap.has(task.assignee)) {
                    assigneeMap.get(task.assignee)?.push(processedTask);
                    totalHoursMap.set(task.assignee, (totalHoursMap.get(task.assignee) || 0) + task.estimatedDuration);
                }
            }
        }
    });

    const assigneesWithTasks = Array.from(assigneeMap.entries()).map(([name, tasks]) => ({
        name,
        tasks,
        totalHours: totalHoursMap.get(name) || 0,
    }));

    return { weekDays, assigneesWithTasks };
  }, [tasks, selectedWeek, assignees]);


  const canViewReports = userRole === 'admin' || userRole === 'manager';

  if (loading || userRole === null) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading reports...</div>
      </div>
    );
  }

  if (!canViewReports) {
    return (
      <div className="p-8 text-center text-red-500 bg-gray-100 min-h-screen">
        <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
        <p>You do not have the required permissions to view this page.</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">Go back to Dashboard</Link>
      </div>
    );
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedWeek(prevWeek => addDays(prevWeek, direction === 'next' ? 7 : -7));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planned': return 'bg-blue-200 text-blue-800 border-blue-400';
      case 'In Progress': return 'bg-yellow-200 text-yellow-800 border-yellow-400';
      case 'Done': return 'bg-green-200 text-green-800 border-green-400';
      default: return 'bg-gray-200 text-gray-800 border-gray-400';
    }
  };

  return (
    <div className="flex-1 p-8">

      <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold">Schedule by Resource</CardTitle>
            <div className="flex space-x-2">
                <Button onClick={() => navigateWeek('prev')} variant="outline" size="sm">Prev Week</Button>
                <span className="text-sm font-semibold flex items-center">{format(weekDays[0], 'MMM dd')} - {format(weekDays[6], 'MMM dd')}</span>
                <Button onClick={() => navigateWeek('next')} variant="outline" size="sm">Next Week</Button>
            </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="grid grid-cols-[200px_repeat(7,minmax(0,1fr))] grid-rows-[64px_repeat(5,1fr)]">
                {/* Header row with weekdays */}
                <div className="border-b border-r bg-gray-50 flex items-center justify-center">
                    <span className="font-bold">Assignees</span>
                </div>
                {weekDays.map((day, index) => (
                    <div key={index} className="border-b border-r bg-gray-50 flex items-center justify-center">
                        <span className="font-semibold text-sm">{format(day, 'EEE d')}</span>
                    </div>
                ))}
                
                {/* Assignee rows and tasks */}
                {assigneesWithTasks.map((assignee, assigneeIndex) => (
                    <React.Fragment key={assignee.name}>
                        <div className="border-r border-b flex items-center p-4">
                            <div className="h-10 w-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                                {assignee.name.charAt(0)}
                            </div>
                            <div className="ml-4">
                                <span className="font-semibold">{assignee.name}</span>
                                <p className="text-sm text-gray-500">
                                    {assignee.totalHours.toFixed(1)}h / 40h ({((assignee.totalHours / 40) * 100).toFixed(0)}%)
                                </p>
                            </div>
                        </div>
                        {weekDays.map((day, dayIndex) => (
                            <div key={`${assignee.name}-${dayIndex}`} className="border-b border-r p-1">
                                {assignee.tasks.filter(task => isSameDay(task.start, day)).map(task => (
                                    <div
                                        key={task.id}
                                        className={`p-1 rounded-md text-xs border cursor-pointer my-1 ${getStatusColor(task.status || '')}`}
                                        onClick={() => setSelectedTask(task)}
                                    >
                                        <p className="font-bold truncate">{task.summary}</p>
                                        <p className="truncate">Duration: {task.duration.toFixed(1)}h</p>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </CardContent>
      </Card>

      {/* Task Detail Dialog */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{selectedTask.summary}</DialogTitle>
              <DialogDescription>Details for the task assigned to {selectedTask.assignee}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p><strong>Service Type:</strong> {selectedTask.serviceType}</p>
              <p><strong>Status:</strong> <Badge className={getStatusColor(selectedTask.status || '')}>{selectedTask.status}</Badge></p>
              <p><strong>Scheduled Time:</strong> {selectedTask.scheduledTime}</p>
              <p><strong>Estimated Duration:</strong> {selectedTask.estimatedDuration}h</p>
              <p><strong>Due Date:</strong> {selectedTask.dueDate}</p>
              <p><strong>Location:</strong> {selectedTask.location || 'N/A'}</p>
              <p><strong>Customer Name:</strong> {selectedTask.customerName || 'N/A'}</p>
              <p><strong>Customer Contact:</strong> {selectedTask.customerContact || 'N/A'}</p>
              <p><strong>Description:</strong> {selectedTask.description || 'N/A'}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ReportUser;