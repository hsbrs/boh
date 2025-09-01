'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRightIcon, 
  CheckCircleIcon, 
  UsersIcon, 
  FolderOpenIcon, 
  BarChart3Icon, 
  ShieldIcon,
  ZapIcon,
  StarIcon
} from 'lucide-react';

const LandingPage = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <FolderOpenIcon className="h-8 w-8" />,
      title: "Projektmanagement",
      description: "Optimieren Sie Ihren Workflow mit umfassenden Projektverfolgungs- und Management-Tools."
    },
    {
      icon: <UsersIcon className="h-8 w-8" />,
      title: "Team-Zusammenarbeit",
      description: "Halten Sie Ihr Team verbunden und produktiv mit Echtzeit-Updates und Kommunikation."
    },
    {
      icon: <BarChart3Icon className="h-8 w-8" />,
      title: "Analysen & Einblicke",
      description: "Treffen Sie datenbasierte Entscheidungen mit leistungsstarken Analysen und Leistungsmetriken."
    }
  ];

  const benefits = [
    "Echtzeit-Projektverfolgung",
    "Rollenbasierte Zugriffskontrolle",
    "Mobile-responsive Design",
    "Sichere Datenverwaltung",
    "Anpassbare Workflows",
    "24/7 Systemverfügbarkeit"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-gray-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-gray-900/80 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                  <ZapIcon className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                Broos Project
              </span>
            </div>
            <nav className="flex items-center space-x-4">
              <Button variant="ghost" asChild className="text-gray-300 hover:text-white hover:bg-gray-800">
                <Link href="/login">
                  {isLoggedIn ? 'Dashboard' : 'Anmelden'}
                </Link>
              </Button>
              {!isLoggedIn && (
                <Button asChild className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800">
                  <Link href="/login">Registrieren</Link>
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center space-y-8">
            <div className="space-y-6">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-gray-800/50 text-gray-300 border-gray-700">
                <StarIcon className="h-4 w-4 mr-2 text-yellow-400" />
                Innovation. Zukunft
              </Badge>
              
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
                  Broos Field Service
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Transformieren Sie Ihre Außendienst-Operationen mit unserer umfassenden Projektmanagement-Plattform. 
                Optimieren Sie Workflows, verbessern Sie die Team-Zusammenarbeit und steigern Sie die Produktivität.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="px-8 py-6 text-lg bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-2xl hover:shadow-red-500/25 transition-all duration-300">
                <Link href={isLoggedIn ? '/dashboard' : '/login'}>
                  {isLoggedIn ? 'Zum Dashboard' : 'Kostenlos starten'}
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              {!isLoggedIn && (
                <Button variant="outline" size="lg" asChild className="px-8 py-6 text-lg border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
                  <Link href="/login">Demo ansehen</Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className={`relative overflow-hidden transition-all duration-500 cursor-pointer group ${
                  activeFeature === index 
                    ? 'bg-gradient-to-br from-gray-800 to-gray-700 border-red-500/50 shadow-2xl shadow-red-500/20' 
                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800/70'
                }`}
                onClick={() => setActiveFeature(index)}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                    activeFeature === index 
                      ? 'bg-gradient-to-r from-red-500 to-red-700 text-white shadow-lg' 
                      : 'bg-gray-700 text-gray-400 group-hover:text-red-400'
                  }`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold text-white">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400 text-center leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
                
                {activeFeature === index && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none"></div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <Badge variant="secondary" className="px-3 py-1 text-sm bg-red-500/20 text-red-400 border-red-500/30 mb-4">
                  Warum uns wählen
                </Badge>
                <h2 className="text-4xl font-bold text-white mb-6">
                  Entwickelt für moderne Außendienst-Teams
                </h2>
                <p className="text-lg text-gray-400 leading-relaxed">
                  Unsere Plattform wurde mit Außendienst-Profis im Blick entwickelt und bietet die Tools und Einblicke, 
                  die Sie benötigen, um außergewöhnlichen Service zu liefern und Ihr Geschäft zu erweitern.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button asChild size="lg" className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800">
                <Link href={isLoggedIn ? '/dashboard' : '/login'}>
                  Starten Sie Ihre Reise
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="relative">
              <Card className="bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600 p-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-600 rounded w-5/6"></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-20 bg-gray-600 rounded"></div>
                    <div className="h-20 bg-gray-600 rounded"></div>
                    <div className="h-20 bg-gray-600 rounded"></div>
                  </div>
                </div>
              </Card>
              
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-red-500 to-red-700 rounded-full opacity-20 blur-xl"></div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                  <ZapIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Broos Project</span>
              </div>
              <p className="text-gray-400 text-sm">
                Stärkung von Außendienst-Teams mit intelligenten Projektmanagement-Lösungen.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Produkt</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Funktionen</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Preise</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Integrationen</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Unternehmen</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Über uns</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Karriere</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Hilfe-Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Kontakt</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Broos Project. Alle Rechte vorbehalten.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Datenschutz</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">AGB</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
