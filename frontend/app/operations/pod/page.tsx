'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Search, CheckCircle, XCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

export default function PODPage() {
  const [hawb, setHawb] = useState('');
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!hawb) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      // Try HAWB-specific endpoint first, fallback to search
      let res = await fetch(`${API_BASE}/shipments/hawb/${hawb.toUpperCase()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        res = await fetch(`${API_BASE}/shipments/search?hawb=${hawb}`, { headers: { Authorization: `Bearer ${token}` } });
      }
      const json = await res.json();
      if (json.data && !Array.isArray(json.data)) {
        setShipment(json.data);
      } else if (Array.isArray(json.data) && json.data.length > 0) {
        setShipment(json.data[0]);
      } else {
        alert('Shipment not found. Please check the HAWB number.');
      }
    } catch (e) {
      alert('Error searching for shipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: 'delivered' | 'exception') => {
    if (!shipment) return;
    try {
      const res = await fetch(`${API_BASE}/shipments/${shipment._id}/pod`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        alert(`Shipment marked as ${status.toUpperCase()} successfully!`);
        setShipment({ ...shipment, status });
      } else {
        const err = await res.json();
        alert(`Failed to update status: ${err.message || 'Unknown error'}`);
      }
    } catch (e) {
      alert('Failed to connect to the server. Please check your connection.');
    }
  };

  return (
    <MainLayout title="Proof of Delivery">
      <div className="p-6 max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Update Delivery Status</h1>
          <p className="text-muted-foreground">Search by HAWB to update POD</p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter HAWB Number"
            className="flex-1 border rounded-lg px-4 py-3 text-lg"
            value={hawb}
            onChange={e => setHawb(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={loading} className="bg-primary text-primary-foreground px-6 rounded-lg font-bold">Search</button>
        </div>

        {shipment && (
          <div className="bg-card border border-border p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Shipment</p>
                <h2 className="text-2xl font-bold font-mono">{shipment.hawb}</h2>
              </div>
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-bold uppercase">{shipment.status.replace('_', ' ')}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div><p className="text-xs text-muted-foreground">Consignee</p><p className="font-medium">{shipment.consignee_id?.name}</p></div>
              <div><p className="text-xs text-muted-foreground">Destination</p><p className="font-medium">{shipment.destination_city}</p></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => updateStatus('delivered')} className="flex items-center justify-center gap-2 p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all">
                <CheckCircle className="w-6 h-6" />
                <span className="font-bold">Mark Delivered</span>
              </button>
              <button onClick={() => updateStatus('exception')} className="flex items-center justify-center gap-2 p-4 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all">
                <XCircle className="w-6 h-6" />
                <span className="font-bold">Mark Undelivered</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
