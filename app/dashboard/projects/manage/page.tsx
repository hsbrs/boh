'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, DocumentData, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PencilIcon, Trash2Icon, PlusCircleIcon, Circle, CircleDashed, CircleCheck, ArrowLeftIcon, SearchIcon } from 'lucide-react';

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

const cities = ["Herzogenrath", "Lippstadt", "Emmerich"];
const statuses = ["Started", "In Process", "Stopped", "Completed"];
const priorities = ["Low", "Medium", "High"];

const ManageProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: string; } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

  // State for the edit dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState(cities[0]);
  const [status, setStatus] = useState(statuses[0]);
  const [priority, setPriority] = useState(priorities[1]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

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
      showNotification('Error fetching projects.', 'error');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter projects based on search and filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesCity = cityFilter === 'all' || project.city === cityFilter;
    
    return matchesSearch && matchesStatus && matchesCity;
  });

  const getStatusColor = (projectStatus: string) => {
    switch (projectStatus) {
      case 'Started': return 'bg-blue-200 text-blue-800 border-blue-400';
      case 'In Process': return 'bg-yellow-200 text-yellow-800 border-yellow-400';
      case 'Stopped': return 'bg-red-200 text-red-800 border-red-400';
      case 'Completed': return 'bg-green-200 text-green-800 border-green-400';
      default: return 'bg-gray-200 text-gray-800 border-gray-400';
    }
  };

  const getStatusIcon = (projectStatus: string) => {
    switch (projectStatus) {
      case 'Started': return <Circle className="h-4 w-4" />;
      case 'In Process': return <CircleDashed className="h-4 w-4" />;
      case 'Stopped': return <Circle className="h-4 w-4 text-red-500" />;
      case 'Completed': return <CircleCheck className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
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

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setCurrentProject(project);
      setTitle(project.title);
      setDescription(project.description);
      setCity(project.city);
      setStatus(project.status);
      setPriority(project.priority || 'Medium');
      setStartDate(project.startDate || '');
      setEndDate(project.endDate || '');
      setBudget(project.budget?.toString() || '');
    } else {
      setCurrentProject(null);
      setTitle('');
      setDescription('');
      setCity(cities[0]);
      setStatus(statuses[0]);
      setPriority(priorities[1]);
      setStartDate('');
      setEndDate('');
      setBudget('');
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (currentProject) {
        // Update an existing project
        const projectDocRef = doc(db, 'projects', currentProject.id);
        await updateDoc(projectDocRef, {
          title: title.trim(),
          description: description.trim(),
          city,
          status,
          priority,
          startDate: startDate || null,
          endDate: endDate || null,
          budget: budget ? parseFloat(budget) : null,
          updatedAt: new Date(),
        });
        showNotification('Project updated successfully!', 'success');
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error updating project: ", error);
      showNotification('Error updating project.', 'error');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      const projectDocRef = doc(db, 'projects', projectId);
      try {
        await deleteDoc(projectDocRef);
        showNotification('Project deleted successfully!', 'success');
      } catch (error) {
        console.error("Error deleting project: ", error);
        showNotification('Error deleting project.', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading projects...</div>
      </div>
    );
  }

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
        <span>Manage Projects</span>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <Link href="/dashboard/projects">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <h1 className="text-4xl font-bold text-gray-800">Manage Projects</h1>
        <Link href="/dashboard/projects/create">
          <Button>
            <PlusCircleIcon className="mr-2 h-4 w-4" />
            Create New Project
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Projects</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by title, description, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="statusFilter">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityFilter">Filter by City</Label>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Projects ({filteredProjects.length})</span>
            <div className="text-sm text-gray-500">
              Showing {filteredProjects.length} of {projects.length} projects
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || statusFilter !== 'all' || cityFilter !== 'all' 
                ? 'No projects match your current filters.' 
                : 'No projects found.'}
            </div>
          ) : (
            <ScrollArea className="h-[600px] w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map(project => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.title}</TableCell>
                      <TableCell className="text-gray-600 max-w-xs truncate">
                        {project.description}
                      </TableCell>
                      <TableCell>{project.city}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusIcon(project.status)} {project.status}
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
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(project)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update the project information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
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
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority level" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="budget">Budget (€)</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Enter project budget"
                min="0"
                step="0.01"
              />
            </div>

            <DialogFooter>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white transition-all duration-300 ease-in-out`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default ManageProjectsPage;
