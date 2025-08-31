'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, DocumentData, doc, getDoc, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Import shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Define the type for a vacation request
type VacationRequest = {
  id: string;
  employeeId: string;
  employeeName?: string;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string;
  createdAt: string;
};

// Type guard to validate vacation request data
const isValidVacationRequest = (data: any): data is VacationRequest => {
  return (
    typeof data.employeeId === 'string' &&
    typeof data.startDate === 'string' &&
    typeof data.endDate === 'string' &&
    typeof data.status === 'string' &&
    typeof data.createdAt === 'string'
  );
};

// Define the type for a project
type Project = {
  id: string;
  name: string;
  city: string;
  status: string;
  createdAt: string;
  description?: string;
};

// Type guard to validate project data
const isValidProject = (data: any): data is Project => {
  return (
    typeof data.name === 'string' &&
    typeof data.city === 'string' &&
    typeof data.status === 'string' &&
    typeof data.createdAt === 'string'
  );
};

type ReportType = 'overview' | 'vacation' | 'projects';

const ReportsPage = () => {
  const router = useRouter();
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<ReportType>('overview');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (!user) {
            router.push('/login');
            return;
        }
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            setUserRole(userDoc.data().role as string);
        } else {
            setUserRole('employee');
        }
    });

    // Fetch vacation requests
    const unsubscribeVacation = onSnapshot(query(collection(db, 'vacation_requests'), orderBy('createdAt', 'desc')), (snapshot) => {
      let vacationArray: VacationRequest[] = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...(doc.data() as DocumentData),
        }))
        .filter(isValidVacationRequest);
      setVacationRequests(vacationArray);
    });

    // Fetch projects
    const unsubscribeProjects = onSnapshot(query(collection(db, 'projects'), orderBy('createdAt', 'desc')), (snapshot) => {
      let projectsArray: Project[] = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...(doc.data() as DocumentData),
        }))
        .filter(isValidProject);
      setProjects(projectsArray);
      setLoading(false);
    });

    return () => {
        unsubscribeAuth();
        unsubscribeVacation();
        unsubscribeProjects();
    };
  }, [router]);

  const canViewReports = userRole === 'admin' || userRole === 'manager';

  if (loading || userRole === null) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Berichte werden geladen...</div>
      </div>
    );
  }

  if (!canViewReports) {
    return (
      <div className="p-8 text-center text-red-500 bg-gray-100 min-h-screen">
        <h1 className="text-4xl font-bold mb-4">Zugriff verweigert</h1>
        <p>Sie haben nicht die erforderlichen Berechtigungen, um diese Seite anzuzeigen.</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">Zurück zum Dashboard</Link>
      </div>
    );
  }

  // Calculate summary statistics
  const totalVacationRequests = vacationRequests.length;
  const pendingVacationRequests = vacationRequests.filter(req => req.status === 'pending').length;
  const approvedVacationRequests = vacationRequests.filter(req => req.status === 'approved').length;
  const deniedVacationRequests = vacationRequests.filter(req => req.status === 'denied').length;

  const totalProjects = projects.length;
  const activeProjects = projects.filter(project => project.status === 'active').length;
  const completedProjects = projects.filter(project => project.status === 'completed').length;
  const plannedProjects = projects.filter(project => project.status === 'planned').length;

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urlaubsanträge</CardTitle>
            <Badge variant="outline">{totalVacationRequests}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVacationRequests}</div>
            <p className="text-xs text-muted-foreground">Alle Anträge</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausstehend</CardTitle>
            <Badge className="bg-yellow-200 text-yellow-800">Pending</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingVacationRequests}</div>
            <p className="text-xs text-muted-foreground">Warten auf Genehmigung</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genehmigt</CardTitle>
            <Badge className="bg-green-200 text-green-800">Approved</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedVacationRequests}</div>
            <p className="text-xs text-muted-foreground">Erfolgreich genehmigt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projekte</CardTitle>
            <Badge variant="outline">{totalProjects}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">Alle Projekte</p>
          </CardContent>
        </Card>
      </div>

      {/* Vacation Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Urlaubsanträge Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="font-medium">Ausstehend</span>
              <Badge className="bg-yellow-200 text-yellow-800">{pendingVacationRequests}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="font-medium">Genehmigt</span>
              <Badge className="bg-green-200 text-green-800">{approvedVacationRequests}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="font-medium">Abgelehnt</span>
              <Badge className="bg-red-200 text-red-800">{deniedVacationRequests}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Projekt Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="font-medium">Aktiv</span>
              <Badge className="bg-blue-200 text-blue-800">{activeProjects}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="font-medium">Abgeschlossen</span>
              <Badge className="bg-green-200 text-green-800">{completedProjects}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="font-medium">Geplant</span>
              <Badge className="bg-purple-200 text-purple-800">{plannedProjects}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Vacation Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte Urlaubsanträge</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vacationRequests.slice(0, 5).map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{request.employeeName || 'Unbekannt'}</h4>
                  <p className="text-sm text-gray-500">
                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={
                  request.status === 'approved' ? 'bg-green-200 text-green-800' :
                  request.status === 'denied' ? 'bg-red-200 text-red-800' :
                  'bg-yellow-200 text-yellow-800'
                }>
                  {request.status === 'approved' ? 'Genehmigt' :
                   request.status === 'denied' ? 'Abgelehnt' : 'Ausstehend'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderVacationReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Urlaubsanträge Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vacationRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{request.employeeName || 'Unbekannt'}</h4>
                  <p className="text-sm text-gray-500">
                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                  </p>
                  {request.reason && <p className="text-sm text-gray-600 mt-1">{request.reason}</p>}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={
                    request.status === 'approved' ? 'bg-green-200 text-green-800' :
                    request.status === 'denied' ? 'bg-red-200 text-red-800' :
                    'bg-yellow-200 text-yellow-800'
                  }>
                    {request.status === 'approved' ? 'Genehmigt' :
                     request.status === 'denied' ? 'Abgelehnt' : 'Ausstehend'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProjectsReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Projekte Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{project.name}</h4>
                  <p className="text-sm text-gray-500">Stadt: {project.city}</p>
                  {project.description && <p className="text-sm text-gray-600 mt-1">{project.description}</p>}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={
                    project.status === 'active' ? 'bg-blue-200 text-blue-800' :
                    project.status === 'completed' ? 'bg-green-200 text-green-800' :
                    'bg-purple-200 text-purple-800'
                  }>
                    {project.status === 'active' ? 'Aktiv' :
                     project.status === 'completed' ? 'Abgeschlossen' : 'Geplant'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
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
        <span>Berichte</span>
      </div>
      
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Berichte & Analysen</h1>

      {/* Report Navigation */}
      <div className="flex space-x-2 mb-6">
        <Button
          variant={activeReport === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveReport('overview')}
        >
          Übersicht
        </Button>
        <Button
          variant={activeReport === 'vacation' ? 'default' : 'outline'}
          onClick={() => setActiveReport('vacation')}
        >
          Urlaubsanträge
        </Button>
        <Button
          variant={activeReport === 'projects' ? 'default' : 'outline'}
          onClick={() => setActiveReport('projects')}
        >
          Projekte
        </Button>
      </div>

      {/* Report Content */}
      <div className="h-[calc(100vh-200px)]">
        {activeReport === 'overview' && renderOverview()}
        {activeReport === 'vacation' && renderVacationReport()}
        {activeReport === 'projects' && renderProjectsReport()}
      </div>
    </div>
  );
};

export default ReportsPage;