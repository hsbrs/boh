'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, UserCheck, LogOut } from 'lucide-react';

const PendingApprovalPage = () => {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user is approved
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.isApproved) {
          // User is approved, redirect to dashboard
          router.push('/dashboard');
          return;
        }
        setUserEmail(userData.email || user.email || '');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Konto wartet auf Genehmigung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              Hallo <span className="font-semibold">{userEmail}</span>!
            </p>
            <p>
              Ihr Konto wurde erfolgreich erstellt, wartet aber derzeit auf die Genehmigung durch den Administrator.
              Sie können auf das Dashboard zugreifen, sobald ein Administrator Ihr Konto genehmigt hat.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <UserCheck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Was passiert als nächstes?</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Administrator überprüft Ihr Konto</li>
                  <li>• Sie erhalten Zugriff nach der Genehmigung</li>
                  <li>• Schauen Sie später wieder vorbei oder kontaktieren Sie Ihren Administrator</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex-1"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Abmelden
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Status prüfen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApprovalPage;
