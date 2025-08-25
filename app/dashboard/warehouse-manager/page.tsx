'use client';

import Link from 'next/link';
import React from 'react';

// Import shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, BarChart2, Truck } from 'lucide-react';

const WarehouseManagerPage = () => {

    return (
        <div className="flex-1 p-8">
            <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
                <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                    Dashboard
                </Link>
                <span>/</span>
                <span>Warehouse Management</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-6">Warehouse Management</h1>
            <p className="text-gray-600 mb-8">Select a section to manage warehouse assets and inventory.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/dashboard/warehouse-manager/asset-management">
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-2xl font-bold">Asset Management</CardTitle>
                            <Package className="h-8 w-8 text-cyan-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500">Add, view, and modify all assets in the warehouse.</p>
                            <p className="text-sm font-semibold text-cyan-600 mt-2">Go to Asset Management →</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/dashboard/warehouse-manager/reports">
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-2xl font-bold">Reports</CardTitle>
                            <BarChart2 className="h-8 w-8 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500">View reports on stock levels and inventory value.</p>
                            <p className="text-sm font-semibold text-orange-600 mt-2">Go to Reports →</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/dashboard/warehouse-manager/stock-updater">
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-2xl font-bold">Stock Updater</CardTitle>
                            <Truck className="h-8 w-8 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500">Quickly add or remove stock from existing assets.</p>
                            <p className="text-sm font-semibold text-indigo-600 mt-2">Go to Stock Updater →</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
};

export default WarehouseManagerPage;