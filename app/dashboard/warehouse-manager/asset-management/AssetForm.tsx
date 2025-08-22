'use client';

import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React from 'react';
import { auth } from '@/lib/firebase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const AssetForm = () => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [location, setLocation] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: string; } | null>(null);

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      showNotification('You must be logged in to add an asset.', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'warehouse_items'), {
        name,
        sku,
        quantity: Number(quantity),
        location,
        lastUpdated: new Date(),
        lastUpdatedBy: user.email,
      });
      setName('');
      setSku('');
      setQuantity(0);
      setLocation('');
      showNotification('Asset added successfully!', 'success');
    } catch (error) {
      console.error("Error adding asset: ", error);
      showNotification('Error adding asset.', 'error');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <h3 className="text-xl font-semibold text-gray-800">Add New Asset</h3>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Asset Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="0"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full">
          Add Asset
        </Button>
      </form>

      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white transition-all duration-300 ease-in-out`}>
          {notification.message}
        </div>
      )}
    </>
  );
};

export default AssetForm;