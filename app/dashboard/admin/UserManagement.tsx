'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, DocumentData, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React from 'react';

// Import shadcn/ui components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type User = {
  id: string;
  email: string;
  role: string;
};

const roles = ['employee', 'manager', 'admin'];

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersArray: User[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as DocumentData),
      })) as User[];
      setUsers(usersArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const userDocRef = doc(db, 'users', userId);
    try {
      await updateDoc(userDocRef, { role: newRole });
      alert('User role updated successfully!');
    } catch (error) {
      console.error("Error updating user role: ", error);
      alert('Error updating user role.');
    }
    setEditingUserId(null); // Exit editing mode
  };

  if (loading) {
    return <div className="text-center text-gray-500">Loading users...</div>;
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Manage User Roles</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Email</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>
                  {editingUserId === user.id ? (
                    <Select onValueChange={(newRole) => handleRoleChange(user.id, newRole)} defaultValue={user.role}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    user.role
                  )}
                </TableCell>
                <TableCell>
                  {editingUserId === user.id ? (
                    <Button variant="outline" onClick={() => setEditingUserId(null)}>Cancel</Button>
                  ) : (
                    <Button onClick={() => setEditingUserId(user.id)}>Change Role</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UserManagement;