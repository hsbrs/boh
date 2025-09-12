'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeftIcon, EditIcon, ClockIcon, MapPinIcon, CalendarIcon, UserIcon, CheckCircleIcon, PlayIcon, PauseIcon, SquareIcon, EyeIcon } from 'lucide-react';

interface UserData {
  uid: string;
  fullName?: string;
  role?: string;
  email?: string;
  isApproved?: boolean;
}

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
  additionalNotes?: string;
  createdBy: {
    uid: string;
    name: string;
    role: string;
  };
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
}

const WorkOrderDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const workOrderId = params.id as string;
  
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.data() as UserData;
          
          setCurrentUser({
            ...userData,
            uid: user.uid
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch work order data
  useEffect(() => {
    const fetchWorkOrder = async () => {
      if (!workOrderId) return;
      
      try {
        const workOrderDoc = await getDoc(doc(db, 'workOrders', workOrderId));
        if (workOrderDoc.exists()) {
          setWorkOrder({
            id: workOrderDoc.id,
            ...workOrderDoc.data()
          } as WorkOrder);
        } else {
          console.error('Work order not found');
          router.push('/dashboard/work-orders');
        }
      } catch (error) {
        console.error('Error fetching work order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrder();
  }, [workOrderId, router]);

  const updateWorkOrderStatus = async (newStatus: string) => {
    if (!workOrder) return;
    
    setUpdating(true);
    try {
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date()
      };
      
      if (newStatus === 'Completed' && !workOrder.completedAt) {
        updateData.completedAt = new Date();
      }
      
      await updateDoc(doc(db, 'workOrders', workOrder.id), updateData);
      
      setWorkOrder(prev => prev ? {
        ...prev,
        status: newStatus,
        completedAt: newStatus === 'Completed' ? new Date() : prev.completedAt,
        updatedAt: new Date()
      } : null);
    } catch (error) {
      console.error('Error updating work order status:', error);
    } finally {
      setUpdating(false);
    }
  };

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

  const canUpdateStatus = () => {
    if (!currentUser) return false;
    const allowedRoles = ['pm', 'manager', 'admin'];
    return allowedRoles.includes(currentUser.role || '');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Lade Arbeitsauftrag...</div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Arbeitsauftrag nicht gefunden</div>
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
        <span>{workOrder.workOrderId}</span>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800">{workOrder.title}</h1>
        <div className="flex space-x-2">
          <Link href="/dashboard/work-orders">
            <Button variant="outline">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Work Orders
            </Button>
          </Link>
          {canUpdateStatus() && (
            <Button variant="outline">
              <EditIcon className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          <Link href={`/dashboard/work-orders/${workOrder.id}`}>
            <Button variant="outline" size="sm">
              <EyeIcon className="h-4 w-4 mr-1" />
              View
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Work Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Work Order ID</label>
                  <p className="text-lg font-semibold">{workOrder.workOrderId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Project</label>
                  <p className="text-lg">{workOrder.projectTitle} ({workOrder.projectCity})</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <div className="mt-1">
                    <Badge className={getPriorityColor(workOrder.priority)}>
                      {workOrder.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Badge className={getStatusColor(workOrder.status)}>
                      {workOrder.status}
                    </Badge>
                    {canUpdateStatus() && workOrder.status !== 'Completed' && workOrder.status !== 'Cancelled' && (
                      <div className="flex space-x-1">
                        {workOrder.status === 'Pending' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => updateWorkOrderStatus('In Progress')}
                            disabled={updating}
                          >
                            <PlayIcon className="h-3 w-3" />
                          </Button>
                        )}
                        {workOrder.status === 'In Progress' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => updateWorkOrderStatus('Completed')}
                              disabled={updating}
                            >
                              <CheckCircleIcon className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => updateWorkOrderStatus('Pending')}
                              disabled={updating}
                            >
                              <PauseIcon className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-2 text-gray-700 whitespace-pre-wrap">{workOrder.description}</p>
              </div>

              {workOrder.additionalNotes && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Additional Notes</label>
                    <p className="mt-2 text-gray-700 whitespace-pre-wrap">{workOrder.additionalNotes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline & Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline & Duration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Schedule Date</p>
                    <p className="text-lg">{formatDate(workOrder.scheduleDate)}</p>
                  </div>
                </div>
                
                {workOrder.dueDate && (
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Due Date</p>
                      <p className="text-lg">{formatDate(workOrder.dueDate)}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <ClockIcon className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Estimated Duration</p>
                    <p className="text-lg">{formatDuration(workOrder.estimateDuration)}</p>
                  </div>
                </div>
                
                {workOrder.actualDuration && (
                  <div className="flex items-center space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Actual Duration</p>
                      <p className="text-lg">{formatDuration(workOrder.actualDuration)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5" />
                <span>Team Members</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workOrder.assignees.map((assignee, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {assignee.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{assignee.name}</p>
                      <p className="text-sm text-gray-500">{assignee.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Google Maps Link */}
          {workOrder.googleMapUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPinIcon className="h-5 w-5" />
                  <span>Location</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a 
                  href={workOrder.googleMapUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Open in Google Maps
                </a>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Created By</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{workOrder.createdBy.name}</p>
                <p className="text-sm text-gray-500">{workOrder.createdBy.role}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-sm">{formatDate(workOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-sm">{formatDate(workOrder.updatedAt)}</p>
                </div>
                {workOrder.completedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-sm">{formatDate(workOrder.completedAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderDetailPage;
