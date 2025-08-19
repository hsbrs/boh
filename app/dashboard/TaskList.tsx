'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, DocumentData, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React from 'react';

// Define the type for a task to provide type safety
type Task = {
  id: string;
  project?: string;
  assignee?: string;
  taskName?: string; // Updated to taskName
  plannedDate?: string;
  startTime?: string; // New field
  endTime?: string;   // New field
  location?: string;  // New field
  status?: string;
};

const TaskList = () => {
  // Explicitly tell useState that the array will hold Task objects
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: string; } | null>(null);

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000); // Hides the notification after 3 seconds
  };

  // Function to handle status updates
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

  // Function to handle task deletion
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
    // Set up a real-time listener for the 'tasks' collection
    const q = query(collection(db, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as DocumentData),
      }));
      setTasks(tasksArray as Task[]);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tasks: ", error);
      setLoading(false);
    });

    // Clean up the listener on component unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-500">Loading tasks...</div>;
  }

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Tasks</h3>
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center">No tasks found. Add a new one!</p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="p-4 border border-gray-200 rounded-md shadow-sm">
                <p className="text-lg font-bold text-gray-900">{task.project}</p>
                <p className="text-gray-600">Assignee: {task.assignee}</p>
                <p className="text-gray-600">Task: {task.taskName}</p> {/* Changed from Customer to Task */}
                <p className="text-gray-600">Planned Date: {task.plannedDate}</p>
                <p className="text-gray-600">Time: {task.startTime} - {task.endTime}</p> {/* New time display */}
                <p className="text-gray-600">Location: {task.location}</p> {/* New location display */}
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
