'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import React from 'react';
import { Button } from '@/components/ui/button';

const LandingPage = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Header */}
      <header className="py-4 px-8 flex justify-between items-center bg-gray-900 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          {/* Logo - Placeholder */}
          <svg width="40" height="40" viewBox="0 0 100 100" className="rotate-45">
            <path d="M50,0 C77.6,0 100,22.4 100,50 C100,77.6 77.6,100 50,100 C22.4,100 0,77.6 0,50 C0,22.4 22.4,0 50,0 Z" 
                  fill="url(#redGradient)" />
            <defs>
              <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{stopColor: 'rgb(255,0,0)', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: 'rgb(128,0,0)', stopOpacity: 1}} />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-2xl font-bold">Field Service</span>
        </div>
        <nav>
          <Button variant="ghost" asChild>
            <Link href="/login">
              {isLoggedIn ? 'Dashboard' : 'Login'}
            </Link>
          </Button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4 text-center">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-red-800 animate-pulse">
            Your Field Service, Optimized.
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto">
            Manage your projects, track your team, and streamline your workflow with our powerful,
            easy-to-use platform.
          </p>
          <Button asChild className="mt-8 px-8 py-6 rounded-full text-lg shadow-md hover:shadow-lg transition-shadow">
            <Link href={isLoggedIn ? '/dashboard' : '/login'}>
              {isLoggedIn ? 'Go to Dashboard' : 'Get Started'}
            </Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Field Service. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
