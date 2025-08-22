'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, DocumentData, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Asset = {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    location: string;
    lastUpdated: any;
    lastUpdatedBy: string;
};

type UserProfile = {
    email: string;
    name: string;
};

const AssetList = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [users, setUsers] = useState<Map<string, UserProfile>>(new Map());
    const [loading, setLoading] = useState(true);

    // Fetch users once on component mount
    useEffect(() => {
        const usersQuery = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
            const usersMap = new Map<string, UserProfile>();
            snapshot.docs.forEach(doc => {
                const data = doc.data() as DocumentData;
                usersMap.set(data.email, {
                    email: data.email,
                    name: data.email.split('@')[0] || data.email,
                });
            });
            setUsers(usersMap);
            // After fetching users, we can proceed to fetch assets.
            // This prevents the race condition.
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch assets from Firestore
    useEffect(() => {
      // We only run this effect after users have been fetched to avoid the race condition
      if (loading) return;
      
      const q = query(collection(db, 'warehouse_items'), orderBy('name', 'asc'));
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
    }, [loading]);

    if (loading) {
        return <div className="text-center text-gray-500">Loading assets...</div>;
    }

    return (
        <Card className="p-6 shadow-md">
            <CardContent className="p-0">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Assets</h3>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead>Last Updated By</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assets.map(asset => (
                                <TableRow key={asset.id}>
                                    <TableCell className="font-medium">{asset.name}</TableCell>
                                    <TableCell>{asset.sku}</TableCell>
                                    <TableCell>{asset.quantity}</TableCell>
                                    <TableCell>{asset.location}</TableCell>
                                    <TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span>{asset.lastUpdated.toDate().toLocaleDateString()}</span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {asset.lastUpdated.toDate().toLocaleString()}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell>
                                      {users.get(asset.lastUpdatedBy)?.name || asset.lastUpdatedBy}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default AssetList;