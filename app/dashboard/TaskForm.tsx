'use client';

import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React from 'react';

const TaskForm = () => {
  const [project, setProject] = useState('');
  const [assignee, setAssignee] = useState('');
  const [customer, setCustomer] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [status, setStatus] = useState('Planned');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Add a new document with the task data to the 'tasks' collection
      await addDoc(collection(db, 'tasks'), {
        project,
        assignee,
        customer,
        plannedDate,
        status,
        createdAt: new Date(),
      });
      // Clear the form fields after successful submission
      setProject('');
      setAssignee('');
      setCustomer('');
      setPlannedDate('');
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
      <div>
        <label className="block text-sm font-medium text-gray-700">Customer</label>
        <input
          type="text"
          value={customer}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomer(e.target.value)}
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
