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
import { ArrowLeftIcon, SearchIcon, EyeIcon, UsersIcon } from 'lucide-react';

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
  tp?: number;
  udp?: number;
  projectManager?: {
    uid: string;
    name: string;
    role: string;
  };
  employees?: Array<{
    uid: string;
    name: string;
    role: string;
  }>;
  createdAt?: any;
  updatedAt?: any;
};

const ViewProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

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

  // Filter projects based on search term and filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.projectManager?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.tp?.toString() || '').includes(searchTerm) ||
      (project.udp?.toString() || '').includes(searchTerm) ||
      (project.employees?.some(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase())) || false);
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesCity = cityFilter === 'all' || project.city === cityFilter;
    
    return matchesSearch && matchesStatus && matchesCity;
  });

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Projekte werden geladen...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/dashboard/projects" className="hover:text-blue-600 transition-colors">
          Projects
        </Link>
        <span>/</span>
        <span>View Projects</span>
      </div>

      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/dashboard/projects">
          <ArrowLeftIcon className="h-6 w-6 text-gray-600 hover:text-blue-600 transition-colors" />
        </Link>
        <div>
          <h1 className="text-4xl font-bold text-gray-800">View Projects</h1>
          <p className="text-gray-600 mt-1">Browse and view all projects (read-only access)</p>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <EyeIcon className="h-5 w-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by title, description, city, TP, UDP, manager, or employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Nach Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="Started">Started</SelectItem>
                <SelectItem value="In Process">In Process</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Stopped">Stopped</SelectItem>
              </SelectContent>
            </Select>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Nach Stadt filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Städte</SelectItem>
                {Array.from(new Set(projects.map(p => p.city))).map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <EyeIcon className="h-5 w-5 mr-2" />
            Projekte ({filteredProjects.length})
          </CardTitle>
          <p className="text-sm text-gray-600">
            Zeige {filteredProjects.length} von {projects.length} Projekten
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[700px] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Title</TableHead>
                  <TableHead>TP</TableHead>
                  <TableHead>UDP</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Project Manager</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map(project => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.title}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {project.tp?.toString().padStart(2, '0') || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {project.udp?.toString().padStart(2, '0') || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>{project.city}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center space-x-2">
                        <span>{project.projectManager?.name || 'N/A'}</span>
                        {project.projectManager?.role && (
                          <Badge variant="secondary" className="text-xs">
                            {project.projectManager.role}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {project.employees && project.employees.length > 0 ? (
                          <>
                            {project.employees.slice(0, 2).map((employee, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {employee.name}
                              </Badge>
                            ))}
                            {project.employees.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{project.employees.length - 2} more
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm">No employees assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(project.priority || 'Medium')}>
                        {project.priority || 'Medium'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {project.budget ? `€${project.budget.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewProjectsPage;