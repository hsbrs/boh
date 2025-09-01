'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { addDoc, collection, serverTimestamp, doc, getDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';

interface VacationRequestFormProps {
  onSuccess?: () => void;
}

interface UserData {
  uid: string;
  fullName?: string;
  role?: string;
  isApproved?: boolean;
  email?: string;
}

export default function VacationRequestForm({ onSuccess }: VacationRequestFormProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState('');
  const [replacementUserId, setReplacementUserId] = useState<string>('');
  const [replacementUserName, setReplacementUserName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const fetchUsers = async () => {
          try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersData = usersSnapshot.docs
              .map(doc => ({
                uid: doc.id,
                ...doc.data()
              } as UserData))
              .filter(user => user.uid !== currentUser.uid && (user.isApproved !== false)) // Exclude current user and unapproved users
              .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
            
            setUsers(usersData);
          } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Fehler beim Laden der Benutzerliste');
          } finally {
            setLoadingUsers(false);
          }
        };

        fetchUsers();
      } else {
        setUsers([]);
        setLoadingUsers(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !reason.trim() || !replacementUserId) {
      toast.error('Bitte füllen Sie alle Felder einschließlich der Vertretungsperson aus');
      return;
    }

    if (startDate >= endDate) {
      toast.error('Enddatum muss nach dem Startdatum liegen');
      return;
    }

    if (startDate < new Date()) {
      toast.error('Startdatum kann nicht in der Vergangenheit liegen');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('Benutzer nicht authentifiziert');
        return;
      }

      // Get user data to include name and role
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

             const vacationRequest = {
         employeeId: user.uid,
         employeeName: userData?.fullName || user.email || '',
         employeeRole: userData?.role || 'employee',
         startDate: startDate,
         endDate: endDate,
         reason: reason.trim(),
         replacementUserId: replacementUserId,
         replacementUserName: replacementUserName,
         status: 'pending',
         createdAt: serverTimestamp(),
         updatedAt: serverTimestamp(),
         approvals: {
           hr: { approved: false, date: null, comment: '' },
           pm: { approved: false, date: null, comment: '' },
           manager: { approved: false, date: null, comment: '' }
         }
       };

      await addDoc(collection(db, 'vacation_requests'), vacationRequest);
      
      toast.success('Vacation request submitted successfully!');
      
             // Reset form
       setStartDate(undefined);
       setEndDate(undefined);
       setReason('');
       setReplacementUserId('');
       setReplacementUserName('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting vacation request:', error);
      toast.error('Failed to submit vacation request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <h3 className="text-lg sm:text-xl font-semibold mb-4">Urlaubsantrag einreichen</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Startdatum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-sm sm:text-base",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  {startDate ? format(startDate, "PPP") : "Startdatum wählen"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Enddatum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-sm sm:text-base",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  {endDate ? format(endDate, "PPP") : "Enddatum wählen"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  disabled={(date) => date <= (startDate || new Date())}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

                 <div className="space-y-2">
           <Label htmlFor="reason">Urlaubsgrund</Label>
           <Textarea
             id="reason"
             placeholder="Bitte geben Sie einen Grund für Ihren Urlaubsantrag an..."
             value={reason}
             onChange={(e) => setReason(e.target.value)}
             rows={4}
             required
           />
         </div>

         <div className="space-y-2">
           <Label htmlFor="replacement" className="flex items-center gap-2">
             <Users className="h-4 w-4" />
             Vertretungsperson während des Urlaubs
           </Label>
           {loadingUsers ? (
             <div className="text-sm text-gray-500">Benutzer werden geladen...</div>
           ) : (
             <Select
               value={replacementUserId}
               onValueChange={(value) => {
                 setReplacementUserId(value);
                 const selectedUser = users.find(u => u.uid === value);
                 setReplacementUserName(selectedUser?.fullName || '');
               }}
             >
               <SelectTrigger>
                 <SelectValue placeholder="Vertretungsperson auswählen" />
               </SelectTrigger>
               <SelectContent>
                 {users.map((user) => (
                   <SelectItem key={user.uid} value={user.uid}>
                     <div className="flex flex-col">
                       <span className="font-medium">{user.fullName || user.email}</span>
                       <span className="text-xs text-gray-500">{user.role}</span>
                     </div>
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           )}
           {replacementUserId && (
             <p className="text-sm text-gray-600">
               <span className="font-medium">Ausgewählt:</span> {replacementUserName}
             </p>
           )}
         </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Wird eingereicht...' : 'Antrag einreichen'}
        </Button>
      </form>
    </div>
  );
}
