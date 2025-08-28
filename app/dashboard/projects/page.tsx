'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, DocumentData, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircleIcon, FolderOpenIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';

// Define the type for a project to provide type safety
type Project = {
  id: string;
  title: string;
  description: string;
  city: string;
  status: string;
  createdAt?: any;
};

type ProjectType = 'overview' | 'list' | 'analytics';

const ProjectOverviewPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProjectType>('overview');

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
        <div className="text-xl font-semibold text-gray-700">Projekte werden geladen...</div>
      </div>
    );
  }

  // Calculate summary statistics
  const totalProjects = projects.length;
  const projectsByStatus = projects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const projectsByCity = projects.reduce((acc, project) => {
    acc[project.city] = (acc[project.city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const startedProjects = projectsByStatus['Started'] || 0;
  const inProcessProjects = projectsByStatus['In Process'] || 0;
  const stoppedProjects = projectsByStatus['Stopped'] || 0;
  const completedProjects = projectsByStatus['Completed'] || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Started': return 'bg-blue-200 text-blue-800 border-blue-400';
      case 'In Process': return 'bg-yellow-200 text-yellow-800 border-yellow-400';
      case 'Stopped': return 'bg-red-200 text-red-800 border-red-400';
      case 'Completed': return 'bg-green-200 text-green-800 border-green-400';
      default: return 'bg-gray-200 text-gray-800 border-gray-400';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtprojekte</CardTitle>
            <Badge variant="outline">{totalProjects}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">Alle aktiven Projekte</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Bearbeitung</CardTitle>
            <Badge className="bg-yellow-200 text-yellow-800">Aktiv</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{inProcessProjects}</div>
            <p className="text-xs text-muted-foreground">Currently being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Badge className="bg-green-200 text-green-800">Done</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedProjects}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stopped</CardTitle>
            <Badge className="bg-red-200 text-red-800">Paused</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stoppedProjects}</div>
            <p className="text-xs text-muted-foreground">Temporarily halted</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Project Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="font-medium">Started</span>
              <Badge className="bg-blue-200 text-blue-800">{startedProjects}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="font-medium">In Process</span>
              <Badge className="bg-yellow-200 text-yellow-800">{inProcessProjects}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="font-medium">Completed</span>
              <Badge className="bg-green-200 text-green-800">{completedProjects}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="font-medium">Stopped</span>
              <Badge className="bg-red-200 text-red-800">{stoppedProjects}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* City Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Projects by City</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(projectsByCity).map(([city, count]) => (
              <div key={city} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{city}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projects.slice(0, 5).map((project) => (
              <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{project.title}</h4>
                  <p className="text-sm text-gray-500">{project.city} • {project.description}</p>
                </div>
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProjectList = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">All Projects</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Project Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Manage all your projects from here. Create new projects, edit existing ones, and track their progress.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/dashboard/projects/create">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <PlusCircleIcon className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold mb-2">Create Project</h3>
                  <p className="text-sm text-gray-600">Start a new project</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/dashboard/projects/manage">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <FolderOpenIcon className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="font-semibold mb-2">Manage Projects</h3>
                  <p className="text-sm text-gray-600">Edit and update projects</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/dashboard/projects/view">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <CheckCircleIcon className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-semibold mb-2">View Projects</h3>
                  <p className="text-sm text-gray-600">Browse and view all projects</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );

    const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Project Analytics</h2>
        <Link href="/dashboard/projects/analytics">
          <Button>
            <CheckCircleIcon className="mr-2 h-4 w-4" />
            View Full Analytics
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Analytics Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Get comprehensive insights into your project performance, budget allocation, and timeline metrics.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Project Status</h4>
              <p className="text-sm text-blue-600">
                {totalProjects} total projects • {completedProjects} completed
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Geographic Distribution</h4>
              <p className="text-sm text-green-600">
                Projects across {Object.keys(projectsByCity).length} cities
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">Performance</h4>
              <p className="text-sm text-purple-600">
                {totalProjects > 0 ? ((completedProjects / totalProjects) * 100).toFixed(1) : '0'}% completion rate
              </p>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Link href="/dashboard/projects/analytics">
              <Button variant="outline" size="lg">
                <CheckCircleIcon className="mr-2 h-5 w-5" />
                Open Full Analytics Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    );

  return (
    <div className="flex-1 p-8">
          <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
        <span>Projekte</span>
          </div>
      
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-gray-800">Projektmanagement</h1>
        <Link href="/dashboard/projects/create">
          <Button>
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
            Neues Projekt erstellen
                </Button>
        </Link>
          </div>
          
      {/* Project Navigation */}
      <div className="flex space-x-2 mb-6">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('overview')}
        >
          Übersicht
        </Button>
                                    <Button
          variant={activeTab === 'list' ? 'default' : 'outline'}
          onClick={() => setActiveTab('list')}
                                    >
          Projektliste
                                    </Button>
                                    <Button
          variant={activeTab === 'analytics' ? 'default' : 'outline'}
          onClick={() => setActiveTab('analytics')}
                                    >
          Analysen
                                    </Button>
                                  </div>

      {/* Project Content */}
      <div className="h-[calc(100vh-200px)]">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'list' && renderProjectList()}
        {activeTab === 'analytics' && renderAnalytics()}
        </div>
      </div>
  );
};

export default ProjectOverviewPage;