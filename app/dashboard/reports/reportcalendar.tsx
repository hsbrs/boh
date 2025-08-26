'use client';

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock } from 'lucide-react';
import 'react-day-picker/dist/style.css';

type Task = {
  id: string;
  summary?: string;
  scheduledTime?: string;
  priority?: string;
  status?: string;
  assignee?: string;
  description?: string;
  serviceType?: string;
};

type CalendarProps = {
  tasks: Task[];
  userRole?: string | null;
};

const ReportCalendar = ({ tasks, userRole }: CalendarProps) => {
  const [calendarFilter, setCalendarFilter] = useState('All');
  const [calendarSearch, setCalendarSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Convert tasks to calendar events with dates
  const calendarEvents = tasks
    .filter(task => task.scheduledTime)
    .map(task => ({
      ...task,
      date: new Date(task.scheduledTime!),
    }));

  // Filter events based on search and status
  const filteredEvents = calendarEvents.filter(ev => {
    const matchesSearch = ev.summary?.toLowerCase().includes(calendarSearch.toLowerCase()) || false;
    const matchesFilter = calendarFilter === 'All' || ev.status === calendarFilter;
    return matchesSearch && matchesFilter;
  });

  // Get tasks for selected date
  const selectedDateTasks = selectedDate 
    ? filteredEvents.filter(ev => 
        ev.date.toDateString() === selectedDate.toDateString()
      )
    : [];

  // Handle search input with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    setCalendarSearch(e.target.value);
    setTimeout(() => setIsLoading(false), 300);
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setIsLoading(true);
    setCalendarFilter(value);
    setTimeout(() => setIsLoading(false), 200);
  };

  // Badge helper for task details dialog
  const renderBadge = (label: string, type: 'priority' | 'status') => {
    if (!label) return null;
    if (type === 'priority') {
      if (label === 'High') return <Badge variant="destructive">High</Badge>;
      if (label === 'Medium') return <Badge variant="secondary">Medium</Badge>;
      return <Badge variant="outline">Low</Badge>;
    } else {
      if (label === 'Planned') return <Badge className="bg-blue-500 text-white">Planned</Badge>;
      if (label === 'In Progress') return <Badge className="bg-yellow-500 text-black">In Progress</Badge>;
      if (label === 'Done') return <Badge className="bg-green-600 text-white">Done</Badge>;
      if (label === 'Delayed') return <Badge className="bg-red-600 text-white">Delayed</Badge>;
      return <Badge variant="outline">{label}</Badge>;
    }
  };

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return filteredEvents.filter(ev => 
      ev.date.toDateString() === date.toDateString()
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <span>Work Orders Calendar</span>
          <div className="text-sm text-gray-500 font-normal">
            {filteredEvents.length} of {calendarEvents.length} events
          </div>
        </CardTitle>
        
        <div className="flex flex-col md:flex-row justify-between items-center mt-4 w-full gap-4">
          <div className="relative w-full md:w-auto">
            <Input
              placeholder="Search events..."
              value={calendarSearch}
              onChange={handleSearchChange}
              className="w-full md:w-80 pr-8"
              disabled={isLoading}
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          
          <Select value={calendarFilter} onValueChange={handleFilterChange} disabled={isLoading}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Planned">Planned</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
              <SelectItem value="Delayed">Delayed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Calendar Legend */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-3">Calendar Legend</div>
          <div className="flex flex-wrap gap-6">
            {/* Status Legend */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">Status:</span>
              <div className="flex gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-gray-600">Planned</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-xs text-gray-600">In Progress</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-xs text-gray-600">Done</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs text-gray-600">Delayed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="border rounded-lg p-4 bg-white"
            />
          </div>
          
          {/* Selected Date Tasks */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Tasks for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
            </h3>
            
            {selectedDateTasks.length === 0 ? (
              <p className="text-gray-500">No tasks scheduled for this date.</p>
            ) : (
              <div className="space-y-3">
                {selectedDateTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{task.summary}</h4>
                      {renderBadge(task.status || '', 'status')}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p><strong>Assignee:</strong> {task.assignee || 'Unassigned'}</p>
                      <p><strong>Service:</strong> {task.serviceType || 'N/A'}</p>
                      <p><strong>Time:</strong> {format(task.date, 'h:mm a')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Task Detail Dialog */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{selectedTask.summary}</h2>
                <div className="flex gap-2">
                  {renderBadge(selectedTask.priority || '', 'priority')}
                  {renderBadge(selectedTask.status || '', 'status')}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      <strong>Scheduled:</strong> {selectedTask.scheduledTime ? new Date(selectedTask.scheduledTime).toLocaleString() : 'Not scheduled'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      <strong>Service Type:</strong> {selectedTask.serviceType || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <strong>Assignee:</strong> {selectedTask.assignee || 'Unassigned'}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <strong>Description:</strong>
                    <p className="mt-1 text-gray-700">{selectedTask.description || 'No description provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default ReportCalendar;
