'use client';

import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React from 'react';

const TaskForm = () => {
  const [project, setProject] = useState('');
  const [assignee, setAssignee] = useState('');
  const [taskName, setTaskName] = useState(''); // Updated to 'taskName'
  const [plannedDate, setPlannedDate] = useState('');
  const [startTime, setStartTime] = useState(''); // New state for start time
  const [endTime, setEndTime] = useState(''); // New state for end time
  const [location, setLocation] = useState(''); // New state for location
  const [status, setStatus] = useState('Planned');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Add a new document with the task data to the 'tasks' collection
      await addDoc(collection(db, 'tasks'), {
        project,
        assignee,
        taskName, // Changed from customer to taskName
        plannedDate,
        startTime, // New field
        endTime,   // New field
        location,  // New field
        status,
        createdAt: new Date(),
      });
      // Clear the form fields after successful submission
      setProject('');
      setAssignee('');
      setTaskName('');
      setPlannedDate('');
      setStartTime('');
      setEndTime('');
      setLocation('');
      setStatus('Planned');
      alert('Task added successfully!');
    } catch (error) {
      if (error instanceof Error) {
        alert('Error adding task: ' + error.message);
      } else {
        alert('An unknown error occurred.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Add New Task</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700">Project</label>
        <input
          type="text"
          value={project}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProject(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Assignee</label>
        <input
          type="text"
          value={assignee}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssignee(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      {/* Updated field to 'Task' */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Task</label>
        <input
          type="text"
          value={taskName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaskName(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Planned Date</label>
        <input
          type="date"
          value={plannedDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlannedDate(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      {/* New Time and Location Fields */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Location</label>
        <input
          type="text"
          value={location}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., 123 Main St, Anytown"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md shadow-md hover:bg-blue-700 transition-colors"
      >
        Add Task
      </button>
    </form>
  );
};

export default TaskForm;
