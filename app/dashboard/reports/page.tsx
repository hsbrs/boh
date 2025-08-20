'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React from 'react';
import Link from 'next/link';
import { format, parseISO, addDays, getDay, isSameDay, isWithinInterval, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

// Import shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define the type for a task to provide type safety
type Task = {
  id: string;
  project?: string;
  assignee?: string;
  taskName?: string;
  plannedDate?: string;
  startTime?: string;
  endTime?: string;
  city?: string;
  location?: string;
  locationUrl?: string;
  status?: string;
};

// Define the type for the processed task
type ProcessedTask = Task & {
  start: Date;
  end: Date;
  duration: number;
};

const ReportsPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<ProcessedTask | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
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

    return () => unsubscribe();
  }, []);

  const { weekDays, assigneesWithTasks } = useMemo(() => {
    const start = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(selectedWeek, { weekStartsOn: 1 }); // Sunday
    const weekDays = eachDayOfInterval({ start, end });
    const assigneeMap = new Map<string, ProcessedTask[]>();

    const assigneesList = ["Hady", "Kevin", "Maik", "Rene", "Andre"];
    const totalHoursMap = new Map<string, number>();
    assigneesList.forEach(assignee => {
        assigneeMap.set(assignee, []);
        totalHoursMap.set(assignee, 0);
    });

    tasks.forEach(task => {
        if (task.plannedDate && task.startTime && task.endTime && task.assignee) {
            const plannedDate = parseISO(task.plannedDate);
            const startDateTime = parseISO(`${task.plannedDate}T${task.startTime}`);
            const endDateTime = parseISO(`${task.plannedDate}T${task.endTime}`);
            const durationMs = endDateTime.getTime() - startDateTime.getTime();
            const durationHours = durationMs / (1000 * 60 * 60);

            if (isWithinInterval(plannedDate, { start, end })) {
                const processedTask: ProcessedTask = {
                    ...task,
                    start: startDateTime,
                    end: endDateTime,
                    duration: durationHours,
                };
                if (assigneeMap.has(task.assignee)) {
                    assigneeMap.get(task.assignee)?.push(processedTask);
                    totalHoursMap.set(task.assignee, (totalHoursMap.get(task.assignee) || 0) + durationHours);
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
  }, [tasks, selectedWeek]);


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading reports...</div>
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

  const calculatePosition = (task: ProcessedTask, dayStart: Date) => {
    const dayStartMinutes = dayStart.getHours() * 60 + dayStart.getMinutes();
    const taskStartMinutes = task.start.getHours() * 60 + task.start.getMinutes();
    const taskEndMinutes = task.end.getHours() * 60 + task.end.getMinutes();
    const totalMinutesInDay = 24 * 60;
    
    const top = (taskStartMinutes / totalMinutesInDay) * 100;
    const height = ((taskEndMinutes - taskStartMinutes) / totalMinutesInDay) * 100;
    
    return { top, height };
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span>Task Reports</span>
      </div>
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Planning</h1>

      <Card className="flex flex-col h-[80vh]">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold">Schedule by Resource</CardTitle>
            <div className="flex space-x-2">
                <Button onClick={() => navigateWeek('prev')} variant="outline" size="sm">Prev Week</Button>
                <span className="text-sm font-semibold flex items-center">{format(weekDays[0], 'MMM dd')} - {format(weekDays[6], 'MMM dd')}</span>
                <Button onClick={() => navigateWeek('next')} variant="outline" size="sm">Next Week</Button>
            </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="grid grid-cols-[200px_1fr] h-full">
                {/* Left Panel: Assignee List */}
                <div className="border-r bg-gray-50">
                    <div className="h-16 flex items-center justify-center border-b">
                        <span className="font-bold">Assignees</span>
                    </div>
                    <ScrollArea className="h-[calc(80vh-64px-64px)]">
                        {assigneesWithTasks.map(assignee => (
                            <div key={assignee.name} className="flex items-center p-4 border-b">
                                <div className="h-10 w-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                                    {assignee.name.charAt(0)}
                                </div>
                                <div className="ml-4">
                                    <span className="font-semibold">{assignee.name}</span>
                                    <p className="text-sm text-gray-500">{assignee.totalHours.toFixed(1)}h</p>
                                </div>
                            </div>
                        ))}
                    </ScrollArea>
                </div>
                {/* Right Panel: Schedule Grid */}
                <div className="overflow-x-auto overflow-y-hidden">
                    <div className="grid grid-cols-7 h-full w-[1200px] md:w-full">
                        {weekDays.map((day, index) => (
                            <div key={index} className="border-r flex flex-col">
                                <div className="h-16 border-b flex items-center justify-center bg-gray-50">
                                    <span className="font-semibold text-sm">{format(day, 'EEE d')}</span>
                                </div>
                                <div className="flex-1 relative">
                                    {assigneesWithTasks.flatMap(assignee => (
                                        assignee.tasks.filter(task => isSameDay(task.start, day)).map(task => {
                                            const { top, height } = calculatePosition(task, day);
                                            return (
                                                <div
                                                    key={task.id}
                                                    className={`absolute w-full px-1 cursor-pointer`}
                                                    style={{ top: `${top}%`, height: `${height}%` }}
                                                    onClick={() => setSelectedTask(task)}
                                                >
                                                    <div className={`p-1 rounded-md text-xs border ${getStatusColor(task.status || '')}`}>
                                                        <p className="font-bold truncate">{task.project}</p>
                                                        <p className="truncate">{task.startTime} - {task.endTime}</p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>

      {/* Task Detail Dialog */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{selectedTask.project}</DialogTitle>
              <DialogDescription>Details for the task assigned to {selectedTask.assignee}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p><strong>Task:</strong> {selectedTask.taskName}</p>
              <p><strong>Status:</strong> <Badge className={getStatusColor(selectedTask.status || '')}>{selectedTask.status}</Badge></p>
              <p><strong>Date:</strong> {selectedTask.plannedDate}</p>
              <p><strong>Time:</strong> {selectedTask.startTime} - {selectedTask.endTime} ({selectedTask.duration.toFixed(1)}h)</p>
              <p><strong>City:</strong> {selectedTask.city}</p>
              <p><strong>Location:</strong> {selectedTask.location}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ReportsPage;