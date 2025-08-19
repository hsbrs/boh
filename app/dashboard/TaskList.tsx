'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Define the type for a task to provide type safety
// We are making the properties optional because of the doc.data() spread operator
// and to be flexible for future changes.
type Task = {
  id: string;
  project?: string;
  assignee?: string;
  customer?: string;
  plannedDate?: string;
  status?: string;
};

const TaskList = () => {
  // Explicitly tell useState that the array will hold Task objects
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up a real-time listener for the 'tasks' collection
    const q = query(collection(db, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksArray = snapshot.docs.map(doc => ({
        id: doc.id,
        // The spread operator correctly pulls all other fields from the document data
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
              <p className="text-gray-600">Customer: {task.customer}</p>
              <p className="text-gray-600">Planned Date: {task.plannedDate}</p>
              <p className={`font-semibold ${task.status === 'Planned' ? 'text-blue-500' : 'text-green-500'}`}>
                Status: {task.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;
