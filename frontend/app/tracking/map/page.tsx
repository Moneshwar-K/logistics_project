'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Loader2, AlertCircle, Navigation } from 'lucide-react';

interface TrackingLocation {
  id: string;
  shipment_id: string;
  latitude: number;
  longitude: number;
  location_name: string;
  timestamp: string;
  accuracy_meters: number;
  speed_kmh?: number;
}

interface Shipment {
  hawb: string;
  origin_city: string;
  destination_city: string;
  current_location?: TrackingLocation;
}

export default function TrackingMapPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [locations, setLocations] = useState<TrackingLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!searchTerm.trim()) {
        throw new Error('Please enter HAWB or shipment number');
      }

      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };

      // Fetch tracking info from API
      const res = await fetch(`${API_BASE}/tracking/${searchTerm.toUpperCase()}`, { headers });
      if (!res.ok) throw new Error('Shipment not found or tracking unavailable');

      const json = await res.json();
      const trackingData = json.data || {};
      const events = trackingData.events || trackingData.tracking || [];

      // Build shipment info
      const shipData: Shipment = {
        hawb: trackingData.hawb || searchTerm.toUpperCase(),
        origin_city: trackingData.origin_city || '—',
        destination_city: trackingData.destination_city || '—',
        current_location: events.length > 0 ? {
          id: events[0]._id || events[0].id || 'loc_0',
          shipment_id: trackingData.shipment_id || '',
          latitude: events[0].latitude || 0,
          longitude: events[0].longitude || 0,
          location_name: events[0].location || events[0].city || 'Unknown',
          timestamp: events[0].timestamp || new Date().toISOString(),
          accuracy_meters: events[0].accuracy_meters || 100,
          speed_kmh: events[0].speed_kmh,
        } : undefined,
      };

      // Map events to locations
      const trackingLocations: TrackingLocation[] = events.map((ev: any, idx: number) => ({
        id: ev._id || ev.id || `loc_${idx}`,
        shipment_id: trackingData.shipment_id || '',
        latitude: ev.latitude || 0,
        longitude: ev.longitude || 0,
        location_name: ev.location || ev.city || 'Unknown',
        timestamp: ev.timestamp || new Date().toISOString(),
        accuracy_meters: ev.accuracy_meters || 100,
        speed_kmh: ev.speed_kmh,
      }));

      setShipment(shipData);
      setLocations(trackingLocations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search shipment');
      setShipment(null);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  return (
    <MainLayout title="Tracking Map">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Live Tracking Map</h1>
          <p className="text-muted-foreground">View shipment locations in real-time</p>
        </div>

        {/* Search Section */}
        <Card className="p-8 mb-8 bg-white border-blue-200">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter HAWB or shipment number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                className="pl-10 border-blue-200 text-foreground h-12"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !searchTerm.trim()}
              className="bg-blue-600 text-white hover:bg-blue-700 px-8 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </Card>

        {shipment && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Map Area (Placeholder) */}
            <div className="lg:col-span-2">
              <Card className="bg-white border-blue-200 overflow-hidden">
                <div className="relative w-full h-[600px] bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                  {/* Map Placeholder with coordinates */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Navigation className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
                      <p className="text-lg font-semibold text-foreground mb-2">Interactive Map Placeholder</p>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        In production, integrate with Google Maps, Mapbox, or Leaflet to display real-time tracking locations and route visualization.
                      </p>
                    </div>
                  </div>

                  {/* Location Markers (Simplified) */}
                  <div className="absolute inset-0 pointer-events-none">
                    {locations.map((loc, idx) => {
                      const isLatest = idx === 0;
                      return (
                        <div
                          key={loc.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2"
                          style={{
                            left: `${20 + idx * 20}%`,
                            top: `${30 + idx * 15}%`,
                          }}
                        >
                          <div
                            className={`w-4 h-4 rounded-full ${
                              isLatest ? 'bg-green-600 ring-4 ring-green-200 animate-pulse' : 'bg-blue-600'
                            }`}
                          ></div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Route Line (Simplified) */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <polyline
                      points={locations
                        .map((_, idx) => `${20 + idx * 20}% ${30 + idx * 15}%`)
                        .join(' ')}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="5,5"
                    />
                  </svg>
                </div>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <p className="text-xs text-muted-foreground mb-1">Total Distance</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {locations.length > 1
                      ? calculateDistance(
                          locations[0].latitude,
                          locations[0].longitude,
                          locations[locations.length - 1].latitude,
                          locations[locations.length - 1].longitude
                        )
                      : 0}
                    km
                  </p>
                </Card>
                <Card className="p-4 bg-green-50 border-green-200">
                  <p className="text-xs text-muted-foreground mb-1">Current Speed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {shipment.current_location?.speed_kmh || 0} km/h
                  </p>
                </Card>
              </div>
            </div>

            {/* Locations List */}
            <div>
              <Card className="p-6 bg-white border-blue-200 max-h-[650px] overflow-y-auto">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Tracking Points
                </h3>

                <div className="space-y-3">
                  {locations.map((loc, idx) => (
                    <div
                      key={loc.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                        idx === 0
                          ? 'bg-green-50 border-green-300'
                          : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              idx === 0 ? 'bg-green-600 animate-pulse' : 'bg-blue-600'
                            }`}
                          ></div>
                          <p className="font-semibold text-foreground">{loc.location_name}</p>
                        </div>
                        {idx === 0 && (
                          <span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-semibold rounded">
                            Current
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(loc.timestamp).toLocaleString()}
                      </p>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>
                          <span className="font-medium">Coordinates:</span> {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                        </p>
                        <p>
                          <span className="font-medium">Accuracy:</span> ±{loc.accuracy_meters}m
                        </p>
                        {loc.speed_kmh && (
                          <p>
                            <span className="font-medium">Speed:</span> {loc.speed_kmh} km/h
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
