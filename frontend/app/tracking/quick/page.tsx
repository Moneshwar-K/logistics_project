'use client';

import React, { useState } from 'react';
import { Search, MapPin, Box, Calendar, User, ArrowRight, Loader2, Truck, PackageCheck, FileText, Clock, Building2 } from 'lucide-react';
import { apiService } from '@/lib/api';

export default function QuickTrackingPage() {
  const [hawbNumber, setHawbNumber] = useState('');
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hawbNumber.trim()) return;
    setLoading(true);
    setError('');
    setShipment(null);

    try {
      const response = await apiService.listShipments({ limit: 50 } as any);
      const data = response?.data || [];
      const found = data.find((s: any) =>
        (s.hawb || '').toLowerCase() === hawbNumber.toLowerCase() ||
        (s.hawb || '').toLowerCase().includes(hawbNumber.toLowerCase())
      );
      if (found) {
        setShipment(found);
      } else {
        setError('No shipment found with this HAWB number');
      }
    } catch (err) {
      setError('Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
    return steps.indexOf(status);
  };

  const statusSteps = [
    { key: 'pending', label: 'Booked', icon: <Box className="w-5 h-5" /> },
    { key: 'picked_up', label: 'Picked Up', icon: <Truck className="w-5 h-5" /> },
    { key: 'in_transit', label: 'In Transit', icon: <ArrowRight className="w-5 h-5" /> },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: <Truck className="w-5 h-5" /> },
    { key: 'delivered', label: 'Delivered', icon: <PackageCheck className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 flex flex-col">
      {/* Header */}
      <div className="p-6 md:p-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Track Your Shipment</h1>
        <p className="text-indigo-300 text-sm">Enter your HAWB number to get real-time tracking updates</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto w-full px-4 mb-8">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              value={hawbNumber}
              onChange={e => setHawbNumber(e.target.value)}
              placeholder="Enter HAWB Number"
              className="w-full h-14 pl-12 pr-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-slate-400 text-lg font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <button type="submit" disabled={loading} className="h-14 px-8 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Track
          </button>
        </div>
      </form>

      {error && (
        <div className="max-w-xl mx-auto w-full px-4 mb-6">
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-center text-red-300">{error}</div>
        </div>
      )}

      {shipment && (
        <div className="max-w-4xl mx-auto w-full px-4 pb-10 space-y-6">
          {/* Progress Bar */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center relative mb-2">
              {statusSteps.map((step, i) => {
                const currentStep = getStatusStep(shipment.status);
                const isActive = i <= currentStep;
                const isCurrent = i === currentStep;
                return (
                  <div key={step.key} className="flex flex-col items-center z-10 relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCurrent ? 'bg-indigo-500 ring-4 ring-indigo-500/30 text-white' : isActive ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-500'}`}>
                      {step.icon}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${isActive ? 'text-white' : 'text-slate-500'}`}>{step.label}</span>
                  </div>
                );
              })}
              {/* Progress line */}
              <div className="absolute top-6 left-6 right-6 h-1 bg-white/10 rounded-full">
                <div className="h-1 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-700" style={{ width: `${Math.max(0, (getStatusStep(shipment.status) / 4) * 100)}%` }} />
              </div>
            </div>
          </div>

          {/* Shipment Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
              <h3 className="text-sm text-indigo-300 font-semibold uppercase mb-3">Shipment Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-400 text-xs block">HAWB No</span><span className="text-white font-mono font-bold text-base">{shipment.hawb}</span></div>
                <div><span className="text-slate-400 text-xs block">Booking Date</span><span className="text-white">{new Date(shipment.created_at).toLocaleDateString('en-IN')}</span></div>
                <div><span className="text-slate-400 text-xs block">Service Type</span><span className="text-white capitalize">{shipment.service_type || '—'}</span></div>
                <div><span className="text-slate-400 text-xs block">Status</span><span className="text-emerald-400 font-semibold capitalize">{shipment.status?.replace(/_/g, ' ')}</span></div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
              <h3 className="text-sm text-indigo-300 font-semibold uppercase mb-3">Route Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-400 text-xs block flex items-center gap-1"><Building2 className="w-3 h-3" /> Origin</span><span className="text-white font-medium">{shipment.origin_city || '—'}</span></div>
                <div><span className="text-slate-400 text-xs block flex items-center gap-1"><MapPin className="w-3 h-3" /> Destination</span><span className="text-white font-medium">{shipment.destination_city || '—'}</span></div>
                <div><span className="text-slate-400 text-xs block">Pieces</span><span className="text-white font-bold">{shipment.total_cartons || 0}</span></div>
                <div><span className="text-slate-400 text-xs block">Weight</span><span className="text-white font-bold">{shipment.total_weight || 0} kg</span></div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
              <h3 className="text-sm text-indigo-300 font-semibold uppercase mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Shipper</h3>
              <p className="text-white font-medium">{shipment.shipper_id?.name || '—'}</p>
              <p className="text-slate-400 text-xs mt-1">{shipment.shipper_id?.address || ''}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
              <h3 className="text-sm text-indigo-300 font-semibold uppercase mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Consignee</h3>
              <p className="text-white font-medium">{shipment.consignee_id?.name || '—'}</p>
              <p className="text-slate-400 text-xs mt-1">{shipment.consignee_id?.address || ''}</p>
            </div>
          </div>

          {/* Transit Date Section */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
            <h3 className="text-sm text-indigo-300 font-semibold uppercase mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Transit Timeline</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-slate-400 text-xs block">Booking Date</span><span className="text-white">{new Date(shipment.created_at).toLocaleDateString('en-IN')}</span></div>
              <div><span className="text-slate-400 text-xs block">Expected Delivery</span><span className="text-white">{shipment.expected_delivery_date ? new Date(shipment.expected_delivery_date).toLocaleDateString('en-IN') : '—'}</span></div>
              <div><span className="text-slate-400 text-xs block">Transit Days</span><span className="text-white font-bold">{shipment.expected_delivery_date ? Math.ceil((new Date(shipment.expected_delivery_date).getTime() - new Date(shipment.created_at).getTime()) / 86400000) : '—'}</span></div>
              <div><span className="text-slate-400 text-xs block">Actual Delivery</span><span className={`font-medium ${shipment.status === 'delivered' ? 'text-emerald-400' : 'text-slate-500'}`}>{shipment.status === 'delivered' ? 'Delivered' : 'In Progress'}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
