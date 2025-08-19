'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React from 'react';
import Link from 'next/link';

// Import shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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

const ReportsPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let tasksArray: Task[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as DocumentData),
      }));

      // Sort the tasks locally by plannedDate and then by startTime
      tasksArray.sort((a, b) => {
        const dateA = a.plannedDate || '';
        const dateB = b.plannedDate || '';
        const timeA = a.startTime || '00:00';
        const timeB = b.startTime || '00:00';

        if (dateA !== dateB) {
          return dateA.localeCompare(dateB);
        }
        return timeA.localeCompare(timeB);
      });

      setTasks(tasksArray);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tasks: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-gray-500 mt-10">Loading reports...</div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span>Task Reports</span>
      </div>
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Task Reports</h1>
      <Card>
        <CardHeader>
          <CardTitle>Detailed Task View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.project}</TableCell>
                    <TableCell>{task.assignee}</TableCell>
                    <TableCell>{task.taskName}</TableCell>
                    <TableCell>{task.plannedDate}</TableCell>
                    <TableCell>{task.startTime} - {task.endTime}</TableCell>
                    <TableCell>{task.city}</TableCell>
                    <TableCell>{task.location}</TableCell>
                    <TableCell>
                      <Badge className={
                        task.status === 'Planned' ? 'bg-blue-500 hover:bg-blue-600' :
                        task.status === 'In Progress' ? 'bg-yellow-500 hover:bg-yellow-600' :
                        'bg-green-500 hover:bg-green-600'
                      }>
                        {task.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;