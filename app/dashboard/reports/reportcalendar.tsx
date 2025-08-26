'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Pre-process tasks for efficient lookup
  const tasksByDate = new Map<string, Task[]>();
  tasks.forEach(task => {
    if (task.scheduledTime) {
      const dateKey = format(new Date(task.scheduledTime), 'yyyy-MM-dd');
      if (!tasksByDate.has(dateKey)) {
        tasksByDate.set(dateKey, []);
      }
      tasksByDate.get(dateKey)?.push(task);
    }
  });

  // Calculate the days to display for the current month
  const startOfView = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
  const endOfView = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
  const daysInMonthView = eachDayOfInterval({ start: startOfView, end: endOfView });

  // Create day headers
  const weekDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Functions to navigate the calendar
  const handlePreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Filter events based on search and status
  const filteredEvents = tasks.filter(task => {
    const matchesSearch = task.summary?.toLowerCase().includes(calendarSearch.toLowerCase()) || false;
    const matchesFilter = calendarFilter === 'All' || task.status === calendarFilter;
    return matchesSearch && matchesFilter;
  });

  // Get tasks for selected date
  const selectedDateTasks = selectedDate
    ? filteredEvents.filter(task =>
        task.scheduledTime && isSameDay(new Date(task.scheduledTime), selectedDate)
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

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4">
            <div className="relative w-full md:w-auto">
              {/* This search field is requested to be removed */}
            </div>
            
            {/* This filter is requested to be moved */}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-6">
            {/* Custom Calendar */}
            <div className="lg:col-span-2 flex flex-col bg-white rounded-lg border">
              {/* Calendar Header with navigation buttons */}
              <div className="flex justify-between items-center p-4 border-b">
                  <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
                      <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="font-semibold text-lg">{format(currentMonth, 'MMMM yyyy')}</h3>
                  <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                      <ChevronRight className="h-4 w-4" />
                  </Button>
              </div>

              {/* Weekdays Header */}
              <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-500 py-2">
                  {weekDayNames.map(day => (
                      <div key={day}>{day}</div>
                  ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid flex-1 grid-cols-7 auto-rows-fr p-2 gap-1">
                  {daysInMonthView.map(day => {
                      const dateKey = format(day, 'yyyy-MM-dd');
                      const tasksForDay = tasksByDate.get(dateKey) || [];
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const isCurrentMonth = format(day, 'MM') === format(currentMonth, 'MM');

                      return (
                          <div
                              key={dateKey}
                              className={`relative p-2 rounded-lg cursor-pointer transition-all ${
                                  isCurrentMonth ? 'bg-white hover:bg-gray-100' : 'text-gray-400'
                              } ${isSelected ? 'bg-blue-100 border-blue-500 border' : ''} ${isToday(day) ? 'bg-gray-50 border border-gray-300' : ''}`}
                              onClick={() => setSelectedDate(day)}
                          >
                              <span className="text-sm font-medium">{format(day, 'd')}</span>
                              {tasksForDay.length > 0 && (
                                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                      {tasksForDay.slice(0, 3).map((task, index) => (
                                          <span
                                              key={index}
                                              className={`w-2 h-2 rounded-full ${task.status === 'Planned' ? 'bg-blue-500' : task.status === 'In Progress' ? 'bg-amber-500' : task.status === 'Done' ? 'bg-emerald-500' : 'bg-red-500'}`}
                                          ></span>
                                      ))}
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
            </div>
            
            {/* Selected Date Tasks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Tasks for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                </h3>
                <div className="text-sm text-gray-500 font-normal">
                  {selectedDateTasks.length} of {tasks.length} events
                </div>
              </div>
              
              <Select value={calendarFilter} onValueChange={handleFilterChange} disabled={isLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Statuses" />
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
                        <p><strong>Time:</strong> {task.scheduledTime ? format(new Date(task.scheduledTime), 'h:mm a') : 'N/A'}</p>
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
      
      {/* Calendar Legend moved to the bottom */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
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
    </>
  );
};

export default ReportCalendar;