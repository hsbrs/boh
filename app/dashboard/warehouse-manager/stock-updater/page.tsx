'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot, query, DocumentData, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Link from 'next/link';
import React from 'react';

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Asset = {
    id: string;
    name: string;
    sku: string;
    quantity: number;
};

const StockUpdaterPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [selectedAssetId, setSelectedAssetId] = useState('');
    const [quantityChange, setQuantityChange] = useState(0);
    const [notification, setNotification] = useState<{ message: string; type: string; } | null>(null);

    const showNotification = (message: string, type: string) => {
      setNotification({ message, type });
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    };

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

    // Fetch assets from Firestore
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
    
    const handleUpdateStock = async (isAdding: boolean) => {
        if (!selectedAssetId) {
            showNotification('Please select an asset to update.', 'error');
            return;
        }
        if (quantityChange <= 0) {
            showNotification('Quantity must be a positive number.', 'error');
            return;
        }

        const selectedAsset = assets.find(asset => asset.id === selectedAssetId);
        if (!selectedAsset) return;

        let newQuantity = selectedAsset.quantity;
        if (isAdding) {
            newQuantity = selectedAsset.quantity + quantityChange;
        } else {
            newQuantity = selectedAsset.quantity - quantityChange;
        }

        if (newQuantity < 0) {
            showNotification('Resulting quantity cannot be negative.', 'error');
            return;
        }

        const assetDocRef = doc(db, 'warehouse_items', selectedAssetId);
        try {
            await updateDoc(assetDocRef, {
                quantity: newQuantity,
                lastUpdated: new Date(),
            });
            setQuantityChange(0);
            showNotification('Stock updated successfully!', 'success');
        } catch (error) {
            console.error("Error updating stock: ", error);
            showNotification('Error updating stock.', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="text-xl font-semibold text-gray-700">Loading...</div>
            </div>
        );
    }

    const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';

    // Restrict access for non-managers and non-admins
    if (!isManagerOrAdmin) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100 p-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
                    <p className="text-lg text-gray-700">You do not have permission to view this page.</p>
                    <Button asChild className="mt-6">
                        <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex-1 p-8">
            <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
                <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                    Dashboard
                </Link>
                <span>/</span>
                <Link href="/dashboard/warehouse-manager" className="hover:text-blue-600 transition-colors">
                    Warehouse
                </Link>
                <span>/</span>
                <span>Stock Updater</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-6">Stock Updater</h1>
            <Card className="w-full max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl">Update Stock Quantity</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="asset-select">Select Asset</Label>
                            <Select onValueChange={setSelectedAssetId} value={selectedAssetId}>
                                <SelectTrigger id="asset-select">
                                    <SelectValue placeholder="Choose an asset" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assets.map((asset) => (
                                        <SelectItem key={asset.id} value={asset.id}>
                                            {asset.name} ({asset.sku})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="quantity-change">Quantity</Label>
                            <Input
                                id="quantity-change"
                                type="number"
                                placeholder="e.g., 10"
                                value={quantityChange}
                                onChange={(e) => setQuantityChange(parseInt(e.target.value))}
                                min="0"
                                required
                            />
                        </div>
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleUpdateStock(true)}
                                className="flex-1"
                            >
                                In
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => handleUpdateStock(false)}
                                className="flex-1"
                            >
                                Out
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
            {notification && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white transition-all duration-300 ease-in-out`}>
                    {notification.message}
                </div>
            )}
        </div>
    );
};

export default StockUpdaterPage;