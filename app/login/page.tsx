'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import React from 'react';

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: string; } | null>(null);
  const router = useRouter();

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };
  
  const handleAuthAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (isLoginMode) {
        // Log-in logic
        await signInWithEmailAndPassword(auth, email, password);
        showNotification('Login successful!', 'success');
        router.push('/dashboard');
      } else {
        // Sign-up logic to create a user in Firebase Auth and Firestore
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userDocRef = doc(db, 'users', user.uid);
        
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          role: 'employee', // Assign a default role
          fullName: '', // New field, initially empty
          jobTitle: '', // New field, initially empty
          phoneNumber: '', // New field, initially empty
        });
        
        showNotification('Sign up successful!', 'success');
        router.push('/dashboard');
      }
    } catch (error) {
      if (error instanceof Error) {
        showNotification('Authentication error: ' + error.message, 'error');
      } else {
        showNotification('An unknown error occurred.', 'error');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {isLoginMode ? 'Login' : 'Sign Up'}
        </h2>

        <form onSubmit={handleAuthAction}>
          <div className="mb-4">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            {isLoginMode ? 'Login' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-6 text-center text-gray-600">
          <Button
            variant="link"
            onClick={() => setIsLoginMode(!isLoginMode)}
          >
            {isLoginMode ? 'Need an account? Sign Up' : 'Already have an account? Login'}
          </Button>
        </div>
      </div>
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white transition-all duration-300 ease-in-out`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default LoginPage;