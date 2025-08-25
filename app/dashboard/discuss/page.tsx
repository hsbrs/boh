'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, query, addDoc, DocumentData, orderBy, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

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
  role: string; // Add role to the user type
};

const topics = ["General", "Back Office", "Lippstadt", "Herzogenrath", "Emmerich"];

const DiscussPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('General');
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});
  const [userRole, setUserRole] = useState('');
  
  // New state for the confirmation dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [messageToDeleteId, setMessageToDeleteId] = useState<string | null>(null);

  // Fetch user role on page load
  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const role = userDocSnap.data().role;
          setUserRole(role);
        }
      }
    };

    fetchUserRole();
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
          sender: user.uid,
          timestamp: new Date(),
          topic: selectedTopic,
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

  // Function to handle opening the confirmation dialog
  const handleOpenDialog = (messageId: string) => {
    setMessageToDeleteId(messageId);
    setIsDialogOpen(true);
  };

  // Function to handle the actual message deletion
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'messages', messageId));
      console.log('Message deleted successfully.');
      setIsDialogOpen(false); // Close dialog after successful deletion
    } catch (error) {
      console.error("Error deleting message: ", error);
      if (error instanceof Error) {
        alert('Error deleting message: ' + error.message);
      }
    }
  };

  const handleCancelDelete = () => {
    setIsDialogOpen(false);
    setMessageToDeleteId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
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
                          {/* Conditionally render the delete button for admins */}
                          {userRole === 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-red-500"
                              onClick={() => handleOpenDialog(message.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>Cancel</Button>
            <Button variant="destructive" onClick={() => messageToDeleteId && handleDeleteMessage(messageToDeleteId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default DiscussPage;