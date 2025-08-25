'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, query, addDoc, DocumentData, orderBy, doc, updateDoc, deleteDoc, where, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, CalendarIcon, LayoutDashboard, ListTodo, FileText, MessageSquare, Menu, MapPin, UserCog, ListChecks, Warehouse } from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth, isPast } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

// Define the ToDo type
type ToDo = {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: any;
  deadline?: any;
  uid: string;
};

// Define the type for the grouped tasks object
type GroupedToDos = {
  today: ToDo[];
  thisWeek: ToDo[];
  thisMonth: ToDo[];
  later: ToDo[];
};

const ToDoPage = () => {
  const router = useRouter();
  const [toDos, setToDos] = useState<ToDo[]>([]);
  const [newToDo, setNewToDo] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) {
            router.push('/login');
        } else {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                setUserRole(userDoc.data().role as string);
            }
            setLoading(false);
        }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'userToDos'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const toDosArray: ToDo[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as DocumentData),
      })) as ToDo[];
      setToDos(toDosArray);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching to-dos: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Effect to handle initial state for mobile and window resizing
  useEffect(() => {
      const handleResize = () => {
          if (window.innerWidth < 768) {
              setIsCollapsed(true);
          } else {
              setIsCollapsed(false);
          }
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddToDo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newToDo.trim() === '' || !user) return;

    try {
      await addDoc(collection(db, 'userToDos'), {
        text: newToDo,
        isCompleted: false,
        createdAt: new Date(),
        deadline: deadline || null, // Save deadline to Firestore
        uid: user.uid,
      });
      setNewToDo('');
      setDeadline(undefined); // Reset deadline after adding
    } catch (error) {
      console.error("Error adding to-do: ", error);
    }
  };

  const handleToggleComplete = async (toDoId: string, isCompleted: boolean) => {
    const toDoDocRef = doc(db, 'userToDos', toDoId);
    try {
      await updateDoc(toDoDocRef, { isCompleted: !isCompleted });
    } catch (error) {
      console.error("Error updating to-do status: ", error);
    }
  };

  const handleDeleteToDo = async (toDoId: string) => {
    const toDoDocRef = doc(db, 'userToDos', toDoId);
    try {
      await deleteDoc(toDoDocRef);
    } catch (error) {
      console.error("Error deleting to-do: ", error);
    }
  };

  const handleLogout = async () => {
    try {
        await signOut(auth);
        router.push('/login');
    } catch (error) {
        if (error instanceof Error) {
            alert('Error logging out: ' + error.message);
        } else {
            alert('An unknown error occurred.');
        }
    }
  };

  const groupedToDos = toDos.reduce((groups: GroupedToDos, toDo: ToDo) => {
    const deadlineDate = toDo.deadline?.toDate();
    if (deadlineDate) {
        if (isToday(deadlineDate)) {
            groups.today.push(toDo);
        } else if (isThisWeek(deadlineDate, { weekStartsOn: 1 })) { // week starts on Monday
            groups.thisWeek.push(toDo);
        } else if (isThisMonth(deadlineDate)) {
            groups.thisMonth.push(toDo);
        } else {
            groups.later.push(toDo);
        }
    } else {
        // If no deadline, default to 'Later'
        groups.later.push(toDo);
    }
    return groups;
  }, { today: [], thisWeek: [], thisMonth: [], later: [] });

  const renderToDos = (toDoList: ToDo[], title: string) => (
    <Card className="flex-1 flex flex-col p-4">
        <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1">
            <ScrollArea className="h-full max-h-[300px] pr-4">
                {toDoList.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">No items.</div>
                ) : (
                    <div className="space-y-2 pt-2">
                        {toDoList.map((toDo) => (
                            <div key={toDo.id} className="flex flex-col p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                                {/* First line: To-do text */}
                                <div className="flex items-center">
                                    <span className={cn(
                                      'text-sm font-medium', // Removed 'truncate'
                                      toDo.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'
                                    )}>
                                        {toDo.text}
                                    </span>
                                </div>
                                {/* Second line: Date and buttons */}
                                <div className="flex items-center justify-end space-x-2 mt-1">
                                    {toDo.deadline && (
                                        <span className={cn(
                                            'text-xs px-2 py-0.5 rounded-full shrink-0',
                                            toDo.isCompleted ? 'bg-gray-300 text-gray-700' : isPast(toDo.deadline.toDate()) ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'
                                        )}>
                                            {format(toDo.deadline.toDate(), 'MMM d')}
                                        </span>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn('size-7', toDo.isCompleted ? 'text-green-500 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100')}
                                        onClick={() => handleToggleComplete(toDo.id, toDo.isCompleted)}
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 text-red-500 hover:bg-red-100"
                                        onClick={() => handleDeleteToDo(toDo.id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  return (
    <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <div className={cn(
            'flex flex-col min-h-screen bg-white shadow-lg transition-all duration-300 ease-in-out',
            isCollapsed ? 'w-20 p-2' : 'w-64 p-6'
        )}>
            <div className="flex justify-between items-center mb-6">
                {!isCollapsed && (
                    <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={isCollapsed ? 'w-full' : ''}
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </div>
            <Separator />
            
            <div className="flex-1 mt-6">
                <nav className="flex flex-col space-y-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/dashboard" className={cn(
                                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                                    isCollapsed ? 'w-full' : 'w-full justify-start',
                                    'text-gray-700 hover:bg-gray-200'
                                )}>
                                    <LayoutDashboard className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                    {!isCollapsed && 'Home'}
                                </Link>
                            </TooltipTrigger>
                            {isCollapsed && <TooltipContent side="right">Home</TooltipContent>}
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/dashboard/tasks" className={cn(
                                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                                    isCollapsed ? 'w-full' : 'w-full justify-start',
                                    'text-gray-700 hover:bg-gray-200'
                                )}>
                                    <ListTodo className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                    {!isCollapsed && 'Work Orders'}
                                </Link>
                            </TooltipTrigger>
                            {isCollapsed && <TooltipContent side="right">Work Orders</TooltipContent>}
                        </Tooltip>
                        
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/dashboard/discuss" className={cn(
                                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                                    isCollapsed ? 'w-full' : 'w-full justify-start',
                                    'text-gray-700 hover:bg-gray-200'
                                )}>
                                    <MessageSquare className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                    {!isCollapsed && 'Discuss'}
                                </Link>
                            </TooltipTrigger>
                            {isCollapsed && <TooltipContent side="right">Discuss</TooltipContent>}
                        </Tooltip>
                        {/* New To Do link */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/dashboard/todo" className={cn(
                                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                                    isCollapsed ? 'w-full' : 'w-full justify-start',
                                    'text-gray-700 hover:bg-gray-200'
                                )}>
                                    <ListChecks className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                    {!isCollapsed && 'To Do'}
                                </Link>
                            </TooltipTrigger>
                            {isCollapsed && <TooltipContent side="right">Personal To Do</TooltipContent>}
                        </Tooltip>

                        {isManagerOrAdmin && (
                            <>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link href="/dashboard/webgis" className={cn(
                                            buttonVariants({ variant: 'ghost', size: 'sm' }),
                                            isCollapsed ? 'w-full' : 'w-full justify-start',
                                            'text-gray-700 hover:bg-gray-200'
                                        )}>
                                            <MapPin className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                            {!isCollapsed && 'WebGIS'}
                                        </Link>
                                    </TooltipTrigger>
                                    {isCollapsed && <TooltipContent side="right">WebGIS</TooltipContent>}
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link href="/dashboard/reports" className={cn(
                                            buttonVariants({ variant: 'ghost', size: 'sm' }),
                                            isCollapsed ? 'w-full' : 'w-full justify-start',
                                            'text-gray-700 hover:bg-gray-200'
                                        )}>
                                            <FileText className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                            {!isCollapsed && 'Reports'}
                                        </Link>
                                    </TooltipTrigger>
                                    {isCollapsed && <TooltipContent side="right">Reports</TooltipContent>}
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link href="/dashboard/warehouse-manager" className={cn(
                                            buttonVariants({ variant: 'ghost', size: 'sm' }),
                                            isCollapsed ? 'w-full' : 'w-full justify-start',
                                            'text-gray-700 hover:bg-gray-200'
                                        )}>
                                            <Warehouse className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                            {!isCollapsed && 'Warehouse'}
                                        </Link>
                                    </TooltipTrigger>
                                    {isCollapsed && <TooltipContent side="right">Warehouse</TooltipContent>}
                                </Tooltip>
                            </>
                        )}
                        {isAdmin && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href="/dashboard/admin" className={cn(
                                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                                        isCollapsed ? 'w-full' : 'w-full justify-start',
                                        'text-gray-700 hover:bg-gray-200'
                                    )}>
                                        <UserCog className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
                                        {!isCollapsed && 'Admin Panel'}
                                    </Link>
                                </TooltipTrigger>
                                {isCollapsed && <TooltipContent side="right">Admin Panel</TooltipContent>}
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </nav>
            </div>

            <div className="mt-auto">
                <Separator />
                <Button onClick={handleLogout} variant="destructive" className="w-full mt-4">
                    {!isCollapsed && 'Logout'}
                    {isCollapsed && <Menu className="h-5 w-5" />}
                </Button>
            </div>
        </div>
        <div className="flex-1 p-8">
            <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
                <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
                    <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                    Dashboard
                    </Link>
                    <span>/</span>
                    <span>To Do</span>
                </div>
                <h1 className="text-4xl font-bold text-gray-800 mb-6">My Personal To Do List</h1>
                
                <Card className="flex flex-col mb-6">
                    <CardHeader>
                        <CardTitle>Add a New To Do</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddToDo} className="flex flex-col md:flex-row gap-2">
                        <Input
                            value={newToDo}
                            onChange={(e) => setNewToDo(e.target.value)}
                            placeholder="What do you need to do?"
                            className="flex-1"
                        />
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-full md:w-auto justify-start text-left font-normal",
                                !deadline && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {deadline ? format(deadline, "PPP") : <span>Set a deadline</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={deadline}
                                onSelect={setDeadline}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <Button type="submit">Add</Button>
                        </form>
                    </CardContent>
                </Card>
                
                {/* Kanban-style list view */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {renderToDos(groupedToDos.today, 'Today')}
                    {renderToDos(groupedToDos.thisWeek, 'This Week')}
                    {renderToDos(groupedToDos.thisMonth, 'This Month')}
                    {renderToDos(groupedToDos.later, 'Later / No Deadline')}
                </div>

            </div>
        </div>
    </div>
  );
};

export default ToDoPage;
