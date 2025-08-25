'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, query, addDoc, DocumentData, orderBy, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isToday } from 'date-fns';
import { Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Define the message type
type Message = {
  id: string;
  text: string;
  sender: string;
  timestamp: any;
  topic: string;
  mentions?: string[];
};

// Define the user type
type User = {
  id: string;
  fullName: string;
  role: string;
};

const topics = ["General", "Back Office", "Lippstadt", "Herzogenrath", "Emmerich"];

const DiscussPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('General');
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});
  const [userRole, setUserRole] = useState('');
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [messageToDeleteId, setMessageToDeleteId] = useState<string | null>(null);

  const [notification, setNotification] = useState<{ message: string; type: string; } | null>(null);
  const [unreadTopics, setUnreadTopics] = useState<Record<string, boolean>>({});
  const [notifiedMentions, setNotifiedMentions] = useState<string[]>([]); // New state to track notified mentions

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
  };
  
  const handleDismissNotification = () => {
    setNotification(null);
  };
  
  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);
    setUnreadTopics(prev => ({ ...prev, [topic]: false }));
  };

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

      const currentUser = auth.currentUser;
      if (currentUser) {
        const mentionsToNotify: string[] = [];
        snapshot.docChanges().forEach(change => {
            const messageData = change.doc.data() as Message;
            if (
                messageData.mentions?.includes(currentUser.uid) &&
                messageData.sender !== currentUser.uid &&
                !notifiedMentions.includes(change.doc.id)
            ) {
                // If it's a new document being added, show notification and add to notified list
                if (change.type === 'added') {
                    const mentioningUser = usersMap[messageData.sender]?.fullName || 'Someone';
                    showNotification(`${mentioningUser} mentioned you in ${messageData.topic}!`, 'success');
                    mentionsToNotify.push(change.doc.id);

                    if (messageData.topic !== selectedTopic) {
                        setUnreadTopics(prev => ({ ...prev, [messageData.topic]: true }));
                    }
                }
            }
        });
        
        // Add new notified mentions to the state
        if (mentionsToNotify.length > 0) {
            setNotifiedMentions(prev => [...prev, ...mentionsToNotify]);
        }
      }

      setMessages(messagesArray);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching messages: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedTopic, usersMap, notifiedMentions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    const words = value.split(' ');
    const lastWord = words[words.length - 1];
    const secondLastWord = words.length > 1 ? words[words.length - 2] : '';
    
    const possibleMention = lastWord.startsWith('@') ? lastWord.substring(1).toLowerCase() : '';
    const possibleFullMention = secondLastWord.startsWith('@') ? `${secondLastWord.substring(1)} ${lastWord}`.toLowerCase() : '';

    if (possibleMention || possibleFullMention) {
      const query = possibleFullMention || possibleMention;
      const filtered = Object.values(usersMap).filter(user =>
        user.fullName.toLowerCase().includes(query)
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (user: User) => {
    const words = newMessage.split(' ');
    
    let lastAtIndex = -1;
    for (let i = words.length - 1; i >= 0; i--) {
        if (words[i].startsWith('@')) {
            lastAtIndex = i;
            break;
        }
    }

    if (lastAtIndex !== -1) {
        const preMentionWords = words.slice(0, lastAtIndex);
        const postMentionWords = words.slice(lastAtIndex + 1);
        const updatedMessage = `${preMentionWords.join(' ')} @${user.fullName} ${postMentionWords.join(' ')}`.trim() + ' ';
        setNewMessage(updatedMessage);
    } else {
        setNewMessage(newMessage + `@${user.fullName} `);
    }

    setShowSuggestions(false);
  };
  
  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    try {
      const user = auth.currentUser;
      if (user) {
        const mentions: string[] = [];
        const regex = /@([a-zA-Z]+\s?[a-zA-Z]+)/g;
        let match;
        while ((match = regex.exec(newMessage)) !== null) {
          const mentionedName = match[1];
          const mentionedUser = Object.values(usersMap).find(u => u.fullName.toLowerCase() === mentionedName.toLowerCase());
          if (mentionedUser) {
            mentions.push(mentionedUser.id);
          }
        }

        await addDoc(collection(db, 'messages'), {
          text: newMessage,
          sender: user.uid,
          timestamp: new Date(),
          topic: selectedTopic,
          mentions,
        });
        setNewMessage('');
        setSuggestions([]);
      } else {
        alert('You must be logged in to send a message.');
      }
    } catch (error) {
      console.error("Error sending message: ", error);
      if (error instanceof Error) {
        alert('Error adding message: ' + error.message);
      }
    }
  };

  const handleOpenDialog = (messageId: string) => {
    setMessageToDeleteId(messageId);
    setIsDialogOpen(true);
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'messages', messageId));
      console.log('Message deleted successfully.');
      setIsDialogOpen(false);
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
          <Card className="w-64">
            <CardHeader>
              <CardTitle>Topics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topics.map(topic => (
                <Button
                  key={topic}
                  variant={selectedTopic === topic ? 'default' : 'ghost'}
                  className="w-full justify-start relative"
                  onClick={() => handleTopicClick(topic)}
                >
                  {topic}
                  {unreadTopics[topic] && (
                    <Badge className="absolute right-2 top-1/2 -translate-y-1/2">New</Badge>
                  )}
                </Button>
              ))}
            </CardContent>
          </Card>

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
                    const messageDate = message.timestamp.toDate();
                    
                    const formattedDate = isToday(messageDate) 
                      ? format(messageDate, 'HH:mm') 
                      : format(messageDate, 'MM/dd/yyyy HH:mm');

                    let displayText = message.text;
                    if (message.mentions && message.mentions.length > 0) {
                      message.mentions.forEach(mentionedId => {
                        const mentionedUser = usersMap[mentionedId];
                        if (mentionedUser) {
                          const mentionText = `@${mentionedUser.fullName}`;
                          displayText = displayText.replace(mentionText, `<b>${mentionText}</b>`);
                        }
                      });
                    }

                    return (
                      <div key={message.id} className="mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-sm text-gray-700">{senderName}</span>
                          <span className="text-xs text-gray-400">
                            {formattedDate}
                          </span>
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
                        <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: displayText }}></p>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
            <div className="p-6 border-t relative">
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute bottom-20 left-6 right-6 z-10 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {suggestions.map(user => (
                    <div
                      key={user.id}
                      className="p-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSelectSuggestion(user)}
                    >
                      {user.fullName}
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button type="submit">Send</Button>
              </form>
            </div>
          </Card>
        </div>
      </div>

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
      
      {notification && (
        <div className={cn(
          "fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-50 transition-all duration-300 ease-in-out flex items-center justify-between space-x-4",
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        )}>
          <span>{notification.message}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismissNotification}
            className="text-white hover:bg-white/20 p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default DiscussPage;