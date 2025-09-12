'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc, getDocs } from 'firebase/firestore';
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
import { ArrowLeftIcon, PlusCircleIcon, SaveIcon, UsersIcon } from 'lucide-react';

const cities = ["Herzogenrath", "Lippstadt", "Emmerich"];
const statuses = ["Started", "In Process", "Stopped", "Completed"];

interface UserData {
  uid: string;
  fullName?: string;
  role?: string;
  email?: string;
  isApproved?: boolean;
}

const CreateProjectPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: string; } | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [employees, setEmployees] = useState<UserData[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [tp, setTp] = useState('');
  const [udp, setUdp] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState(cities[0]);
  const [status, setStatus] = useState(statuses[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [priority, setPriority] = useState('Medium');

  // Auto-generate title when TP, UDP, or City changes
  useEffect(() => {
    if (tp && udp && city) {
      const tpFormatted = tp.padStart(2, '0');
      const udpFormatted = udp.padStart(2, '0');
      const generatedTitle = `${city}, TP ${tpFormatted}, UDP ${udpFormatted}`;
      setTitle(generatedTitle);
    } else {
      setTitle('');
    }
  }, [tp, udp, city]);

  // Fetch current user and employees
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get current user data
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.data() as UserData;
          
          setCurrentUser({
            uid: user.uid,
            ...userData
          });

          // Check if user has permission to create projects
          if (!userData || !['pm', 'manager', 'admin'].includes(userData.role || '')) {
            showNotification('Sie haben keine Berechtigung, Projekte zu erstellen.', 'error');
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
        } catch (error) {
          console.error('Error fetching user data:', error);
          showNotification('Fehler beim Laden der Benutzerdaten.', 'error');
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

  const handleTpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value);
    
    // Allow empty input or numbers between 1 and 1000
    if (value === '' || (numValue >= 1 && numValue <= 1000)) {
      setTp(value);
    }
  };

  const handleUdpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value);
    
    // Allow empty input or numbers between 1 and 1000
    if (value === '' || (numValue >= 1 && numValue <= 1000)) {
      setUdp(value);
    }
  };

  const handleEmployeeSelection = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    }
  };

  const getSelectedEmployeeNames = () => {
    return selectedEmployees.map(employeeId => {
      const employee = employees.find(emp => emp.uid === employeeId);
      return employee?.fullName || employee?.email || 'Unknown';
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate TP and UDP
      const tpNum = parseInt(tp);
      const udpNum = parseInt(udp);
      
      if (!tpNum || !udpNum || tpNum < 1 || tpNum > 1000 || udpNum < 1 || udpNum > 1000) {
        showNotification('TP and UDP must be numbers between 1 and 1000.', 'error');
        setLoading(false);
        return;
      }

      // Get selected employee details
      const selectedEmployeeDetails = selectedEmployees.map(employeeId => {
        const employee = employees.find(emp => emp.uid === employeeId);
        return {
          uid: employeeId,
          name: employee?.fullName || employee?.email || 'Unknown',
          role: employee?.role || 'employee'
        };
      });

      // Create the project object
      const projectData = {
        title: title.trim(),
        tp: tpNum,
        udp: udpNum,
        description: description.trim(),
        city,
        status,
        startDate: startDate || null,
        endDate: endDate || null,
        budget: budget ? parseFloat(budget) : null,
        priority,
        projectManager: {
          uid: currentUser?.uid,
          name: currentUser?.fullName || currentUser?.email || 'Unknown',
          role: currentUser?.role
        },
        employees: selectedEmployeeDetails,
        createdBy: currentUser?.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'projects'), projectData);
      
      showNotification('Projekt erfolgreich erstellt!', 'success');
      
      // Reset form
      setTp('');
      setUdp('');
      setTitle('');
      setDescription('');
      setCity(cities[0]);
      setStatus(statuses[0]);
      setStartDate('');
      setEndDate('');
      setBudget('');
      setPriority('Medium');
      setSelectedEmployees([]);

      // Redirect to projects overview after a short delay
      setTimeout(() => {
        router.push('/dashboard/projects');
      }, 1500);

    } catch (error) {
      console.error("Error creating project: ", error);
      showNotification('Fehler beim Erstellen des Projekts. Bitte versuchen Sie es erneut.', 'error');
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
              {/* Project Code Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tp">TP *</Label>
                  <Input
                    id="tp"
                    type="number"
                    value={tp}
                    onChange={handleTpChange}
                    placeholder="1-1000"
                    min="1"
                    max="1000"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="udp">UDP *</Label>
                  <Input
                    id="udp"
                    type="number"
                    value={udp}
                    onChange={handleUdpChange}
                    placeholder="1-1000"
                    min="1"
                    max="1000"
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

              {/* Auto-generated Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Project Title (Auto-generated)</Label>
                <Input
                  id="title"
                  value={title}
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
                  <Label htmlFor="startDate">Startdatum</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Enddatum</Label>
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
                  placeholder="Projektbudget eingeben"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Project Manager (Auto-filled) */}
              <div className="space-y-2">
                <Label htmlFor="projectManager">Project Manager</Label>
                <Input
                  id="projectManager"
                  value={currentUser?.fullName || currentUser?.email || 'Loading...'}
                  readOnly
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500">This field is automatically filled based on your login</p>
              </div>

              {/* Employees Selection */}
              <div className="space-y-4">
                <Label className="flex items-center space-x-2">
                  <UsersIcon className="h-4 w-4" />
                  <span>Assign Employees to Project</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto border rounded-md p-4">
                  {employees.map((employee) => (
                    <div key={employee.uid} className="flex items-center space-x-2">
                      <Checkbox
                        id={`employee-${employee.uid}`}
                        checked={selectedEmployees.includes(employee.uid)}
                        onCheckedChange={(checked) => handleEmployeeSelection(employee.uid, checked as boolean)}
                      />
                      <Label 
                        htmlFor={`employee-${employee.uid}`}
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
                {selectedEmployees.length > 0 && (
                  <p className="text-sm text-gray-600">
                    {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Preview Card */}
              {title && (
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Projektvorschau</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Titel:</span>
                        <span>{title}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">TP:</span>
                        <span>{tp.padStart(2, '0')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">UDP:</span>
                        <span>{udp.padStart(2, '0')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Stadt:</span>
                        <span>{city}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Projektmanager:</span>
                        <span>{currentUser?.fullName || currentUser?.email}</span>
                      </div>
                      {selectedEmployees.length > 0 && (
                        <div className="flex items-start justify-between">
                          <span className="font-medium">Mitarbeiter:</span>
                          <div className="flex flex-wrap gap-1 max-w-xs justify-end">
                            {getSelectedEmployeeNames().slice(0, 3).map((name, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {name}
                              </Badge>
                            ))}
                            {getSelectedEmployeeNames().length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{getSelectedEmployeeNames().length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
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
                        <span className="font-medium">Priorität:</span>
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
                    Abbrechen
                  </Button>
                </Link>
                <Button type="submit" disabled={loading || !title}>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  {loading ? 'Wird erstellt...' : 'Projekt erstellen'}
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