'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, DocumentData, doc, updateDoc, deleteDoc, where } from 'firebase/firestore'; // Import 'where'
import { db } from '@/lib/firebase';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
// Import shadcn/ui Select components for the filter
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

// Define the type for the grouped tasks object
type GroupedTasks = {
  [key: string]: Task[];
};

// Component now accepts 'userRole' and 'userEmail' props
const TaskList = ({ userRole, userEmail }: { userRole: string | null; userEmail: string | null; }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasks>({});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: string; } | null>(null);
  const [filter, setFilter] = useState('All');

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleUpdateStatus = async (taskId: string, currentStatus: string) => {
    const taskDocRef = doc(db, 'tasks', taskId);
    let newStatus = 'In Progress';
    if (currentStatus === 'In Progress') {
      newStatus = 'Done';
    } else if (currentStatus === 'Done') {
      newStatus = 'Planned';
    }
    
    try {
      await updateDoc(taskDocRef, { status: newStatus });
      showNotification('Task status updated successfully!', 'success');
    } catch (error) {
      console.error("Error updating status: ", error);
      showNotification('Error updating status.', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      const taskDocRef = doc(db, 'tasks', taskId);
      try {
        await deleteDoc(taskDocRef);
        showNotification('Task deleted successfully!', 'success');
      } catch (error) {
        console.error("Error deleting task: ", error);
        showNotification('Error deleting task.', 'error');
      }
    }
  };

  useEffect(() => {
    let q = query(collection(db, 'tasks'));
    if (userRole === 'employee' && userEmail) {
      const assigneeName = userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1);
      q = query(collection(db, 'tasks'), where('assignee', '==', assigneeName));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let tasksArray: Task[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as DocumentData),
      }));

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
  }, [userRole, userEmail]);

  useEffect(() => {
    let newFilteredTasks = tasks;
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const todayDate = today.toISOString().split('T')[0];
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    if (filter === 'Today') {
      newFilteredTasks = tasks.filter(task => task.plannedDate === todayDate);
    } else if (filter === 'Tomorrow') {
      newFilteredTasks = tasks.filter(task => task.plannedDate === tomorrowDate);
    } else if (filter !== 'All') {
      newFilteredTasks = tasks.filter(task => task.assignee === filter);
    }

    const newGroupedTasks: GroupedTasks = newFilteredTasks.reduce((groups, task) => {
      const date = task.plannedDate || 'No Date';
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(task);
      return groups;
    }, {} as GroupedTasks);

    setGroupedTasks(newGroupedTasks);
  }, [filter, tasks]);

  if (loading) {
    return <div className="text-center text-gray-500">Loading tasks...</div>;
  }

  const assignees = ["Hady", "Kevin", "Maik", "Rene", "Andre"];
  const filterOptions = ['All', 'Today', 'Tomorrow', ...assignees];

  const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Current Tasks</h3>
          {isManagerOrAdmin && (
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tasks for All" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map(option => (
                  <SelectItem key={option} value={option}>
                    {option.startsWith('H') || option.startsWith('K') || option.startsWith('M') || option.startsWith('R') || option.startsWith('A') ? `Tasks for ${option}` : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        {Object.keys(groupedTasks).length === 0 ? (
          <p className="text-gray-500 text-center">No tasks found for this view.</p>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedTasks).map(date => (
              <div key={date}>
                <h4 className="text-xl font-bold text-gray-700 mb-2">{date}</h4>
                <div className="space-y-4">
                  {groupedTasks[date].map(task => (
                    <Card key={task.id} className="p-4 shadow-sm">
                      <CardContent className="p-0">
                        <p className="text-lg font-bold text-gray-900">{task.project}</p>
                        <p className="text-gray-600">Assignee: {task.assignee}</p>
                        <p className="text-gray-600">Task: {task.taskName}</p>
                        <p className="text-gray-600">Planned Date: {task.plannedDate}</p>
                        <p className="text-gray-600">Time: {task.startTime} - {task.endTime}</p>
                        <p className="text-gray-600">City: {task.city}</p>
                        {task.location && (
                          <p className="text-gray-600 flex items-center">
                            Location: {task.location}
                            {task.locationUrl && (
                              <a
                                href={task.locationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                              </a>
                            )}
                          </p>
                        )}
                        <p className={`font-semibold ${task.status === 'Planned' ? 'text-blue-500' : task.status === 'In Progress' ? 'text-yellow-500' : 'text-green-500'}`}>
                          Status: {task.status}
                        </p>
                        {isManagerOrAdmin && (
                          <div className="flex mt-2 space-x-2">
                            <Button
                              onClick={() => handleUpdateStatus(task.id, task.status as string)}
                              variant="outline"
                              size="sm"
                            >
                              Change Status
                            </Button>
                            <Button
                              onClick={() => handleDeleteTask(task.id)}
                              variant="destructive"
                              size="sm"
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white transition-all duration-300 ease-in-out`}>
          {notification.message}
        </div>
      )}
    </>
  );
};

export default TaskList;