'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, DocumentData, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React from 'react';

// Import all required shadcn/ui components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

type User = {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  jobTitle?: string;
  phoneNumber?: string;
  isApproved?: boolean;
  createdAt?: Date;
};

const roles = ['employee', 'manager', 'admin'];

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: string; } | null>(null);

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

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

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    const userDocRef = doc(db, 'users', editingUser.id);
    try {
      await updateDoc(userDocRef, {
        fullName: editingUser.fullName,
        jobTitle: editingUser.jobTitle,
        phoneNumber: editingUser.phoneNumber,
        role: editingUser.role,
      });
      showNotification('User details updated successfully!', 'success');
    } catch (error) {
      console.error("Error updating user: ", error);
      showNotification('Error updating user details.', 'error');
    }
    setEditingUser(null);
  };

  const handleApproveUser = async (userId: string) => {
    const userDocRef = doc(db, 'users', userId);
    try {
      await updateDoc(userDocRef, { isApproved: true });
      showNotification('User approved successfully!', 'success');
    } catch (error) {
      console.error("Error approving user: ", error);
      showNotification('Error approving user.', 'error');
    }
  };

  const handleDenyUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to deny this user? They will not be able to access the dashboard.")) {
      const userDocRef = doc(db, 'users', userId);
      try {
        await updateDoc(userDocRef, { isApproved: false });
        showNotification('User denied successfully!', 'success');
      } catch (error) {
        console.error("Error denying user: ", error);
        showNotification('Error denying user.', 'error');
      }
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      const userDocRef = doc(db, 'users', userId);
      try {
        await deleteDoc(userDocRef);
        showNotification('User deleted successfully!', 'success');
      } catch (error) {
        console.error("Error deleting user: ", error);
        showNotification('Error deleting user.', 'error');
      }
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500">Loading users...</div>;
  }

  return (
    <>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Manage User Roles & Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Email</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Approval Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.fullName || 'N/A'}</TableCell>
                  <TableCell>{user.jobTitle || 'N/A'}</TableCell>
                  <TableCell>{user.phoneNumber || 'N/A'}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isApproved === true 
                        ? 'bg-green-100 text-green-800' 
                        : user.isApproved === false 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.isApproved === true ? 'Approved' : user.isApproved === false ? 'Denied' : 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => setEditingUser(user)}>Edit</Button>
                      </DialogTrigger>
                      {editingUser && editingUser.id === user.id && (
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Edit User Details</DialogTitle>
                            <DialogDescription>
                              Make changes to {editingUser.email}'s profile here. Click save when you're done.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-1">
                              <Label htmlFor="fullName">Full Name</Label>
                              <Input
                                id="fullName"
                                value={editingUser.fullName}
                                onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="jobTitle">Job Title</Label>
                              <Input
                                id="jobTitle"
                                value={editingUser.jobTitle}
                                onChange={(e) => setEditingUser({ ...editingUser, jobTitle: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="phoneNumber">Phone Number</Label>
                              <Input
                                id="phoneNumber"
                                value={editingUser.phoneNumber}
                                onChange={(e) => setEditingUser({ ...editingUser, phoneNumber: e.target.value })}
                              />
                            </div>
                            <Separator className="my-2" />
                            <div className="space-y-1">
                              <Label htmlFor="role">Role</Label>
                              <Select onValueChange={(newRole) => setEditingUser({ ...editingUser, role: newRole })} defaultValue={editingUser.role}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map(role => (
                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button type="button" onClick={handleUpdateUser}>Save changes</Button>
                        </DialogContent>
                      )}
                    </Dialog>
                    {user.isApproved !== true && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleApproveUser(user.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                    )}
                    {user.isApproved === true && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDenyUser(user.id)}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Deny
                      </Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white transition-all duration-300 ease-in-out`}>
          {notification.message}
        </div>
      )}
    </>
  );
};

export default UserManagement;
