'use client';

import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React from 'react';

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const cities = ["Herzogenrath", "Lippstadt", "Emmerich"];
const assignees = ["Hady", "Kevin", "Maik", "Rene", "Andre"];

const TaskForm = () => {
  const [project, setProject] = useState('');
  const [assignee, setAssignee] = useState(assignees[0]);
  const [taskName, setTaskName] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [city, setCity] = useState(cities[0]);
  const [location, setLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [status, setStatus] = useState('Planned');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'tasks'), {
        project,
        assignee,
        taskName,
        plannedDate,
        startTime,
        endTime,
        city,
        location,
        locationUrl,
        status,
        createdAt: new Date(),
      });
      setProject('');
      setAssignee(assignees[0]);
      setTaskName('');
      setPlannedDate('');
      setStartTime('');
      setEndTime('');
      setCity(cities[0]);
      setLocation('');
      setLocationUrl('');
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
      <div className="space-y-4">
        <div>
          <Label htmlFor="project">Project</Label>
          <Input
            id="project"
            type="text"
            value={project}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProject(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="assignee">Assignee</Label>
          <Select value={assignee} onValueChange={setAssignee} required>
            <SelectTrigger>
              <SelectValue placeholder="Select an assignee" />
            </SelectTrigger>
            <SelectContent>
              {assignees.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="taskName">Task</Label>
          <Input
            id="taskName"
            type="text"
            value={taskName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaskName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="plannedDate">Planned Date</Label>
          <Input
            id="plannedDate"
            type="date"
            value={plannedDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlannedDate(e.target.value)}
            required
          />
        </div>
        <div className="flex space-x-4">
          <div className="flex-1">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Select value={city} onValueChange={setCity} required>
            <SelectTrigger>
              <SelectValue placeholder="Select a city" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="location">Location Address</Label>
          <Input
            id="location"
            type="text"
            value={location}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
            placeholder="e.g., 123 Main St"
            required
          />
        </div>
        <div>
          <Label htmlFor="locationUrl">Google Maps URL</Label>
          <Input
            id="locationUrl"
            type="url"
            value={locationUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocationUrl(e.target.value)}
            placeholder="https://maps.app.goo.gl/..."
          />
        </div>
      </div>
      <Button type="submit" className="w-full">
        Add Task
      </Button>
    </form>
  );
};

export default TaskForm;
