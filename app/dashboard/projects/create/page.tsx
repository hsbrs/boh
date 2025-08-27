'use client';

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftIcon, PlusCircleIcon, SaveIcon } from 'lucide-react';

const cities = ["Herzogenrath", "Lippstadt", "Emmerich"];
const statuses = ["Started", "In Process", "Stopped", "Completed"];

const CreateProjectPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: string; } | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState(cities[0]);
  const [status, setStatus] = useState(statuses[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [priority, setPriority] = useState('Medium');

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create the project object
      const projectData = {
        title: title.trim(),
        description: description.trim(),
        city,
        status,
        startDate: startDate || null,
        endDate: endDate || null,
        budget: budget ? parseFloat(budget) : null,
        priority,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'projects'), projectData);
      
      showNotification('Project created successfully!', 'success');
      
      // Reset form
      setTitle('');
      setDescription('');
      setCity(cities[0]);
      setStatus(statuses[0]);
      setStartDate('');
      setEndDate('');
      setBudget('');
      setPriority('Medium');

      // Redirect to projects overview after a short delay
      setTimeout(() => {
        router.push('/dashboard/projects');
      }, 1500);

    } catch (error) {
      console.error("Error creating project: ", error);
      showNotification('Error creating project. Please try again.', 'error');
    } finally {
      setLoading(false);
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
        <span>Create Project</span>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <Link href="/dashboard/projects">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <h1 className="text-4xl font-bold text-gray-800">Create New Project</h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PlusCircleIcon className="h-6 w-6 text-blue-600" />
              <span>Project Information</span>
            </CardTitle>
            <CardDescription>
              Fill out the form below to create a new project. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter project title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
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

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the project in detail"
                  rows={4}
                  required
                />
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-2">
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

              {/* Preview Card */}
              {title && (
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Project Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Title:</span>
                        <span>{title}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">City:</span>
                        <span>{city}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Status:</span>
                        <Badge className={status === 'Started' ? 'bg-blue-200 text-blue-800' : 
                                         status === 'In Process' ? 'bg-yellow-200 text-yellow-800' :
                                         status === 'Stopped' ? 'bg-red-200 text-red-800' :
                                         'bg-green-200 text-green-800'}>
                          {status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Priority:</span>
                        <Badge className={getPriorityColor(priority)}>
                          {priority}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6">
                <Link href="/dashboard/projects">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  {loading ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white transition-all duration-300 ease-in-out`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default CreateProjectPage;
