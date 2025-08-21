'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection } from 'firebase/firestore'; // Import 'doc' and 'setDoc'
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
  const router = useRouter();
  
  const handleAuthAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Login successful!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Use setDoc to create a document with the user's UID as the document ID
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: 'employee', // Assign the default role
        });
        alert('Sign up successful!');
      }
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        alert('Authentication error: ' + error.message);
      } else {
        alert('An unknown error occurred.');
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
    </div>
  );
};

export default LoginPage;