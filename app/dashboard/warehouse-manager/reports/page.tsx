'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot, query, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Link from 'next/link';
import React from 'react';

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Asset = {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    location: string;
};

const ReportsPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/login');
            } else {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserRole(userDoc.data().role as string);
                }
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    // Fetch assets for reporting
    useEffect(() => {
        const q = query(collection(db, 'warehouse_items'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const assetsArray: Asset[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as DocumentData),
            })) as Asset[];
            setAssets(assetsArray);
        }, (error) => {
            console.error("Error fetching assets: ", error);
        });

        return () => unsubscribe();
    }, []);
    
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="text-xl font-semibold text-gray-700">Laden...</div>
            </div>
        );
    }

    const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';

    // Restrict access for non-managers and non-admins
    if (!isManagerOrAdmin) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100 p-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
                    <p className="text-lg text-gray-700">Sie haben keine Berechtigung, diese Seite anzuzeigen.</p>
                    <Button asChild className="mt-6">
                        <Link href="/dashboard">Zum Dashboard</Link>
                    </Button>
                </div>
            </div>
        );
    }
    
    const totalAssets = assets.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = assets.filter(item => item.quantity <= 10);
    const uniqueItems = assets.length;

    return (
        <div className="flex-1 p-8">
            <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
                <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                    Dashboard
                </Link>
                <span>/</span>
                <Link href="/dashboard/warehouse-manager" className="hover:text-blue-600 transition-colors">
                    Lager
                </Link>
                <span>/</span>
                <span>Berichte</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-6">Lagerberichte</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Gesamtartikel</CardTitle>
                        <CardDescription>Alle Artikel auf Lager</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <span className="text-4xl font-bold">{totalAssets}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Einzelartikel</CardTitle>
                        <CardDescription>Anzahl der eindeutigen SKUs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <span className="text-4xl font-bold">{uniqueItems}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Niedriger Bestand</CardTitle>
                        <CardDescription>Artikel mit Menge {'<='} 10</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <span className="text-4xl font-bold text-red-500">{lowStockItems.length}</span>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Details zum niedrigen Bestand</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[300px] w-full pr-4">
                        {lowStockItems.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Menge</TableHead>
                                        <TableHead>Standort</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lowStockItems.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>{item.sku}</TableCell>
                                            <TableCell className="text-red-500 font-bold">{item.quantity}</TableCell>
                                            <TableCell>{item.location}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center text-gray-500 py-10">Keine Artikel mit niedrigem Bestand. Alles sieht gut aus!</div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
};

export default ReportsPage;