'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, query, addDoc, DocumentData, orderBy, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ListTodo, FileText, MessageSquare, Menu, MapPin, UserCog, ListChecks, Warehouse } from 'lucide-react';

// Define the message type
type Message = {
  id: string;
  text: string;
  sender: string; // This will now be the user's UID
  timestamp: any;
  topic: string;
};

// Define the user type
type User = {
  id: string;
  fullName: string;
  // Add other user properties if needed
};

const topics = ["General", "Back Office", "Lippstadt", "Herzogenrath", "Emmerich"];

const DiscussPage = () => {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('General');
  const [usersMap, setUsersMap] = useState<Record<string, User>>({}); // To store user data
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

  // Fetch users and store them in a map
  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersData: Record<string, User> = {};
      usersSnapshot.forEach(doc => {
        usersData[doc.id] = { id: doc.id, ...doc.data() } as User;
      });
      setUsersMap(usersData);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    // A query that listens to messages for the selected topic
    if (!selectedTopic) return;
    
    const q = query(
      collection(db, 'messages'), 
      where('topic', '==', selectedTopic),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesArray: Message[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as DocumentData),
      })) as Message[];
      setMessages(messagesArray);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching messages: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedTopic]);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    try {
      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(db, 'messages'), {
          text: newMessage,
          sender: user.uid, // Store user's UID instead of email
          timestamp: new Date(),
          topic: selectedTopic, // Save the message with the current topic
        });
        setNewMessage('');
      } else {
        alert('You must be logged in to send a message.');
      }
    } catch (error) {
      console.error("Error sending message: ", error);
      if (error instanceof Error) {
        alert('Error sending message: ' + error.message);
      }
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

        {/* Main content area */}
        <div className="flex-1 p-8">
            <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
                <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
                    <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                    Dashboard
                    </Link>
                    <span>/</span>
                    <span>Discuss</span>
                </div>
                <h1 className="text-4xl font-bold text-gray-800 mb-6">Discuss</h1>
                <div className="flex flex-1 gap-4">
                    {/* Left Panel: Topics */}
                    <Card className="w-64">
                    <CardHeader>
                        <CardTitle>Topics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {topics.map(topic => (
                        <Button
                            key={topic}
                            variant={selectedTopic === topic ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setSelectedTopic(topic)}
                        >
                            {topic}
                        </Button>
                        ))}
                    </CardContent>
                    </Card>

                    {/* Right Panel: Chat */}
                    <Card className="flex-1 flex flex-col">
                    <CardHeader>
                        <CardTitle>{selectedTopic} Chat</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col-reverse overflow-hidden">
                        <ScrollArea className="h-full pr-4">
                        <div className="flex flex-col-reverse">
                            {messages.map((message) => {
                            const senderInfo = usersMap[message.sender];
                            const senderName = senderInfo ? senderInfo.fullName : 'Unknown User';
                            return (
                                <div key={message.id} className="mb-4">
                                <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-sm text-gray-700">{senderName}</span>
                                    <span className="text-xs text-gray-400">
                                    {format(message.timestamp.toDate(), 'MM/dd/yyyy HH:mm')}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">{message.text}</p>
                                </div>
                            );
                            })}
                        </div>
                        </ScrollArea>
                    </CardContent>
                    <div className="p-6 border-t">
                        <form onSubmit={handleSendMessage} className="flex space-x-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1"
                        />
                        <Button type="submit">Send</Button>
                        </form>
                    </div>
                    </Card>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DiscussPage;
