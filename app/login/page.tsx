'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Check if user is approved
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.isApproved === false) {
            showNotification('Ihr Konto wartet auf die Genehmigung durch den Administrator.', 'error');
            router.push('/pending-approval');
            return;
          }
        }
        
        showNotification('Anmeldung erfolgreich!', 'success');
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
          isApproved: false, // New field - user needs admin approval
          createdAt: new Date(), // Track when user was created
        });
        
        showNotification('Registrierung erfolgreich! Bitte warten Sie auf die Genehmigung durch den Administrator.', 'success');
        router.push('/pending-approval');
      }
    } catch (error) {
      if (error instanceof Error) {
        showNotification('Authentifizierungsfehler: ' + error.message, 'error');
      } else {
        showNotification('Ein unbekannter Fehler ist aufgetreten.', 'error');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {isLoginMode ? 'Anmeldung' : 'Registrierung'}
        </h2>

        <form onSubmit={handleAuthAction}>
          <div className="mb-4">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="Ihre E-Mail-Adresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              type="password"
              placeholder="Ihr Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            {isLoginMode ? 'Anmelden' : 'Registrieren'}
          </Button>
        </form>

        <div className="mt-6 text-center text-gray-600">
          <Button
            variant="link"
            onClick={() => setIsLoginMode(!isLoginMode)}
          >
            {isLoginMode ? 'Benötigen Sie ein Konto? Registrieren' : 'Haben Sie bereits ein Konto? Anmelden'}
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