'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin } from 'lucide-react';

const WebGISPage = () => {
    // Static data for the three cities, with added HP details
    const citiesData = [
        {
            name: "Lippstadt Qgis Map:",
            active: 35,
            inactive: 15,
            completed: 40,
            total: 90,
            hp: 2258,
            mapUrl: "https://broos.pages.dev/Lippstadt/",
            imageUrl: "https://placehold.co/600x400/1e40af/ffffff?text=Lippstadt",
            hpDetails: {
                "LIPPS01/UDP001": 148, "LIPPS01/UDP002": 84, "LIPPS01/UDP003": 70, "LIPPS01/UDP004": 78,
                "LIPPS01/UDP007": 96, "LIPPS01/UDP008": 50, "LIPPS01/UDP009": 100, "LIPPS01/UDP010": 126,
                "LIPPS01/UDP012": 70, "LIPPS01/UDP027": 155, "LIPPS01/UDP028": 67, "LIPPS01/UDP029": 49,
                "LIPPS01/UDP061": 124, "LIPPS01/UDP062": 67, "LIPPS01/UDP083": 194, "LIPPS01/UDP084": 187,
                "LIPPS01/UDP097": 72, "LIPPS01/UDP098": 60, "LIPPS01/UDP099": 75, "LIPPS01/UDP100": 78,
                "LIPPS01/UDP101": 78, "LIPPS01/UDP102": 61, "LIPPS01/UDP103": 131, "LIPPS01/UDP104": 78,
                "LIPPS01/UDP105": 83, "LIPPS01/UDP106": 80, "LIPPS01/UDP107": 112, "LIPPS01/UDP108": 105
            }
        },
        {
            name: "Herzogenrath Qgis Map:",
            active: 20,
            inactive: 10,
            completed: 55,
            total: 85,
            hp: 85,
            mapUrl: "https://broos.pages.dev/Herzogenrath",
            imageUrl: "https://placehold.co/600x400/991b1f/ffffff?text=Herzogenrath",
            hpDetails: { "HERZG01/UDP121": 85 }
        },
        {
            name: "Emmerich Qgis Map:",
            active: 5,
            inactive: 5,
            completed: 85,
            total: 95,
            hp: 1003,
            mapUrl: "https://broos.pages.dev/Emmerich",
            imageUrl: "https://placehold.co/600x400/0d9488/ffffff?text=Emmerich",
            hpDetails: {
                "EMMRC01/UDP066": 146, "EMMRC01/UDP067": 108, "EMMRC01/UDP068": 135, "EMMRC01/UDP069": 104,
                "EMMRC01/UDP070": 105, "EMMRC01/UDP071": 76, "EMMRC01/UDP072": 115, "EMMRC01/UDP073": 111,
                "EMMRC01/UDP074": 103
            }
        }
    ];

    return (
        <div className="w-full max-w-7xl mx-auto p-4">
            <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
                <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                    Dashboard
                </Link>
                <span>/</span>
                <span>WebGIS</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-6">WebGIS: City Status Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {citiesData.map((city, index) => (
                    <Card key={index} className="overflow-hidden hover:shadow-xl transition-shadow">
                        <img src={city.imageUrl} alt={`Image of ${city.name}`} className="w-full h-48 object-cover" />
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{city.name}</span>
                                <Link href={city.mapUrl} className="text-blue-600 hover:text-blue-800 transition-colors" target="_blank" rel="noopener noreferrer">
                                    <MapPin className="h-6 w-6" />
                                </Link>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-gray-100 rounded-lg p-4 text-left">
                                <CardDescription className="font-semibold text-lg mb-2 text-gray-800">Status Overview:</CardDescription>
                                <p className="text-sm flex justify-between">
                                    <span className="text-gray-900">UDP Active:</span> <span className="font-bold text-green-600">{city.active}</span>
                                </p>
                                <p className="text-sm flex justify-between">
                                    <span className="text-gray-900">UDP Inactive:</span> <span className="font-bold text-yellow-600">{city.inactive}</span>
                                </p>
                                <p className="text-sm flex justify-between">
                                    <span className="text-gray-900">UDP Completed:</span> <span className="font-bold text-blue-600">{city.completed}</span>
                                </p>
                                <div className="mt-2 pt-2 border-t border-gray-300 flex justify-between">
                                    <p className="text-sm font-semibold">Total UDP:</p> <span className="font-bold text-gray-800">{city.total}</span>
                                </div>
                            </div>
                            <div className="bg-gray-100 rounded-lg p-4 text-left">
                                <CardDescription className="font-semibold text-lg mb-2 text-gray-800">Billed HP:</CardDescription>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-semibold">Total Billed HP:</p> <span className="font-bold text-gray-800">{city.hp}</span>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="link" size="sm" className="text-blue-600">Details</Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle className="text-2xl font-bold">{city.name} - Billed HP Details</DialogTitle>
                                            </DialogHeader>
                                            <ScrollArea className="h-[300px] w-full pr-4">
                                                <div className="grid gap-4 py-4">
                                                    {Object.entries(city.hpDetails).map(([key, value]) => (
                                                        <div key={key} className="flex justify-between items-center">
                                                            <span className="text-gray-900">{key}:</span>
                                                            <span className="font-semibold text-gray-800">{value} HP</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default WebGISPage;