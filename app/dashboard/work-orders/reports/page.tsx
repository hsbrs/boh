'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, DocumentData, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

// Import shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, SearchIcon, EyeIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon, XCircleIcon } from 'lucide-react';

// Define the type for a work order to provide type safety
interface WorkOrder {
  id: string;
  workOrderId: string;
  title: string;
  projectId: string;
  projectTitle: string;
  projectCity: string;
  description: string;
  priority: string;
  status: string;
  assignees: Array<{
    uid: string;
    name: string;
    role: string;
  }>;
  scheduleDate: string;
  dueDate: string;
  estimateDuration: number;
  actualDuration?: number;
  googleMapUrl?: string;
  createdBy: {
    uid: string;
    name: string;
    role: string;
  };
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
}

const WorkOrdersReportsPage = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  useEffect(() => {
    const q = query(collection(db, 'workOrders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let workOrdersArray: WorkOrder[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as DocumentData),
      })) as WorkOrder[];
      setWorkOrders(workOrdersArray);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching work orders: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Lade Arbeitsaufträge...</div>
      </div>
    );
  }

  // Filter work orders based on search and filters
  const filteredWorkOrders = workOrders.filter(workOrder => {
    const matchesSearch = workOrder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workOrder.workOrderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workOrder.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workOrder.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || workOrder.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || workOrder.priority === priorityFilter;
    const matchesProject = projectFilter === 'all' || workOrder.projectId === projectFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  // Get unique projects for filter dropdown
  const uniqueProjects = Array.from(new Set(workOrders.map(wo => wo.projectId)))
    .map(projectId => {
      const workOrder = workOrders.find(wo => wo.projectId === projectId);
      return {
        id: projectId,
        title: workOrder?.projectTitle || 'Unknown Project'
      };
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-200 text-green-800 border-green-400';
      case 'In Progress': return 'bg-blue-200 text-blue-800 border-blue-400';
      case 'Pending': return 'bg-yellow-200 text-yellow-800 border-yellow-400';
      case 'Cancelled': return 'bg-red-200 text-red-800 border-red-400';
      default: return 'bg-gray-200 text-gray-800 border-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-200 text-red-800 border-red-400';
      case 'Medium': return 'bg-yellow-200 text-yellow-800 border-yellow-400';
      case 'Low': return 'bg-green-200 text-green-800 border-green-400';
      default: return 'bg-gray-200 text-gray-800 border-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'In Progress': return <ClockIcon className="h-4 w-4" />;
      case 'Pending': return <AlertCircleIcon className="h-4 w-4" />;
      case 'Cancelled': return <XCircleIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (hours: number) => {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  };

  // Calculate summary statistics
  const totalWorkOrders = workOrders.length;
  const completedWorkOrders = workOrders.filter(wo => wo.status === 'Completed').length;
  const inProgressWorkOrders = workOrders.filter(wo => wo.status === 'In Progress').length;
  const pendingWorkOrders = workOrders.filter(wo => wo.status === 'Pending').length;

  return (
    <div className="flex-1 p-8">
      <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/dashboard/work-orders" className="hover:text-blue-600 transition-colors">
          Work Orders
        </Link>
        <span>/</span>
        <span>Reports</span>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800">Work Order Reports</h1>
        <Link href="/dashboard/work-orders">
          <Button variant="outline">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Work Orders
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Work Orders</CardTitle>
            <Badge variant="outline">{totalWorkOrders}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkOrders}</div>
            <p className="text-xs text-muted-foreground">All work orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Badge className="bg-green-200 text-green-800">Done</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedWorkOrders}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Badge className="bg-blue-200 text-blue-800">Active</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressWorkOrders}</div>
            <p className="text-xs text-muted-foreground">Currently being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Badge className="bg-yellow-200 text-yellow-800">Waiting</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingWorkOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search work orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {uniqueProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Work Orders ({filteredWorkOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Order ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Assignees</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Schedule Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkOrders.map((workOrder) => (
                  <TableRow key={workOrder.id}>
                    <TableCell className="font-medium">
                      {workOrder.workOrderId}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{workOrder.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {workOrder.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{workOrder.projectTitle}</div>
                        <div className="text-sm text-muted-foreground">{workOrder.projectCity}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {workOrder.assignees.slice(0, 2).map((assignee, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {assignee.name}
                          </Badge>
                        ))}
                        {workOrder.assignees.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{workOrder.assignees.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(workOrder.priority)}>
                        {workOrder.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(workOrder.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(workOrder.status)}
                          {workOrder.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{formatDuration(workOrder.estimateDuration)}</div>
                        {workOrder.actualDuration && (
                          <div className="text-sm text-muted-foreground">
                            Actual: {formatDuration(workOrder.actualDuration)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(workOrder.scheduleDate)}
                      </div>
                      {workOrder.dueDate && (
                        <div className="text-xs text-muted-foreground">
                          Due: {formatDate(workOrder.dueDate)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/work-orders/${workOrder.id}`}>
                        <Button variant="outline" size="sm">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          {filteredWorkOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No work orders found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkOrdersReportsPage;
