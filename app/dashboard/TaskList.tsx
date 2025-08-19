'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, DocumentData, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React from 'react';

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

const TaskList = () => {
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasks>({});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: string; } | null>(null);

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
    const q = query(collection(db, 'tasks'), orderBy('plannedDate', 'asc'), orderBy('startTime', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksArray: Task[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as DocumentData),
      }));

      // Group the tasks by date
      const newGroupedTasks: GroupedTasks = tasksArray.reduce((groups, task) => {
        const date = task.plannedDate || 'No Date';
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(task);
        return groups;
      }, {} as GroupedTasks);

      setGroupedTasks(newGroupedTasks);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tasks: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-500">Loading tasks...</div>;
  }

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Tasks</h3>
        {Object.keys(groupedTasks).length === 0 ? (
          <p className="text-gray-500 text-center">No tasks found. Add a new one!</p>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedTasks).map(date => (
              <div key={date}>
                <h4 className="text-xl font-bold text-gray-700 mb-2">{date}</h4>
                <div className="space-y-4">
                  {groupedTasks[date].map(task => (
                    <div key={task.id} className="p-4 border border-gray-200 rounded-md shadow-sm">
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
                      <div className="flex mt-2 space-x-2">
                        <button
                          onClick={() => handleUpdateStatus(task.id, task.status as string)}
                          className="bg-gray-200 text-gray-800 text-sm font-semibold py-1 px-3 rounded-md hover:bg-gray-300 transition-colors"
                        >
                          Change Status
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="bg-red-500 text-white text-sm font-semibold py-1 px-3 rounded-md hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
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
