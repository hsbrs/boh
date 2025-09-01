'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { format } from 'date-fns';
import { Calendar, Clock, User, MessageSquare, CheckCircle, XCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VacationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  startDate: any;
  endDate: any;
  reason: string;
  replacementUserId?: string;
  replacementUserName?: string;
  status: string;
  createdAt: any;
  updatedAt: any;
  approvals: {
    hr: { approved: boolean; date: any; comment: string };
    pm: { approved: boolean; date: any; comment: string };
    manager: { approved: boolean; date: any; comment: string };
  };
}

interface VacationRequestListProps {
  userRole: string;
  userId: string;
}

export default function VacationRequestList({ userRole, userId }: VacationRequestListProps) {
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);
  const [comment, setComment] = useState('');
  const [action, setAction] = useState<'approve' | 'deny'>('approve');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let q;
    
    if (userRole === 'employee') {
      // Employees see only their own requests
      q = query(
        collection(db, 'vacation_requests'),
        where('employeeId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Managers, HR, and PM see all requests
      q = query(
        collection(db, 'vacation_requests'),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VacationRequest[];
      
      setRequests(requestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userRole, userId]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Ausstehend' },
      hr_review: { color: 'bg-blue-100 text-blue-800', text: 'PM-Prüfung' },
      pm_review: { color: 'bg-purple-100 text-purple-800', text: 'Manager-Prüfung' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Genehmigt' },
      denied: { color: 'bg-red-100 text-red-800', text: 'Abgelehnt' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const canApprove = (request: VacationRequest) => {
    if (userRole === 'hr' && request.status === 'pending') return true;
    if (userRole === 'pm' && request.status === 'hr_review') return true;
    if (userRole === 'manager' && request.status === 'pm_review') return true;
    return false;
  };

  const getNextStatus = (request: VacationRequest) => {
    if (userRole === 'hr' && request.status === 'pending') return 'hr_review';
    if (userRole === 'pm' && request.status === 'hr_review') return 'pm_review';
    if (userRole === 'manager' && request.status === 'pm_review') return 'approved';
    return request.status;
  };

  const handleAction = async () => {
    if (!selectedRequest || !comment.trim()) {
      toast.error('Bitte geben Sie einen Kommentar an');
      return;
    }

    setIsSubmitting(true);
    try {
      const requestRef = doc(db, 'vacation_requests', selectedRequest.id);
      const newStatus = action === 'approve' ? getNextStatus(selectedRequest) : 'denied';
      
      const updateData: any = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        [`approvals.${userRole === 'hr' ? 'hr' : userRole === 'pm' ? 'pm' : 'manager'}`]: {
          approved: action === 'approve',
          date: serverTimestamp(),
          comment: comment.trim()
        }
      };

      await updateDoc(requestRef, updateData);
      
      toast.success(`Antrag erfolgreich ${action === 'approve' ? 'genehmigt' : 'abgelehnt'}`);
      setSelectedRequest(null);
      setComment('');
      setAction('approve');
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Fehler beim Aktualisieren des Antrags');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFilteredRequests = () => {
    if (userRole === 'employee') return requests;
    
    // HR, PM, Manager, and Admin see all requests for oversight and history
    return requests;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Urlaubsanträge werden geladen...</div>
      </div>
    );
  }

  const filteredRequests = getFilteredRequests();

  return (
    <div className="space-y-4">
             <div className="flex justify-between items-center">
         <h3 className="text-xl font-semibold">Urlaubsanträge</h3>
         <div className="flex gap-2">
           {userRole === 'employee' && (
             <Badge variant="outline" className="text-sm">
               {requests.length} Antrag{requests.length !== 1 ? 'e' : ''}
             </Badge>
           )}
           {userRole !== 'employee' && (
             <>
               <Badge variant="outline" className="text-sm">
                 {requests.length} Gesamt
               </Badge>
               <Badge variant="secondary" className="text-sm bg-blue-100 text-blue-800">
                 {requests.filter(r => canApprove(r)).length} Aktion erforderlich
               </Badge>
             </>
           )}
         </div>
       </div>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Keine Urlaubsanträge gefunden</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => (
                         <Card key={request.id} className={cn(
               "hover:shadow-md transition-shadow",
               canApprove(request) && "ring-2 ring-blue-200 bg-blue-50/30"
             )}>
               <CardHeader className="pb-3">
                 <div className="flex justify-between items-start">
                   <div>
                     <CardTitle className="text-lg">{request.employeeName}</CardTitle>
                     <p className="text-sm text-gray-600">{request.employeeRole}</p>
                   </div>
                   <div className="flex flex-col items-end gap-2">
                     {getStatusBadge(request.status)}
                     {canApprove(request) && (
                       <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                         Aktion erforderlich
                       </Badge>
                     )}
                   </div>
                 </div>
               </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm break-words">
                      {format(request.startDate.toDate(), 'MMM dd, yyyy')} - {format(request.endDate.toDate(), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">
                      {Math.ceil((request.endDate.toDate() - request.startDate.toDate()) / (1000 * 60 * 60 * 24))} Tage
                    </span>
                  </div>
                </div>
                
                                 <div className="flex items-start gap-2">
                   <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                   <p className="text-xs sm:text-sm text-gray-700 break-words">{request.reason}</p>
                 </div>

                 {request.replacementUserName && (
                   <div className="flex items-center gap-2">
                     <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                     <span className="text-xs sm:text-sm">
                       <span className="font-medium">Vertretung:</span> {request.replacementUserName}
                     </span>
                   </div>
                 )}

                                 {/* Action buttons for approvers */}
                 {canApprove(request) && (
                   <div className="flex flex-col sm:flex-row gap-2 pt-2">
                     <Dialog>
                       <DialogTrigger asChild>
                         <Button 
                           size="sm" 
                           onClick={() => {
                             setSelectedRequest(request);
                             setAction('approve');
                             setComment('');
                           }}
                         >
                           <CheckCircle className="h-4 w-4 mr-1" />
                           Genehmigen
                         </Button>
                       </DialogTrigger>
                       <DialogContent>
                         <DialogHeader>
                           <DialogTitle>Urlaubsantrag genehmigen</DialogTitle>
                         </DialogHeader>
                         <div className="space-y-4">
                           <div>
                             <Label htmlFor="comment">Kommentar (optional)</Label>
                             <Textarea
                               id="comment"
                               placeholder="Kommentar hinzufügen..."
                               value={comment}
                               onChange={(e) => setComment(e.target.value)}
                             />
                           </div>
                           <Button onClick={handleAction} className="w-full" disabled={isSubmitting}>
                             {isSubmitting ? 'Wird genehmigt...' : 'Antrag genehmigen'}
                           </Button>
                         </div>
                       </DialogContent>
                     </Dialog>

                     <Dialog>
                       <DialogTrigger asChild>
                         <Button 
                           size="sm" 
                           variant="destructive"
                           onClick={() => {
                             setSelectedRequest(request);
                             setAction('deny');
                             setComment('');
                           }}
                         >
                           <XCircle className="h-4 w-4 mr-1" />
                           Ablehnen
                         </Button>
                       </DialogTrigger>
                       <DialogContent>
                         <DialogHeader>
                           <DialogTitle>Urlaubsantrag ablehnen</DialogTitle>
                         </DialogHeader>
                         <div className="space-y-4">
                           <div>
                             <Label htmlFor="comment">Kommentar (erforderlich)</Label>
                             <Textarea
                               id="comment"
                               placeholder="Bitte geben Sie einen Grund für die Ablehnung an..."
                               value={comment}
                               onChange={(e) => setComment(e.target.value)}
                               required
                             />
                           </div>
                           <Button 
                             onClick={handleAction} 
                             variant="destructive" 
                             className="w-full"
                             disabled={isSubmitting || !comment.trim()}
                           >
                             {isSubmitting ? 'Wird abgelehnt...' : 'Antrag ablehnen'}
                           </Button>
                         </div>
                       </DialogContent>
                     </Dialog>
                   </div>
                 )}

                                   {/* Status indicator for requests that can't be acted on */}
                  {!canApprove(request) && userRole !== 'employee' && (
                    <div className="pt-2">
                      <Badge variant="outline" className="text-xs">
                        {request.status === 'approved' ? 'Vollständig genehmigt' : 
                         request.status === 'denied' ? 'Abgelehnt' : 
                         request.status === 'hr_review' ? 'Warten auf PM-Prüfung' :
                         request.status === 'pm_review' ? 'Warten auf Manager-Prüfung' :
                         'Warten auf andere Genehmigung'}
                      </Badge>
                    </div>
                  )}

                {/* Show approval history */}
                {request.approvals && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-gray-600 mb-2">Genehmigungsverlauf:</p>
                    <div className="space-y-1">
                      {Object.entries(request.approvals).map(([role, approval]) => {
                        const roleDisplayName = role === 'hr' ? 'HR' : role === 'pm' ? 'PM' : 'Manager';
                        const hasActed = approval.date;
                        const isApproved = approval.approved;
                        
                        return (
                          <div key={role} className="flex items-center gap-2 text-xs">
                            <span className="capitalize font-medium">{roleDisplayName}:</span>
                            {hasActed ? (
                              <>
                                <Badge variant={isApproved ? "default" : "destructive"} className="text-xs">
                                  {isApproved ? 'Genehmigt' : 'Abgelehnt'}
                                </Badge>
                                {approval.comment && (
                                  <span className="text-gray-600">- {approval.comment}</span>
                                )}
                              </>
                            ) : (
                              <Badge variant="outline" className="text-xs text-gray-500">
                                Ausstehend
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
