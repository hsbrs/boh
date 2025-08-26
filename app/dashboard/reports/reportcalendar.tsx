'use client';

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays, Clock } from 'lucide-react';

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
  const [calendarRef, setCalendarRef] = useState<any>(null);

  // Convert tasks to calendar events
  const calendarEvents = tasks.map(task => ({
    id: task.id,
    title: task.summary || 'Untitled Task',
    start: task.scheduledTime ? new Date(task.scheduledTime) : new Date(),
    extendedProps: { ...task },
  }));

  // Filter events based on search and status
  const filteredEvents = calendarEvents.filter(ev => {
    const matchesSearch = ev.title.toLowerCase().includes(calendarSearch.toLowerCase());
    const matchesFilter = calendarFilter === 'All' || ev.extendedProps.status === calendarFilter;
    return matchesSearch && matchesFilter;
  });

  // Handle search input with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    setCalendarSearch(e.target.value);
    // Simple debouncing
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
            {/* Priority Legend */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">Priority:</span>
              <div className="flex gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-200 border border-red-300"></div>
                  <span className="text-xs text-gray-600">High</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-orange-200 border border-orange-300"></div>
                  <span className="text-xs text-gray-600">Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-200 border border-green-300"></div>
                  <span className="text-xs text-gray-600">Low</span>
                </div>
              </div>
            </div>
            
            {/* Status Legend */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">Status:</span>
              <div className="flex gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-200 border border-blue-300"></div>
                  <span className="text-xs text-gray-600">Planned</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-amber-200 border border-amber-300"></div>
                  <span className="text-xs text-gray-600">In Progress</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-200 border border-emerald-300"></div>
                  <span className="text-xs text-gray-600">Done</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-200 border border-red-300"></div>
                  <span className="text-xs text-gray-600">Delayed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div className="h-full">
          <FullCalendar
            ref={setCalendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={filteredEvents}
            eventClick={(info) => {
              const task = tasks.find(t => t.id === info.event.id);
              if (task) setSelectedTask(task);
            }}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            height="auto"
            selectable
            dayMaxEvents={false}
            weekends
            nowIndicator
            eventDisplay="block"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: 'short'
            }}
            eventMinHeight={20}
            eventShortHeight={20}
            dayHeaderFormat={{
              weekday: 'short',
              day: 'numeric'
            }}
            titleFormat={{
              month: 'long',
              year: 'numeric'
            }}
            buttonText={{
              today: 'Today',
              month: 'Month',
              week: 'Week',
              day: 'Day'
            }}
            eventClassNames="custom-event"
            dayCellClassNames="custom-day-cell"
            moreLinkClick="popover"
            eventDidMount={(info) => {
              // Add custom styling for different event types
              const task = info.event.extendedProps as Task;
              if (task.status === 'Done') {
                info.el.classList.add('event-completed');
              } else if (task.status === 'Delayed') {
                info.el.classList.add('event-delayed');
              }
            }}
            eventContent={(arg) => {
              const task = arg.event.extendedProps as Task;
              const priority = task.priority || '';
              const status = task.status || '';
              
              // Enhanced color scheme based on priority and status
              const getEventColors = () => {
                let bgColor = 'bg-blue-100';
                let borderColor = 'border-blue-300';
                let textColor = 'text-blue-800';
                
                // Priority-based colors
                if (priority === 'High') {
                  bgColor = 'bg-red-100';
                  borderColor = 'border-red-300';
                  textColor = 'text-red-800';
                } else if (priority === 'Medium') {
                  bgColor = 'bg-orange-100';
                  borderColor = 'border-orange-300';
                  textColor = 'text-orange-800';
                } else if (priority === 'Low') {
                  bgColor = 'bg-green-100';
                  borderColor = 'border-green-300';
                  textColor = 'text-green-800';
                }
                
                // Status-based accent colors
                if (status === 'Done') {
                  bgColor = 'bg-emerald-100';
                  borderColor = 'border-emerald-300';
                  textColor = 'text-emerald-800';
                } else if (status === 'In Progress') {
                  bgColor = 'bg-amber-100';
                  borderColor = 'border-amber-300';
                  textColor = 'text-amber-800';
                } else if (status === 'Delayed') {
                  bgColor = 'bg-red-100';
                  borderColor = 'border-red-300';
                  textColor = 'text-red-800';
                }
                
                return { bgColor, borderColor, textColor };
              };
              
              const { bgColor, borderColor, textColor } = getEventColors();
              
              return (
                <div className={`w-full h-full p-1 rounded border ${bgColor} ${borderColor} ${textColor} hover:shadow-md transition-all duration-200 cursor-pointer`}>
                  <div className="flex flex-col h-full">
                    {/* Compact Task Info */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-xs leading-tight line-clamp-1 flex-1 mr-1">
                        {arg.event.title}
                      </div>
                      {/* Compact Priority Badge */}
                      {priority && (
                        <div className={`px-1 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                          priority === 'High' ? 'bg-red-200 text-red-800' :
                          priority === 'Medium' ? 'bg-orange-200 text-orange-800' :
                          'bg-green-200 text-green-800'
                        }`}>
                          {priority.charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    {/* Compact Status and Assignee */}
                    <div className="flex items-center justify-between text-xs">
                      {status && (
                        <div className={`px-1 py-0.5 rounded text-xs font-medium ${
                          status === 'Done' ? 'bg-emerald-200 text-emerald-800' :
                          status === 'In Progress' ? 'bg-amber-200 text-amber-800' :
                          status === 'Delayed' ? 'bg-red-200 text-red-800' :
                          status === 'Planned' ? 'bg-blue-200 text-blue-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {status.charAt(0)}
                        </div>
                      )}
                      {task.assignee && (
                        <div className="text-xs opacity-80 truncate ml-1">
                          {task.assignee}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </div>
      </CardContent>

      {/* Dialog for event details */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-lg p-0 border-none bg-transparent">
          {selectedTask && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {selectedTask.summary}
                  <div className="flex gap-2">
                    {renderBadge(selectedTask.priority || '', 'priority')}
                    {renderBadge(selectedTask.status || '', 'status')}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p><strong>Assignee:</strong> {selectedTask.assignee}</p>
                <p><strong>Scheduled:</strong> {selectedTask.scheduledTime}</p>
                <p><strong>Service Type:</strong> {selectedTask.serviceType}</p>
                <p><strong>Description:</strong> {selectedTask.description}</p>
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ReportCalendar;
