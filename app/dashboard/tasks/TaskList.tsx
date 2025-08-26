'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, DocumentData, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

type Task = {
  id: string;
  summary?: string;
  assignee?: string;
  assigneeUid?: string;
  description?: string;
  serviceType?: string;
  priority?: string;
  scheduledTime?: string;
  estimatedDuration?: number;
  dueDate?: string;
  location?: string;
  locationUrl?: string;
  customerName?: string;
  customerContact?: string;
  status?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  notes?: string;
};

type GroupedTasks = { [key: string]: Task[] };

const TaskList = ({ userRole, userEmail, userUid, search }: { userRole: string | null; userEmail: string | null; userUid: string | null; search: string }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasks>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    const taskDocRef = doc(db, 'tasks', taskId);
    try {
      await updateDoc(taskDocRef, { status: newStatus });
      toast.success('Status updated successfully!');
    } catch (error) {
      toast.error('Failed to update status.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this work order?')) {
      const taskDocRef = doc(db, 'tasks', taskId);
      try {
        await deleteDoc(taskDocRef);
        toast.success('Work order deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete work order.');
      }
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    const taskDocRef = doc(db, 'tasks', taskId);
    try {
      console.log('Update payload:', updates); // Log the payload for debugging
      // Validate and format updates
      const validUpdates: Partial<Task> = {};
      if (updates.actualStartTime) validUpdates.actualStartTime = updates.actualStartTime;
      if (updates.actualEndTime) validUpdates.actualEndTime = updates.actualEndTime;
      if (updates.notes !== undefined) validUpdates.notes = updates.notes; // Allow empty notes

      await updateDoc(taskDocRef, validUpdates);
      toast.success('Work order updated successfully!');
      setEditTask(null);
    } catch (error) {
      console.error('Update error:', error); // Log error details
      toast.error(`Failed to update work order. ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersArray = snapshot.docs.map(doc => {
        const email = doc.data().email as string;
        return email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
      });
      setAssignees(usersArray);
    });

    return () => unsubscribeUsers();
  }, []);

  useEffect(() => {
    let q = query(collection(db, 'tasks'));
    if (userRole === 'employee' && userUid) {
      q = query(collection(db, 'tasks'), where('assigneeUid', '==', userUid));
    }

    const unsubscribeTasks = onSnapshot(q, (snapshot) => {
      const tasksArray: Task[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as DocumentData,
      }));

      tasksArray.sort((a, b) => {
        const dateA = a.scheduledTime || '';
        const dateB = b.scheduledTime || '';
        return dateA.localeCompare(dateB);
      });

      setTasks(tasksArray);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tasks: ', error);
      setLoading(false);
    });

    return () => unsubscribeTasks();
  }, [userRole, userUid]);

  useEffect(() => {
    let newFilteredTasks = tasks.filter(task =>
      (task.summary?.toLowerCase().includes(search.toLowerCase()) ||
       task.customerName?.toLowerCase().includes(search.toLowerCase()) ||
       task.location?.toLowerCase().includes(search.toLowerCase()))
    );

    const today = format(new Date(), 'yyyy-MM-dd');
    const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

    if (filter === 'Today') {
      newFilteredTasks = newFilteredTasks.filter(task => task.scheduledTime?.startsWith(today));
    } else if (filter === 'Tomorrow') {
      newFilteredTasks = newFilteredTasks.filter(task => task.scheduledTime?.startsWith(tomorrow));
    } else if (filter === 'Planned' || filter === 'In Progress' || filter === 'Done' || filter === 'Delayed' || filter === 'Cancelled') {
      newFilteredTasks = newFilteredTasks.filter(task => task.status === filter);
    } else if (filter !== 'All') {
      newFilteredTasks = newFilteredTasks.filter(task => task.assignee === filter);
    }

    const newGroupedTasks: GroupedTasks = newFilteredTasks.reduce((groups, task) => {
      const date = task.scheduledTime ? task.scheduledTime.split(' ')[0] : 'No Date';
      groups[date] = groups[date] || [];
      groups[date].push(task);
      return groups;
    }, {} as GroupedTasks);

    setGroupedTasks(newGroupedTasks);
  }, [filter, tasks, search]);

  if (loading) {
    return <div className="text-center text-gray-500">Loading work orders...</div>;
  }

  const filterOptions = ['All', 'Today', 'Tomorrow', 'Planned', 'In Progress', 'Done', 'Delayed', 'Cancelled', ...assignees];
  const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Current Work Orders</h3>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter work orders" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map(option => (
              <SelectItem key={option} value={option}>
                {option === 'All' || option === 'Today' || option === 'Tomorrow' ||
                 ['Planned', 'In Progress', 'Done', 'Delayed', 'Cancelled'].includes(option)
                  ? option
                  : `WO for ${option}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {Object.keys(groupedTasks).length === 0 ? (
        <p className="text-gray-500 text-center">No work orders found for this view.</p>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedTasks).sort().map(date => (
            <div key={date}>
              <h4 className="text-xl font-bold text-gray-700 mb-2">{date}</h4>
              <div className="space-y-4">
                {groupedTasks[date].map(task => (
                  <Card key={task.id} className="p-4 shadow-sm">
                    <CardContent className="p-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-lg font-bold text-gray-900">{task.summary}</p>
                          <p className="text-gray-600">Assignee: {task.assignee}</p>
                          <Badge
                            className={cn(
                              task.priority === 'High' && 'bg-red-500',
                              task.priority === 'Medium' && 'bg-yellow-500',
                              task.priority === 'Low' && 'bg-green-500'
                            )}
                          >
                            Priority: {task.priority}
                          </Badge>
                        </div>
                        <Badge
                          className={cn(
                            task.status === 'Planned' && 'bg-blue-500',
                            task.status === 'In Progress' && 'bg-yellow-500',
                            task.status === 'Done' && 'bg-green-500',
                            task.status === 'Delayed' && 'bg-red-500',
                            task.status === 'Cancelled' && 'bg-gray-500'
                          )}
                        >
                          {task.status}
                        </Badge>
                      </div>
                      <Accordion type="single" collapsible>
                        <AccordionItem value="details">
                          <AccordionTrigger>Details</AccordionTrigger>
                          <AccordionContent>
                            <p className="text-gray-600">Service Type: {task.serviceType}</p>
                            <p className="text-gray-600">Scheduled: {task.scheduledTime}</p>
                            <p className="text-gray-600">Duration: {task.estimatedDuration} hours</p>
                            <p className="text-gray-600">Due Date: {task.dueDate}</p>
                            <p className="text-gray-600">Location: {task.location}</p>
                            {task.locationUrl && (
                              <p className="text-gray-600">
                                <a
                                  href={task.locationUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  View on Map
                                </a>
                              </p>
                            )}
                            <p className="text-gray-600">Customer: {task.customerName}</p>
                            <p className="text-gray-600">
                              Contact:{' '}
                              {task.customerContact?.includes('@') ? (
                                <a href={`mailto:${task.customerContact}`} className="text-blue-500 hover:text-blue-700">
                                  {task.customerContact}
                                </a>
                              ) : (
                                <a href={`tel:${task.customerContact}`} className="text-blue-500 hover:text-blue-700">
                                  {task.customerContact}
                                </a>
                              )}
                            </p>
                            <p className="text-gray-600">Description: {task.description}</p>
                            {task.notes && <p className="text-gray-600">Notes: {task.notes}</p>}
                            {task.actualStartTime && <p className="text-gray-600">Actual Start: {task.actualStartTime}</p>}
                            {task.actualEndTime && <p className="text-gray-600">Actual End: {task.actualEndTime}</p>}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                      <div className="flex mt-2 space-x-2">
                        {userRole === 'employee' && (
                          <>
                            <Button
                              onClick={() => handleUpdateStatus(task.id, task.status === 'Planned' ? 'In Progress' : 'Done')}
                              variant="outline"
                              size="sm"
                              disabled={task.status !== 'Planned' && task.status !== 'In Progress'}
                            >
                              {task.status === 'Planned' ? 'Start' : 'Complete'}
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">Add Note/Time</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Update Work Order</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="actualStartTime">Actual Start Time</Label>
                                    <Input
                                      id="actualStartTime"
                                      type="datetime-local"
                                      value={editTask?.actualStartTime || task.actualStartTime || ''} // Use value instead of defaultValue
                                      onChange={(e) => setEditTask({ ...task, actualStartTime: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="actualEndTime">Actual End Time</Label>
                                    <Input
                                      id="actualEndTime"
                                      type="datetime-local"
                                      value={editTask?.actualEndTime || task.actualEndTime || ''} // Use value instead of defaultValue
                                      onChange={(e) => setEditTask({ ...task, actualEndTime: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                      id="notes"
                                      value={editTask?.notes || task.notes || ''} // Use value instead of defaultValue
                                      onChange={(e) => setEditTask({ ...task, notes: e.target.value })}
                                      placeholder="Add notes or updates"
                                    />
                                  </div>
                                  <Button
                                    onClick={() =>
                                      handleUpdateTask(task.id, {
                                        actualStartTime: editTask?.actualStartTime || task.actualStartTime,
                                        actualEndTime: editTask?.actualEndTime || task.actualEndTime,
                                        notes: editTask?.notes || task.notes,
                                      })
                                    }
                                  >
                                    Save Updates
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                        {isManagerOrAdmin && (
                          <>
                            <Select
                              value={task.status}
                              onValueChange={(value) => handleUpdateStatus(task.id, value)}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {['Planned', 'In Progress', 'Done', 'Delayed', 'Cancelled'].map(status => (
                                  <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              onClick={() => handleDeleteTask(task.id)}
                              variant="destructive"
                              size="sm"
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;