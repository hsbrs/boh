'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const LandingPage = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check the user's login state to change the CTA button
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
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="py-4 px-8 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {/* Logo - Placeholder for your red and black logo */}
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
          <span className="text-2xl font-bold">Broos Project</span>
        </div>
        <nav>
          <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
            {isLoggedIn ? 'Dashboard' : 'Login'}
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800 animate-pulse">
            Broos Project Field Service
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-8">
            Manage your projects, track your team, and streamline your workflow.
          </p>
          <Link href={isLoggedIn ? '/dashboard' : '/login'}
            className="inline-block bg-red-600 text-white font-bold py-3 px-8 rounded-full shadow-lg
            hover:bg-red-700 transition-all duration-300 transform hover:scale-105 focus:outline-none
            focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            {isLoggedIn ? 'Go to Dashboard' : 'Get Started'}
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Broos Project. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
