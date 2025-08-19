'use client';

import TaskForm from './TaskForm';
import TaskList from './TaskList';

const TasksPage = () => {
  return (
    <div className="flex min-h-screen bg-gray-100 p-8">
      <div className="w-full max-w-6xl mx-auto">
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