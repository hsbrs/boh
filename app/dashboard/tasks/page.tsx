'use client';

import Link from 'next/link';
import TaskForm from './TaskForm';
import TaskList from './TaskList';

const TasksPage = () => {
  return (
    <div className="flex min-h-screen bg-gray-100 p-8">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span>Task Management</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-6">Task Management</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <TaskForm />
          <TaskList />
        </div>
      </div>
    </div>
  );
};

export default TasksPage;