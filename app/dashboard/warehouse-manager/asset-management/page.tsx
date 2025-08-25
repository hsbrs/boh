'use client';

import Link from 'next/link';
import React from 'react';

// Import sub-components for this page
import AssetForm from './AssetForm';
import AssetList from './AssetList';

const AssetManagementPage = () => {
    return (
        <div className="flex-1 p-8">
            <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
                <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                    Dashboard
                </Link>
                <span>/</span>
                <Link href="/dashboard/warehouse-manager" className="hover:text-blue-600 transition-colors">
                    Warehouse Management
                </Link>
                <span>/</span>
                <span>Asset Management</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-6">Asset Management</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AssetForm />
                <AssetList />
            </div>
        </div>
    );
};

export default AssetManagementPage;