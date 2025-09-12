'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeftIcon, SaveIcon, UsersIcon, MapPinIcon } from 'lucide-react';

interface UserData {
  uid: string;
  fullName?: string;
  role?: string;
  email?: string;
  isApproved?: boolean;
}

interface Project {
  id: string;
  title: string;
  description: string;
  city: string;
  status: string;
  tp?: number;
  udp?: number;
  projectManager?: {
    uid: string;
    name: string;
    role: string;
  };
}

const CreateWorkOrderPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: string; } | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [employees, setEmployees] = useState<UserData[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  // Form state
  const [selectedProject, setSelectedProject] = useState('');
  const [workOrderTitle, setWorkOrderTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [scheduleDate, setScheduleDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimateDuration, setEstimateDuration] = useState('');
  const [googleMapUrl, setGoogleMapUrl] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const priorities = ["Low", "Medium", "High"];

  // Auto-generate work order title when project changes
  useEffect(() => {
    if (selectedProject) {
      const selectedProjectData = projects.find(p => p.id === selectedProject);
      if (selectedProjectData) {
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const generatedTitle = `${selectedProjectData.title} - WO-${timestamp}`;
        setWorkOrderTitle(generatedTitle);
      }
    } else {
      setWorkOrderTitle('');
    }
  }, [selectedProject, projects]);

  // Fetch current user, employees, and projects
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get current user data
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.data() as UserData;
          
          setCurrentUser({
            ...userData,
            uid: user.uid
          });
          
          // Check if user has permission to create work orders
          if (!userData || !['pm', 'manager', 'admin'].includes(userData.role || '')) {
            showNotification('Sie haben keine Berechtigung, Arbeitsaufträge zu erstellen.', 'error');
            router.push('/dashboard');
            return;
          }

          // Fetch all employees
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const employeesData = usersSnapshot.docs
            .map(doc => ({
              uid: doc.id,
              ...doc.data()
            } as UserData))
            .filter(employee => employee.isApproved !== false && employee.role !== 'admin') // Exclude unapproved users and admins
            .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
          
          setEmployees(employeesData);

          // Fetch all projects
          const projectsQuery = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
          const projectsSnapshot = await getDocs(projectsQuery);
          const projectsData = projectsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Project[];
          
          setProjects(projectsData);
        } catch (error) {
          console.error('Error fetching data:', error);
          showNotification('Fehler beim Laden der Daten.', 'error');
        }
      } else {
        router.push('/login');
      }
      setLoadingUser(false);
    });

    return () => unsubscribe();
  }, [router]);

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleEstimateDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value);
    
    // Allow empty input or numbers between 1 and 8
    if (value === '' || (numValue >= 1 && numValue <= 8)) {
      setEstimateDuration(value);
    }
  };

  const handleAssigneeSelection = (assigneeId: string, checked: boolean) => {
    if (checked) {
      setSelectedAssignees(prev => [...prev, assigneeId]);
    } else {
      setSelectedAssignees(prev => prev.filter(id => id !== assigneeId));
    }
  };

  const getSelectedAssigneeNames = () => {
    return selectedAssignees.map(assigneeId => {
      const assignee = employees.find(emp => emp.uid === assigneeId);
      return assignee?.fullName || assignee?.email || 'Unknown';
    });
  };

  const generateWorkOrderId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `WO-${timestamp}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!selectedProject) {
        showNotification('Bitte wählen Sie ein Projekt aus.', 'error');
        setLoading(false);
        return;
      }

      if (selectedAssignees.length === 0) {
        showNotification('Bitte wählen Sie mindestens einen Bearbeiter aus.', 'error');
        setLoading(false);
        return;
      }

      if (!description.trim()) {
        showNotification('Bitte geben Sie eine Beschreibung ein.', 'error');
        setLoading(false);
        return;
      }

      if (!scheduleDate) {
        showNotification('Bitte wählen Sie ein Startdatum aus.', 'error');
        setLoading(false);
        return;
      }

      const estimateNum = parseInt(estimateDuration);
      if (!estimateNum || estimateNum < 1 || estimateNum > 8) {
        showNotification('Die geschätzte Dauer muss zwischen 1 und 8 Stunden liegen.', 'error');
        setLoading(false);
        return;
      }

      // Get selected project details
      const selectedProjectData = projects.find(p => p.id === selectedProject);
      
      // Get selected assignee details
      const selectedAssigneeDetails = selectedAssignees.map(assigneeId => {
        const assignee = employees.find(emp => emp.uid === assigneeId);
        return {
          uid: assigneeId,
          name: assignee?.fullName || assignee?.email || 'Unknown',
          role: assignee?.role || 'employee'
        };
      });

      // Create the work order object
      const workOrderId = generateWorkOrderId();
      const workOrderData = {
        workOrderId,
        title: workOrderTitle.trim(),
        projectId: selectedProject,
        projectTitle: selectedProjectData?.title || '',
        projectCity: selectedProjectData?.city || '',
        description: description.trim(),
        priority,
        status: 'Pending',
        assignees: selectedAssigneeDetails,
        scheduleDate: scheduleDate || null,
        dueDate: dueDate || null,
        estimateDuration: estimateNum,
        actualDuration: null, // Will be filled when work is completed
        googleMapUrl: googleMapUrl.trim() || null,
        additionalNotes: additionalNotes.trim() || null,
        createdBy: {
          uid: currentUser?.uid,
          name: currentUser?.fullName || currentUser?.email || 'Unknown',
          role: currentUser?.role
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        // Future enhancement fields (can be null for now)
        attachments: [],
        comments: [],
        dependencies: [],
        costTracking: {
          laborCost: null,
          materialCost: null,
          totalCost: null
        },
        timeTracking: {
          startedAt: null,
          completedAt: null,
          pausedTime: 0
        },
        approvalWorkflow: {
          requiresApproval: false,
          approvedBy: null,
          approvedAt: null
        }
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'workOrders'), workOrderData);
      
      showNotification('Arbeitsauftrag erfolgreich erstellt!', 'success');
      
      // Reset form
      setSelectedProject('');
      setWorkOrderTitle('');
      setDescription('');
      setPriority('Medium');
      setScheduleDate('');
      setDueDate('');
      setEstimateDuration('');
      setGoogleMapUrl('');
      setAdditionalNotes('');
      setSelectedAssignees([]);

      // Redirect to work orders overview after a short delay
      setTimeout(() => {
        router.push('/dashboard/work-orders');
      }, 1500);

    } catch (error) {
      console.error("Error creating work order: ", error);
      showNotification('Fehler beim Erstellen des Arbeitsauftrags. Bitte versuchen Sie es erneut.', 'error');
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

  // Show loading while checking user permissions
  if (loadingUser) {
    return (
      <div className="flex-1 p-8">
        <div className="text-center text-gray-500">Überprüfe Berechtigungen...</div>
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
        <Link href="/dashboard/work-orders" className="hover:text-blue-600 transition-colors">
          Work Orders
        </Link>
        <span>/</span>
        <span>Create Work Order</span>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <Link href="/dashboard/work-orders">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Work Orders
          </Button>
        </Link>
        <h1 className="text-4xl font-bold text-gray-800">Create New Work Order</h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SaveIcon className="h-6 w-6 text-blue-600" />
              <span>Work Order Information</span>
            </CardTitle>
            <CardDescription>
              Fill out the form below to create a new work order. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Selection */}
              <div className="space-y-2">
                <Label htmlFor="project">Project *</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title} ({project.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Auto-generated Work Order Title */}
              <div className="space-y-2">
                <Label htmlFor="workOrderTitle">Work Order Title (Auto-generated)</Label>
                <Input
                  id="workOrderTitle"
                  value={workOrderTitle}
                  readOnly
                  placeholder="Title will be generated automatically"
                  className="bg-gray-50"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the work to be done in detail"
                  rows={4}
                  required
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
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

              {/* Schedule and Due Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="scheduleDate">Schedule Date *</Label>
                  <Input
                    id="scheduleDate"
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Estimate Duration */}
              <div className="space-y-2">
                <Label htmlFor="estimateDuration">Estimate Duration (hours) *</Label>
                <Input
                  id="estimateDuration"
                  type="number"
                  value={estimateDuration}
                  onChange={handleEstimateDurationChange}
                  placeholder="1-8 hours"
                  min="1"
                  max="8"
                  required
                />
                <p className="text-sm text-gray-500">Estimated time in hours (1-8 hours maximum)</p>
              </div>

              {/* Google Map URL */}
              <div className="space-y-2">
                <Label htmlFor="googleMapUrl" className="flex items-center space-x-2">
                  <MapPinIcon className="h-4 w-4" />
                  <span>Google Map URL</span>
                </Label>
                <Input
                  id="googleMapUrl"
                  type="url"
                  value={googleMapUrl}
                  onChange={(e) => setGoogleMapUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="additionalNotes">Additional Notes</Label>
                <Textarea
                  id="additionalNotes"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Any additional instructions or notes"
                  rows={3}
                />
              </div>

              {/* Assignee Selection */}
              <div className="space-y-4">
                <Label className="flex items-center space-x-2">
                  <UsersIcon className="h-4 w-4" />
                  <span>Assign Team Members *</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto border rounded-md p-4">
                  {employees.map((employee) => (
                    <div key={employee.uid} className="flex items-center space-x-2">
                      <Checkbox
                        id={`assignee-${employee.uid}`}
                        checked={selectedAssignees.includes(employee.uid)}
                        onCheckedChange={(checked) => handleAssigneeSelection(employee.uid, checked as boolean)}
                      />
                      <Label 
                        htmlFor={`assignee-${employee.uid}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {employee.fullName || employee.email} 
                        <Badge variant="outline" className="ml-2 text-xs">
                          {employee.role}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedAssignees.length > 0 && (
                  <p className="text-sm text-gray-600">
                    {selectedAssignees.length} team member{selectedAssignees.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Creator Info */}
              <div className="space-y-2">
                <Label htmlFor="createdBy">Created By</Label>
                <Input
                  id="createdBy"
                  value={currentUser?.fullName || currentUser?.email || 'Loading...'}
                  readOnly
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500">This field is automatically filled based on your login</p>
              </div>

              {/* Preview Card */}
              {workOrderTitle && selectedProject && (
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Work Order Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Title:</span>
                        <span>{workOrderTitle}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Project:</span>
                        <span>{projects.find(p => p.id === selectedProject)?.title}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Priority:</span>
                        <Badge className={getPriorityColor(priority)}>
                          {priority}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Estimated Duration:</span>
                        <span>{estimateDuration} hour{estimateDuration !== '1' ? 's' : ''}</span>
                      </div>
                      {selectedAssignees.length > 0 && (
                        <div className="flex items-start justify-between">
                          <span className="font-medium">Assignees:</span>
                          <div className="flex flex-wrap gap-1 max-w-xs justify-end">
                            {getSelectedAssigneeNames().slice(0, 2).map((name, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {name}
                              </Badge>
                            ))}
                            {getSelectedAssigneeNames().length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{getSelectedAssigneeNames().length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Status:</span>
                        <Badge className="bg-blue-200 text-blue-800">
                          Pending
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6">
                <Link href="/dashboard/work-orders">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading || !workOrderTitle}>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  {loading ? 'Creating...' : 'Create Work Order'}
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

export default CreateWorkOrderPage;
