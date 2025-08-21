'use client';

import Link from 'next/link';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from "@/lib/utils";
import { CheckCircleIcon, AlertCircleIcon, XIcon } from "lucide-react";

// NotificationBanner component (Moved here to be shared by children)
function NotificationBanner({ message, type, onDismiss }: { message: string; type: string; onDismiss: () => void }) {
  const isSuccess = type === 'success';
  const icon = isSuccess ? <CheckCircleIcon /> : <AlertCircleIcon />;
  const cardClassName = isSuccess ? 'border-green-500 bg-green-500' : 'border-red-500 bg-red-500';

  return (
    <Card
      data-slot="card"
      className={cn(
        "bg-white flex flex-col gap-6 rounded-xl border p-4 shadow-sm fixed bottom-4 right-4 z-50 text-white transition-all duration-300 ease-in-out transform translate-x-0",
        cardClassName
      )}
    >
      <div className="flex items-center space-x-2">
        {icon}
        <span className="font-semibold">{message}</span>
        <Button onClick={onDismiss} variant="ghost" size="sm" className="ml-auto p-0 text-white hover:bg-transparent">
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

const TasksPage = () => {
  const [notification, setNotification] = useState<{ message: string; type: string; } | null>(null);
  
  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

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
          <TaskForm showNotification={showNotification} />
          <TaskList showNotification={showNotification} />
        </div>
      </div>
      {notification && (
        <NotificationBanner
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default TasksPage;