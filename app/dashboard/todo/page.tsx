'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, query, addDoc, DocumentData, orderBy, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X } from 'lucide-react';

// Define the ToDo type
type ToDo = {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: any;
  uid: string;
};

const ToDoPage = () => {
  const [toDos, setToDos] = useState<ToDo[]>([]);
  const [newToDo, setNewToDo] = useState('');
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

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

  const handleAddToDo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newToDo.trim() === '' || !user) return;

    try {
      await addDoc(collection(db, 'userToDos'), {
        text: newToDo,
        isCompleted: false,
        createdAt: new Date(),
        uid: user.uid,
      });
      setNewToDo('');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 flex flex-col h-full">
      <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span>To Do</span>
      </div>
      <h1 className="text-4xl font-bold text-gray-800 mb-6">My To Do List</h1>
      
      <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Add a New To Do</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddToDo} className="flex space-x-2">
              <Input
                value={newToDo}
                onChange={(e) => setNewToDo(e.target.value)}
                placeholder="What do you need to do?"
                className="flex-1"
              />
              <Button type="submit">Add</Button>
            </form>
          </CardContent>
      </Card>

      <Card className="flex-1 flex flex-col mt-6">
          <CardHeader>
            <CardTitle>My Items</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full pr-4">
                {toDos.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">You have no to-do items.</div>
                ) : (
                    <div className="flex flex-col">
                        {toDos.map((toDo) => (
                            <div key={toDo.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
                                <span className={`text-lg ${toDo.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                    {toDo.text}
                                </span>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleToggleComplete(toDo.id, toDo.isCompleted)}
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteToDo(toDo.id)}
                                    >
                                        <X className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
          </CardContent>
      </Card>
    </div>
  );
};

export default ToDoPage;