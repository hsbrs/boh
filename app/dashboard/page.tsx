'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Link from 'next/link';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MapPin, UserCog, Package, Plane, ClipboardList } from 'lucide-react';
import { VacationStatsSkeleton, DashboardCardSkeleton } from '@/components/LoadingSkeletons';

const DashboardPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [vacationStats, setVacationStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        denied: 0
    });

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                router.push('/login');
            } else {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserRole(userDoc.data().role as string);
                }
                
                // Fetch vacation stats
                let q;
                if (userDoc.exists() && userDoc.data().role === 'employee') {
                    // Employees see only their own stats
                    q = query(collection(db, 'vacation_requests'), where('employeeId', '==', user.uid));
                } else {
                    // Managers, HR, and PM see all stats for oversight
                    q = query(collection(db, 'vacation_requests'));
                }
                
                const vacationUnsubscribe = onSnapshot(q, (snapshot) => {
                    const requests = snapshot.docs.map(doc => doc.data());
                    const stats = {
                        total: requests.length,
                        // Pending includes all non-final statuses (pending, hr_review, pm_review)
                        pending: requests.filter((r: any) => 
                            r.status === 'pending' || r.status === 'hr_review' || r.status === 'pm_review'
                        ).length,
                        approved: requests.filter((r: any) => r.status === 'approved').length,
                        denied: requests.filter((r: any) => r.status === 'denied').length
                    };
                    setVacationStats(stats);
                });
                
                setLoading(false);
                
                return () => {
                    vacationUnsubscribe();
                };
            }
        });
        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="flex-1 p-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="h-10 bg-gray-200 rounded-md animate-pulse w-80"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded-md animate-pulse w-96 mb-8"></div>
                
                {/* Vacation Status Loading */}
                <div className="mb-8">
                    <div className="h-8 bg-gray-200 rounded-md animate-pulse w-48 mb-4"></div>
                    <VacationStatsSkeleton />
                    <div className="mt-4 text-center">
                        <div className="h-4 bg-gray-200 rounded-md animate-pulse w-64 mx-auto mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded-md animate-pulse w-48 mx-auto"></div>
                    </div>
                </div>
        
                {/* Dashboard Cards Loading */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <DashboardCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin' || userRole === 'pm';
    const isAdmin = userRole === 'admin';

    return (
        <div className="flex-1 p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-gray-800">Willkommen zu Ihrem Dashboard!</h1>
            </div>
            
            <p className="text-gray-600 mb-8">Wählen Sie eine Option aus der Seitenleiste, um zu beginnen.</p>
            
            {/* Vacation Status Preview */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Urlaubsstatus</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-blue-50 border-blue-200 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer group">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-800 group-hover:text-blue-900 transition-colors duration-200">Gesamtanträge</p>
                                    <div className="flex items-center space-x-2">
                                        <p className="text-2xl font-bold text-blue-900 transition-all duration-300 ease-in-out group-hover:scale-110">{vacationStats.total}</p>
                                        {vacationStats.total > 0 && (
                                            <div className="w-16 bg-blue-200 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                                                    style={{ width: `${Math.min((vacationStats.total / Math.max(vacationStats.total, 10)) * 100, 100)}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Plane className="h-6 w-6 text-blue-500 transition-all duration-300 ease-in-out group-hover:rotate-12 group-hover:scale-110" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-yellow-50 border-yellow-200 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer group">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-yellow-800 group-hover:text-yellow-900 transition-colors duration-200">Ausstehend</p>
                                    <div className="flex items-center space-x-2">
                                        <p className="text-2xl font-bold text-yellow-900 transition-all duration-300 ease-in-out group-hover:scale-110">{vacationStats.pending}</p>
                                        {vacationStats.pending > 0 && (
                                            <div className="w-16 bg-yellow-200 rounded-full h-1.5 overflow-hidden">
                                                <div className="h-full bg-yellow-500 animate-pulse transition-all duration-500"/>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="h-6 w-6 rounded-full bg-yellow-400 transition-all duration-300 ease-in-out group-hover:animate-bounce"></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer group">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-800 group-hover:text-green-900 transition-colors duration-200">Genehmigt</p>
                                    <div className="flex items-center space-x-2">
                                        <p className="text-2xl font-bold text-green-900 transition-all duration-300 ease-in-out group-hover:scale-110">{vacationStats.approved}</p>
                                        {vacationStats.approved > 0 && (
                                            <div className="w-16 bg-green-200 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className="h-full bg-green-500 transition-all duration-1000 ease-out"
                                                    style={{ width: `${vacationStats.total > 0 ? (vacationStats.approved / vacationStats.total) * 100 : 0}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="h-6 w-6 rounded-full bg-green-400 transition-all duration-300 ease-in-out group-hover:animate-ping"></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-50 border-red-200 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer group">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-red-800 group-hover:text-red-900 transition-colors duration-200">Abgelehnt</p>
                                    <div className="flex items-center space-x-2">
                                        <p className="text-2xl font-bold text-red-900 transition-all duration-300 ease-in-out group-hover:scale-110">{vacationStats.denied}</p>
                                        {vacationStats.denied > 0 && (
                                            <div className="w-16 bg-red-200 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className="h-full bg-red-500 transition-all duration-1000 ease-out"
                                                    style={{ width: `${vacationStats.total > 0 ? (vacationStats.denied / vacationStats.total) * 100 : 0}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="h-6 w-6 rounded-full bg-red-400 transition-all duration-300 ease-in-out group-hover:animate-pulse"></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="mt-4 text-center">
                    {vacationStats.total === 0 ? (
                        <div className="text-gray-600 mb-2">
                            <p>Noch keine Urlaubsanträge. Bereit für etwas Zeit?</p>
                        </div>
                    ) : (
                        <div className="text-gray-600 mb-2">
                            <p>Sie haben {vacationStats.pending} ausstehende Anfrage{vacationStats.pending !== 1 ? 'n' : ''}</p>
                        </div>
                    )}
                    <Link href="/dashboard/vacation" className="text-teal-600 hover:text-teal-800 font-medium">
                        Vollständiges Urlaubs-Dashboard anzeigen →
                    </Link>
                </div>
            </div>
    
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Vacation Management */}
                <Link href="/dashboard/vacation" className="group">
                    <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out transform hover:-translate-y-1 border-l-4 border-l-teal-500 hover:border-l-teal-600 animate-fade-in-up">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-2xl font-bold group-hover:text-teal-700 transition-colors duration-200">Urlaub</CardTitle>
                            <Plane className="h-8 w-8 text-teal-500 transition-all duration-300 ease-in-out group-hover:rotate-12 group-hover:scale-110 group-hover:text-teal-600" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200">Urlaubsanträge einreichen und mit Genehmigungsworkflow verwalten.</p>
                            <div className="flex items-center mt-2 space-x-2">
                                <p className="text-sm font-semibold text-teal-600 group-hover:text-teal-700 transition-all duration-200">Zum Urlaub</p>
                                <span className="text-teal-600 group-hover:text-teal-700 transition-all duration-200 group-hover:translate-x-1">→</span>
                            </div>
                            {vacationStats.total > 0 && (
                                <div className="mt-3 pt-2 border-t border-teal-100">
                                    <div className="flex justify-between text-xs text-teal-600 mb-1">
                                        <span>Aktuelle Anträge: {vacationStats.total}</span>
                                        <span>Ausstehend: {vacationStats.pending}</span>
                                    </div>
                                    <div className="w-full bg-teal-100 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-1000 ease-out"
                                            style={{ width: `${vacationStats.total > 0 ? Math.min((vacationStats.approved / vacationStats.total) * 100, 100) : 0}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </Link>
                {isManagerOrAdmin && (
                    <>
                        {/* New Project Management Tile */}
                        <Link href="/dashboard/projects" className="group">
                            <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out transform hover:-translate-y-1 border-l-4 border-l-purple-500 hover:border-l-purple-600 animate-slide-in-left animate-delay-100">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-2xl font-bold group-hover:text-purple-700 transition-colors duration-200">Projektmanagement</CardTitle>
                                    <Package className="h-8 w-8 text-purple-500 transition-all duration-300 ease-in-out group-hover:rotate-12 group-hover:scale-110 group-hover:text-purple-600" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200">Projekte und ihren Status nach Stadt verwalten.</p>
                                    <div className="flex items-center mt-2 space-x-2">
                                        <p className="text-sm font-semibold text-purple-600 group-hover:text-purple-700 transition-all duration-200">Zu Projekten</p>
                                        <span className="text-purple-600 group-hover:text-purple-700 transition-all duration-200 group-hover:translate-x-1">→</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                        {/* WebGIS */}
                        <Link href="/dashboard/webgis" className="group">
                            <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out transform hover:-translate-y-1 border-l-4 border-l-green-500 hover:border-l-green-600 animate-slide-in-right animate-delay-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-2xl font-bold group-hover:text-green-700 transition-colors duration-200">WebGIS</CardTitle>
                                    <MapPin className="h-8 w-8 text-green-500 transition-all duration-300 ease-in-out group-hover:rotate-12 group-hover:scale-110 group-hover:text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200">Aufgabendaten auf einer interaktiven Karte visualisieren.</p>
                                    <div className="flex items-center mt-2 space-x-2">
                                        <p className="text-sm font-semibold text-green-600 group-hover:text-green-700 transition-all duration-200">Zu WebGIS</p>
                                        <span className="text-green-600 group-hover:text-green-700 transition-all duration-200 group-hover:translate-x-1">→</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                        {/* Reports */}
                        <Link href="/dashboard/reports" className="group">
                            <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out transform hover:-translate-y-1 border-l-4 border-l-red-500 hover:border-l-red-600 animate-fade-in-up animate-delay-300">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-2xl font-bold group-hover:text-red-700 transition-colors duration-200">Berichte</CardTitle>
                                    <FileText className="h-8 w-8 text-red-500 transition-all duration-300 ease-in-out group-hover:rotate-12 group-hover:scale-110 group-hover:text-red-600" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200">Detaillierte Berichte über die Leistung Ihres Teams abrufen.</p>
                                    <div className="flex items-center mt-2 space-x-2">
                                        <p className="text-sm font-semibold text-red-600 group-hover:text-red-700 transition-all duration-200">Zu Berichten</p>
                                        <span className="text-red-600 group-hover:text-red-700 transition-all duration-200 group-hover:translate-x-1">→</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                        {/* Work Orders */}
                        <Link href="/dashboard/work-orders" className="group">
                            <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out transform hover:-translate-y-1 border-l-4 border-l-orange-500 hover:border-l-orange-600 animate-slide-in-left animate-delay-400">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-2xl font-bold group-hover:text-orange-700 transition-colors duration-200">Work Orders</CardTitle>
                                    <ClipboardList className="h-8 w-8 text-orange-500 transition-all duration-300 ease-in-out group-hover:rotate-12 group-hover:scale-110 group-hover:text-orange-600" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200">Create and manage work orders for your projects.</p>
                                    <div className="flex items-center mt-2 space-x-2">
                                        <p className="text-sm font-semibold text-orange-600 group-hover:text-orange-700 transition-all duration-200">Zu Work Orders</p>
                                        <span className="text-orange-600 group-hover:text-orange-700 transition-all duration-200 group-hover:translate-x-1">→</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </>
                )}
                {isAdmin && (
                    <Link href="/dashboard/admin" className="group">
                        <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out transform hover:-translate-y-1 border-l-4 border-l-gray-500 hover:border-l-gray-600 animate-scale-in animate-delay-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-2xl font-bold group-hover:text-gray-700 transition-colors duration-200">Admin-Panel</CardTitle>
                                <UserCog className="h-8 w-8 text-gray-500 transition-all duration-300 ease-in-out group-hover:rotate-12 group-hover:scale-110 group-hover:text-gray-600" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200">Benutzerrollen und Systemeinstellungen verwalten.</p>
                                <div className="flex items-center mt-2 space-x-2">
                                    <p className="text-sm font-semibold text-gray-600 group-hover:text-gray-700 transition-all duration-200">Zum Admin-Panel</p>
                                    <span className="text-gray-600 group-hover:text-gray-700 transition-all duration-200 group-hover:translate-x-1">→</span>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;