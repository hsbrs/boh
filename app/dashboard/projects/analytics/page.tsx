'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, DocumentData, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeftIcon, TrendingUpIcon, CalendarIcon, MapPinIcon, EuroIcon, ClockIcon, BarChart3Icon } from 'lucide-react';

// Define the type for a project to provide type safety
type Project = {
  id: string;
  title: string;
  description: string;
  city: string;
  status: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  createdAt?: any;
  updatedAt?: any;
};

const ProjectAnalyticsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let projectsArray: Project[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as DocumentData),
      })) as Project[];
      setProjects(projectsArray);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading analytics...</div>
      </div>
    );
  }

  // Calculate analytics based on time range
  const getFilteredProjects = () => {
    if (timeRange === 'all') return projects;
    
    const now = new Date();
    const filterDate = new Date();
    
    switch (timeRange) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return projects;
    }
    
    return projects.filter(project => {
      if (!project.createdAt) return false;
      const projectDate = project.createdAt.toDate ? project.createdAt.toDate() : new Date(project.createdAt);
      return projectDate >= filterDate;
    });
  };

  const filteredProjects = getFilteredProjects();

  // Calculate comprehensive statistics
  const totalProjects = filteredProjects.length;
  const projectsByStatus = filteredProjects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const projectsByCity = filteredProjects.reduce((acc, project) => {
    acc[project.city] = (acc[project.city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const projectsByPriority = filteredProjects.reduce((acc, project) => {
    const priority = project.priority || 'Medium';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const startedProjects = projectsByStatus['Started'] || 0;
  const inProcessProjects = projectsByStatus['In Process'] || 0;
  const stoppedProjects = projectsByStatus['Stopped'] || 0;
  const completedProjects = projectsByStatus['Completed'] || 0;

  // Budget calculations
  const totalBudget = filteredProjects.reduce((sum, project) => sum + (project.budget || 0), 0);
  const averageBudget = totalProjects > 0 ? totalBudget / totalProjects : 0;
  const budgetByStatus = filteredProjects.reduce((acc, project) => {
    if (project.budget) {
      acc[project.status] = (acc[project.status] || 0) + project.budget;
    }
    return acc;
  }, {} as Record<string, number>);

  // Timeline analysis
  const projectsWithDates = filteredProjects.filter(p => p.startDate && p.endDate);
  const overdueProjects = projectsWithDates.filter(project => {
    const endDate = new Date(project.endDate!);
    const now = new Date();
    return endDate < now && project.status !== 'Completed';
  }).length;

  const upcomingDeadlines = projectsWithDates.filter(project => {
    const endDate = new Date(project.endDate!);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return endDate >= now && endDate <= weekFromNow && project.status !== 'Completed';
  }).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Started': return 'bg-blue-200 text-blue-800 border-blue-400';
      case 'In Process': return 'bg-yellow-200 text-yellow-800 border-yellow-400';
      case 'Stopped': return 'bg-red-200 text-red-800 border-red-400';
      case 'Completed': return 'bg-green-200 text-green-800 border-green-400';
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

  return (
    <div className="flex-1 p-8">
      <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/dashboard/projects" className="hover:text-blue-600 transition-colors">
          Projects
        </Link>
        <span>/</span>
        <span>Analytics</span>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <Link href="/dashboard/projects">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <h1 className="text-4xl font-bold text-gray-800">Project Analytics</h1>
      </div>

      {/* Time Range Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Time Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">
              Showing {filteredProjects.length} projects
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <BarChart3Icon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">Active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <EuroIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Combined budget</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Budget</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{averageBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground">Per project</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <ClockIcon className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalProjects > 0 ? ((completedProjects / totalProjects) * 100).toFixed(1) : '0'}%
            </div>
            <p className="text-xs text-muted-foreground">Projects completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(projectsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(status)}>
                      {status}
                    </Badge>
                    <span className="text-sm text-gray-600">{count} projects</span>
                  </div>
                  <span className="text-sm font-medium">
                    {totalProjects > 0 ? ((count / totalProjects) * 100).toFixed(1) : '0'}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Project Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(projectsByPriority).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(priority)}>
                      {priority}
                    </Badge>
                    <span className="text-sm text-gray-600">{count} projects</span>
                  </div>
                  <span className="text-sm font-medium">
                    {totalProjects > 0 ? ((count / totalProjects) * 100).toFixed(1) : '0'}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* City and Budget Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* City Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPinIcon className="h-5 w-5" />
              <span>Projects by City</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(projectsByCity).map(([city, count]) => (
                <div key={city} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{city}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{count}</Badge>
                    <span className="text-sm text-gray-600">
                      {totalProjects > 0 ? ((count / totalProjects) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Budget by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <EuroIcon className="h-5 w-5" />
              <span>Budget by Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(budgetByStatus).map(([status, budget]) => (
                <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Badge className={getStatusColor(status)}>
                    {status}
                  </Badge>
                  <span className="font-medium">€{budget.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline and Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Timeline Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="font-medium text-red-800">Overdue Projects</span>
                <Badge className="bg-red-200 text-red-800">{overdueProjects}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium text-yellow-800">Upcoming Deadlines</span>
                <Badge className="bg-yellow-200 text-yellow-800">{upcomingDeadlines}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-green-800">On Track</span>
                <Badge className="bg-green-200 text-green-800">
                  {totalProjects - overdueProjects - upcomingDeadlines}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Efficiency Score</h4>
                <p className="text-sm text-blue-600">
                  {totalProjects > 0 ? ((completedProjects / totalProjects) * 100).toFixed(1) : '0'}% of projects completed successfully
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Budget Utilization</h4>
                <p className="text-sm text-green-600">
                  Average project budget: €{averageBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-2">Geographic Distribution</h4>
                <p className="text-sm text-purple-600">
                  Projects spread across {Object.keys(projectsByCity).length} cities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectAnalyticsPage;
