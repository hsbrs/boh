'use client';

import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React from 'react';
import { format } from 'date-fns';

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "@radix-ui/react-icons";

const cities = ["Herzogenrath", "Lippstadt", "Emmerich"];
const assignees = ["Hady", "Kevin", "Maik", "Rene", "Andre"];
// New logic to generate time options from 06:00 to 18:00 in one-hour intervals
const timeOptions = Array.from({ length: 13 }, (_, i) => {
  const hour = (6 + i).toString().padStart(2, '0');
  return `${hour}:00`;
});

const TaskForm = ({ showNotification }: { showNotification: (message: string, type: string) => void }) => {
  const [project, setProject] = useState('');
  const [assignee, setAssignee] = useState(assignees[0]);
  const [taskName, setTaskName] = useState('');
  const [plannedDate, setPlannedDate] = useState<Date | undefined>(undefined);
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
        plannedDate: plannedDate ? format(plannedDate, 'yyyy-MM-dd') : '',
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
      setPlannedDate(undefined);
      setStartTime('');
      setEndTime('');
      setCity(cities[0]);
      setLocation('');
      setLocationUrl('');
      setStatus('Planned');
      showNotification('Task added successfully!', 'success');
    } catch (error) {
      if (error instanceof Error) {
        showNotification('Error adding task: ' + error.message, 'error');
      } else {
        showNotification('An unknown error occurred.', 'error');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Add New Task</h3>
      <div className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="project">Project</Label>
          <Input
            id="project"
            type="text"
            value={project}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProject(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
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
        <div className="space-y-1">
          <Label htmlFor="taskName">Task</Label>
          <Input
            id="taskName"
            type="text"
            value={taskName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaskName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="plannedDate">Planned Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !plannedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {plannedDate ? format(plannedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={plannedDate}
                onSelect={setPlannedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex space-x-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="startTime">Start Time</Label>
            <Select onValueChange={setStartTime} value={startTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select a time" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>{time}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="endTime">End Time</Label>
            <Select onValueChange={setEndTime} value={endTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select a time" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>{time}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
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
        <div className="space-y-1">
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
        <div className="space-y-1">
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