'use client';

import React from "react"

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiService } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';
import { Search, ChevronRight, MapPin, Weight, Calendar } from 'lucide-react';
import Link from 'next/link';
import type { Shipment, TrackingResponse } from '@/types/logistics';

export default function AdminTrackingPage() {
  const [searchHawb, setSearchHawb] = useState('');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedTracking, setSelectedTracking] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSelectedTracking(null);
    setLoading(true);

    try {
      const result = await apiService.quickTracking({ hawb: searchHawb });
      setSelectedTracking(result);
      setShipments([result.shipment]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Shipment Tracking">
      <div className="space-y-6">
        {/* Search Bar */}
        <Card className="border-blue-200 p-6 bg-blue-50">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Search by HAWB, AWB, or Reference Number
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search shipment..."
                  value={searchHawb}
                  onChange={(e) => setSearchHawb(e.target.value.toUpperCase())}
                  className="flex-1 bg-input border-border text-foreground"
                />
                <Button
                  type="submit"
                  disabled={loading || !searchHawb.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/20 border border-destructive/50 text-destructive text-sm">
                {error}
              </div>
            )}
          </form>
        </Card>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shipments List */}
          <Card className="lg:col-span-1 border-border overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border bg-secondary/20">
              <h3 className="font-bold text-foreground">Search Results</h3>
              <p className="text-xs text-muted-foreground">
                {shipments.length} shipment{shipments.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {shipments.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  {loading ? 'Searching...' : 'No shipments found'}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {shipments.map((shipment) => (
                    <button
                      key={shipment.id}
                      onClick={() =>
                        selectedTracking?.shipment.id === shipment.id
                          ? setSelectedTracking(null)
                          : setSelectedTracking(selectedTracking || null)
                      }
                      className={`w-full p-4 text-left transition-colors hover:bg-secondary/20 ${
                        selectedTracking?.shipment.id === shipment.id ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-foreground text-sm">{shipment.hawb}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {shipment.origin_city} → {shipment.destination_city}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Tracking Details */}
          {selectedTracking && (
            <div className="lg:col-span-2 space-y-4">
              {/* Current Status Card */}
              <Card className="border-border overflow-hidden">
                <div className="bg-blue-50 p-6 border-b border-blue-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Status</p>
                      <h2 className="text-xl font-bold text-foreground mt-1">
                        {selectedTracking.shipment.hawb}
                      </h2>
                    </div>
                    <StatusBadge status={selectedTracking.current_status.status} />
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Key Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Current Location</p>
                        <p className="text-sm font-medium text-foreground mt-1">
                          {selectedTracking.current_status.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Weight className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Total Weight</p>
                        <p className="text-sm font-medium text-foreground mt-1">
                          {selectedTracking.shipment.total_weight} kg
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Shipment Details */}
                  <div className="border-t border-border pt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">From</p>
                      <p className="font-medium text-foreground mt-1">
                        {selectedTracking.shipment.origin_city}, {selectedTracking.shipment.origin_country}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">To</p>
                      <p className="font-medium text-foreground mt-1">
                        {selectedTracking.shipment.destination_city},{' '}
                        {selectedTracking.shipment.destination_country}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cartons</p>
                      <p className="font-medium text-foreground mt-1">
                        {selectedTracking.transit_summary.total_cartons}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Mode</p>
                      <p className="font-medium text-foreground mt-1 capitalize">
                        {selectedTracking.shipment.mode}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Tracking Timeline */}
              <Card className="border-border p-6">
                <h3 className="font-bold text-foreground mb-4">Tracking Events</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedTracking.tracking_history.map((event, index) => (
                    <div key={event.id} className="flex gap-4 pb-4 last:pb-0 last:border-b-0 border-b border-border">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-cyan-500" />
                        {index < selectedTracking.tracking_history.length - 1 && (
                          <div className="w-0.5 h-12 bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-foreground capitalize">
                            {event.status.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {event.location}, {event.city}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                        {event.remarks && (
                          <p className="text-xs text-foreground/70 mt-1 italic">{event.remarks}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Link href={`/operations/status-update?hawb=${selectedTracking.shipment.hawb}`} className="flex-1">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Update Status
                  </Button>
                </Link>
                <Link href={`/operations/pod?shipment_id=${selectedTracking.shipment.id}`} className="flex-1">
                  <Button variant="outline" className="w-full border-border text-foreground hover:bg-secondary/20 bg-transparent">
                    Create POD
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
