'use client';

import { useState, useEffect } from 'react';
import { addDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from '@radix-ui/react-icons';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const serviceTypes = ['Installation', 'Repair', 'Maintenance', 'Inspection'];
const priorities = ['High', 'Medium', 'Low'];

const TaskForm = () => {
  const [summary, setSummary] = useState('');
  const [assignee, setAssignee] = useState<{ name: string; uid: string } | null>(null);
  const [assignees, setAssignees] = useState<{ name: string; uid: string }[]>([]);
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState(serviceTypes[0]);
  const [priority, setPriority] = useState(priorities[1]);
  const [scheduledTime, setScheduledTime] = useState<Date | undefined>(undefined);
  const [estimatedDuration, setEstimatedDuration] = useState('1');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [location, setLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [status, setStatus] = useState('Planned');

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersArray = snapshot.docs.map(doc => ({
        name: doc.data().email.split('@')[0].charAt(0).toUpperCase() + doc.data().email.split('@')[0].slice(1),
        uid: doc.id,
      }));
      setAssignees(usersArray);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!assignee) {
      toast.error('Please select an assignee.');
      return;
    }
    try {
      await addDoc(collection(db, 'tasks'), {
        summary,
        assignee: assignee.name,
        assigneeUid: assignee.uid,
        description,
        serviceType,
        priority,
        scheduledTime: scheduledTime ? format(scheduledTime, 'yyyy-MM-dd HH:mm') : '',
        estimatedDuration: parseFloat(estimatedDuration),
        dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : '',
        location,
        locationUrl,
        customerName,
        customerContact,
        status,
        createdAt: new Date(),
        actualStartTime: '',
        actualEndTime: '',
        notes: '',
      });

      setSummary('');
      setAssignee(null);
      setDescription('');
      setServiceType(serviceTypes[0]);
      setPriority(priorities[1]);
      setScheduledTime(undefined);
      setEstimatedDuration('1');
      setDueDate(undefined);
      setLocation('');
      setLocationUrl('');
      setCustomerName('');
      setCustomerContact('');
      setStatus('Planned');
      toast.success('Work order added successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Create Work Order</h3>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="summary">Summary</Label>
                        <Input
                            id="summary"
                            type="text"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            required
                            placeholder="e.g., Install Fiber Optic Cable"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="assignee">Assignee</Label>
                        <Select
                            value={assignee?.name || ''}
                            onValueChange={(value) => {
                                const selected = assignees.find(a => a.name === value);
                                setAssignee(selected || null);
                            }}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select an assignee" />
                            </SelectTrigger>
                            <SelectContent>
                                {assignees.map((a) => (
                                    <SelectItem key={a.uid} value={a.name}>{a.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detailed instructions for the technician"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="serviceType">Service Type</Label>
                        <Select value={serviceType} onValueChange={setServiceType} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a service type" />
                            </SelectTrigger>
                            <SelectContent>
                                {serviceTypes.map((type) => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={priority} onValueChange={setPriority} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                {priorities.map((p) => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="scheduledTime">Scheduled Time</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn('w-full justify-start text-left font-normal', !scheduledTime && 'text-muted-foreground')}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {scheduledTime ? format(scheduledTime, 'PPP HH:mm') : <span>Pick a date and time</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={scheduledTime}
                                    onSelect={setScheduledTime}
                                    initialFocus
                                />
                                <div className="p-3 border-t">
                                    <Input
                                        type="time"
                                        value={scheduledTime ? format(scheduledTime, 'HH:mm') : ''}
                                        onChange={(e) => {
                                            if (e.target.value && scheduledTime) {
                                                const [hours, minutes] = e.target.value.split(':').map(Number);
                                                const newDate = new Date(scheduledTime);
                                                newDate.setHours(hours, minutes);
                                                setScheduledTime(newDate);
                                            }
                                        }}
                                    />
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="estimatedDuration">Estimated Duration (hours)</Label>
                        <Input
                            id="estimatedDuration"
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={estimatedDuration}
                            onChange={(e) => setEstimatedDuration(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn('w-full justify-start text-left font-normal', !dueDate && 'text-muted-foreground')}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dueDate ? format(dueDate, 'PPP') : <span>Pick a due date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={dueDate}
                                    onSelect={setDueDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="location">Location Address</Label>
                        <Input
                            id="location"
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g., 123 Main St, Herzogenrath"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="locationUrl">Google Maps URL (Optional)</Label>
                        <Input
                            id="locationUrl"
                            type="url"
                            value={locationUrl}
                            onChange={(e) => setLocationUrl(e.target.value)}
                            placeholder="https://maps.google.com/..."
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="customerName">Customer Name</Label>
                        <Input
                            id="customerName"
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="e.g., John Doe or Acme Corp"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="customerContact">Customer Contact</Label>
                        <Input
                            id="customerContact"
                            type="text"
                            value={customerContact}
                            onChange={(e) => setCustomerContact(e.target.value)}
                            placeholder="e.g., john.doe@example.com or +1234567890"
                        />
                    </div>
                </div>
            </div>
            <Button type="submit" className="w-full">Create Work Order</Button>
        </form>
    </div>
  );
};

export default TaskForm;