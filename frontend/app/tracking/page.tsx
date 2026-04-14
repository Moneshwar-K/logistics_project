'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  MapPin, Search, Loader2, AlertCircle, CheckCircle, Clock, Package,
  TrendingUp, FileText, Eye, Truck, ArrowRight, Building2,
  Calendar, User, Download
} from 'lucide-react';
import type { Shipment } from '@/types/logistics';
import { apiService } from '@/lib/api';

interface TrackingEvent {
  id: string;
  timestamp: string;
  location: string;
  status: string;
  description: string;
}

export default function TrackingPage() {
  const [hawbNumber, setHawbNumber] = useState('');
  const [shipment, setShipment] = useState<any>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeDocTab, setActiveDocTab] = useState<'timeline' | 'documents'>('timeline');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hawbNumber.trim()) return;
    setLoading(true);
    setError('');

    try {
      const response = await apiService.listShipments({ limit: 50 } as any);
      const data = response?.data || [];
      const found = data.find((s: any) =>
        (s.hawb || '').toLowerCase() === hawbNumber.toLowerCase() ||
        (s.hawb || '').toLowerCase().includes(hawbNumber.toLowerCase())
      );

      if (found) {
        setShipment(found);
        // Generate transit timeline events based on status
        const statuses = ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
        const labels = ['Booked', 'Picked Up', 'Hub Received / In Transit', 'Out for Delivery', 'Delivered'];
        const currentIdx = statuses.indexOf(found.status);
        const generatedEvents: TrackingEvent[] = [];
        const bookingDate = new Date(found.created_at);

        for (let i = 0; i <= Math.min(currentIdx, statuses.length - 1); i++) {
          const eventDate = new Date(bookingDate);
          eventDate.setDate(eventDate.getDate() + i);
          generatedEvents.push({
            id: `evt-${i}`,
            timestamp: eventDate.toISOString(),
            location: i === 0 ? (found.origin_city || 'Origin') : i === statuses.length - 1 ? (found.destination_city || 'Destination') : 'Transit Hub',
            status: labels[i],
            description: `Shipment ${labels[i].toLowerCase()} at ${i === 0 ? found.origin_city : found.destination_city || 'hub'}`,
          });
        }
        setEvents(generatedEvents.reverse());
      } else {
        setError('Shipment not found');
        setShipment(null);
        setEvents([]);
      }
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes('Delivered')) return 'text-emerald-500';
    if (status.includes('Transit') || status.includes('Picked')) return 'text-blue-500';
    if (status.includes('Out for')) return 'text-purple-500';
    return 'text-amber-500';
  };

  return (
    <MainLayout title="Full Tracking">
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Shipment Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">Track shipments with detailed transit timeline and documents</p>
        </div>

        {/* Search */}
        <Card className="p-4 mb-6 border-border bg-card">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 max-w-lg relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                value={hawbNumber}
                onChange={e => setHawbNumber(e.target.value)}
                placeholder="Enter HAWB number"
                className="w-full h-11 pl-11 pr-4 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button type="submit" disabled={loading} className="h-11 px-6 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Track
            </button>
          </form>
        </Card>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        {shipment && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Shipment Info + Documents */}
            <div className="lg:col-span-2 space-y-4">
              {/* Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-3 border-border bg-card">
                  <p className="text-xs text-muted-foreground">HAWB No</p>
                  <p className="text-lg font-mono font-bold text-primary">{shipment.hawb}</p>
                </Card>
                <Card className="p-3 border-border bg-card">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-lg font-bold text-emerald-600 capitalize">{shipment.status?.replace(/_/g, ' ')}</p>
                </Card>
                <Card className="p-3 border-border bg-card">
                  <p className="text-xs text-muted-foreground">Route</p>
                  <p className="text-sm font-medium">{shipment.origin_city || '—'} → {shipment.destination_city || '—'}</p>
                </Card>
                <Card className="p-3 border-border bg-card">
                  <p className="text-xs text-muted-foreground">Weight / PCS</p>
                  <p className="text-lg font-bold">{shipment.total_weight}kg / {shipment.total_cartons}</p>
                </Card>
              </div>

              {/* Tab Switch: Timeline / Documents */}
              <Card className="border-border bg-card overflow-hidden">
                <div className="flex border-b border-border">
                  <button onClick={() => setActiveDocTab('timeline')} className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeDocTab === 'timeline' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    <Clock className="w-4 h-4" /> Transit Timeline
                  </button>
                  <button onClick={() => setActiveDocTab('documents')} className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeDocTab === 'documents' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    <FileText className="w-4 h-4" /> Documents
                  </button>
                </div>

                {activeDocTab === 'timeline' && (
                  <div className="p-4">
                    {events.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No tracking events available</p>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
                        <div className="space-y-0">
                          {events.map((event, i) => (
                            <div key={event.id} className="relative pl-12 py-4 group">
                              <div className={`absolute left-3 w-5 h-5 rounded-full border-2 ${i === 0 ? 'bg-primary border-primary' : 'bg-card border-border group-hover:border-primary'} transition-colors`} />
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className={`text-sm font-semibold ${getStatusColor(event.status)}`}>{event.status}</h4>
                                  <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground text-right">
                                  <div>{new Date(event.timestamp).toLocaleDateString('en-IN')}</div>
                                  <div>{new Date(event.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeDocTab === 'documents' && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {['Invoice', 'POD', 'E-Way Bill', 'KYC Document'].map(doc => (
                        <div key={doc} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium">{doc}</p>
                              <p className="text-xs text-muted-foreground">PDF Document</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Eye className="w-4 h-4" /></button>
                            <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Download className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Right: Parties */}
            <div className="space-y-4">
              <Card className="p-4 border-border bg-card">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Shipper</h3>
                <p className="font-medium">{shipment.shipper_id?.name || '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">{shipment.shipper_id?.address || ''}</p>
                {shipment.shipper_id?.phone && <p className="text-xs text-muted-foreground">📞 {shipment.shipper_id.phone}</p>}
              </Card>
              <Card className="p-4 border-border bg-card">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Consignee</h3>
                <p className="font-medium">{shipment.consignee_id?.name || '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">{shipment.consignee_id?.address || ''}</p>
                {shipment.consignee_id?.phone && <p className="text-xs text-muted-foreground">📞 {shipment.consignee_id.phone}</p>}
              </Card>
              <Card className="p-4 border-border bg-card">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Transit Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Booking</span><span>{new Date(shipment.created_at).toLocaleDateString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Expected</span><span>{shipment.expected_delivery_date ? new Date(shipment.expected_delivery_date).toLocaleDateString('en-IN') : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="capitalize">{shipment.service_type || '—'}</span></div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
