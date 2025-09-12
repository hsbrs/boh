'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Link from 'next/link';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MapPin, UserCog, Package, Plane } from 'lucide-react';

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
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="text-xl font-semibold text-gray-700">Laden...</div>
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
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-800">Gesamtanträge</p>
                                    <p className="text-2xl font-bold text-blue-900">{vacationStats.total}</p>
                                </div>
                                <Plane className="h-6 w-6 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-yellow-50 border-yellow-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-yellow-800">Ausstehend</p>
                                    <p className="text-2xl font-bold text-yellow-900">{vacationStats.pending}</p>
                                </div>
                                <div className="h-6 w-6 rounded-full bg-yellow-400"></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-800">Genehmigt</p>
                                    <p className="text-2xl font-bold text-green-900">{vacationStats.approved}</p>
                                </div>
                                <div className="h-6 w-6 rounded-full bg-green-400"></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-50 border-red-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-red-800">Abgelehnt</p>
                                    <p className="text-2xl font-bold text-red-900">{vacationStats.denied}</p>
                                </div>
                                <div className="h-6 w-6 rounded-full bg-red-400"></div>
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
                <Link href="/dashboard/vacation">
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-2xl font-bold">Urlaub</CardTitle>
                            <Plane className="h-8 w-8 text-teal-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500">Urlaubsanträge einreichen und mit Genehmigungsworkflow verwalten.</p>
                            <p className="text-sm font-semibold text-teal-600 mt-2">Zum Urlaub →</p>
                        </CardContent>
                    </Card>
                </Link>
                {isManagerOrAdmin && (
                    <>
                        {/* New Project Management Tile */}
                        <Link href="/dashboard/projects">
                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-2xl font-bold">Projektmanagement</CardTitle>
                                    <Package className="h-8 w-8 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-500">Projekte und ihren Status nach Stadt verwalten.</p>
                                    <p className="text-sm font-semibold text-purple-600 mt-2">Zu Projekten →</p>
                                </CardContent>
                            </Card>
                        </Link>
                        {/* WebGIS */}
                        <Link href="/dashboard/webgis">
                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-2xl font-bold">WebGIS</CardTitle>
                                    <MapPin className="h-8 w-8 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-500">Aufgabendaten auf einer interaktiven Karte visualisieren.</p>
                                    <p className="text-sm font-semibold text-green-600 mt-2">Zu WebGIS →</p>
                                </CardContent>
                            </Card>
                        </Link>
                        {/* Reports */}
                        <Link href="/dashboard/reports">
                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-2xl font-bold">Berichte</CardTitle>
                                    <FileText className="h-8 w-8 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-500">Detaillierte Berichte über die Leistung Ihres Teams abrufen.</p>
                                    <p className="text-sm font-semibold text-red-600 mt-2">Zu Berichten →</p>
                                </CardContent>
                            </Card>
                        </Link>
                    </>
                )}
                {isAdmin && (
                    <Link href="/dashboard/admin">
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-2xl font-bold">Admin-Panel</CardTitle>
                                <UserCog className="h-8 w-8 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500">Benutzerrollen und Systemeinstellungen verwalten.</p>
                                <p className="text-sm font-semibold text-gray-600 mt-2">Zum Admin-Panel →</p>
                            </CardContent>
                        </Card>
                    </Link>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;