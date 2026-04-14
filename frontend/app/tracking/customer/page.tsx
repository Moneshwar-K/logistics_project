'use client';

import React from "react"

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiService } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Search,
  MapPin,
  Calendar,
  Package,
  Download,
  Printer,
  Share2,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';
import type { TrackingResponse } from '@/types/logistics';

export default function CustomerTrackingPage() {
  const [hawb, setHawb] = useState('');
  const [tracking, setTracking] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTracking(null);
    setLoading(true);

    try {
      const result = await apiService.quickTracking({ hawb });
      setTracking(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to track shipment. Please check the HAWB number and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Track Your Shipment">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hero Section */}
        <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-blue-500 p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Real-Time Shipment Tracking</h1>
          <p className="text-blue-100">Track your package and get instant updates on its status and location</p>
        </div>

        {/* Search Card */}
        <Card className="border-border p-8">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Enter Your HAWB Number
              </label>
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="e.g., HAW123456789"
                  value={hawb}
                  onChange={(e) => setHawb(e.target.value.toUpperCase())}
                  className="flex-1 h-12 bg-input border-border text-foreground uppercase text-lg"
                  maxLength={20}
                />
                <Button
                  type="submit"
                  disabled={loading || !hawb.trim()}
                  className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {loading ? 'Tracking...' : 'Track'}
                </Button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-destructive/20 border border-destructive/50 text-destructive">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                {error}
              </div>
            )}
          </form>
        </Card>

        {/* Tracking Results */}
        {tracking && (
          <div className="space-y-6">
            {/* Current Status Hero */}
            <Card className="border-blue-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-8 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-cyan-100 text-sm mb-2">Your Shipment</p>
                    <h2 className="text-4xl font-bold">{tracking.shipment.hawb}</h2>
                  </div>
                  <StatusBadge status={tracking.current_status.status} />
                </div>
              </div>

              <div className="p-8 bg-secondary/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-6 h-6 text-white flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Current Location</p>
                      <p className="text-lg font-semibold text-foreground">
                        {tracking.current_status.location || 'Processing'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{tracking.current_status.city}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Calendar className="w-6 h-6 text-white flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Estimated Delivery</p>
                      <p className="text-lg font-semibold text-foreground">
                        {tracking.shipment.estimated_delivery_date
                          ? new Date(tracking.shipment.estimated_delivery_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'TBD'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Package className="w-6 h-6 text-white flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Package Details</p>
                      <p className="text-lg font-semibold text-foreground">
                        {tracking.transit_summary.total_cartons} Cartons
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tracking.transit_summary.total_weight} kg
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shipment Route */}
                <div className="border-t border-border pt-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">From</p>
                      <div className="p-4 rounded-lg bg-card border border-border">
                        <p className="font-semibold text-foreground">
                          {tracking.shipment.origin_city}, {tracking.shipment.origin_country}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">Shipper: {tracking.shipment.shipper.name}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">To</p>
                      <div className="p-4 rounded-lg bg-card border border-border">
                        <p className="font-semibold text-foreground">
                          {tracking.shipment.destination_city}, {tracking.shipment.destination_country}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">Consignee: {tracking.shipment.consignee.name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Tracking Timeline */}
            <Card className="border-border p-8">
              <h3 className="text-2xl font-bold text-foreground mb-8">Tracking Timeline</h3>
              <div className="space-y-6">
                {tracking.tracking_history.map((event, index) => (
                  <div key={event.id} className="flex gap-6">
                    <div className="flex flex-col items-center">
                      <div className="w-5 h-5 rounded-full bg-cyan-500 border-4 border-background" />
                      {index < tracking.tracking_history.length - 1 && (
                        <div className="w-1 h-20 bg-border mt-2" />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <p className="text-lg font-semibold text-foreground capitalize">
                          {event.status.replace(/_/g, ' ')}
                        </p>
                        <time className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </time>
                      </div>
                      <p className="text-base text-foreground font-medium">
                        {event.location}, {event.city}
                      </p>
                      {event.remarks && (
                        <p className="text-sm text-muted-foreground mt-2">{event.remarks}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Attachments */}
            {tracking.documents && tracking.documents.length > 0 && (
              <Card className="border-border p-8">
                <h3 className="text-2xl font-bold text-foreground mb-6">Shipment Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tracking.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 border border-border rounded-lg hover:bg-primary/10 hover:border-primary transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground capitalize group-hover:text-cyan-500 transition-colors">
                            {doc.document_type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{doc.file_name}</p>
                        </div>
                        <Download className="w-5 h-5 text-muted-foreground group-hover:text-cyan-500 transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="border-border p-8 bg-secondary/5">
              <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button className="flex-1 h-12 bg-primary hover:bg-primary/90">
                  <Download className="w-4 h-4 mr-2" />
                  Download Bill
                </Button>
                <Button variant="outline" className="flex-1 h-12 border-border text-foreground hover:bg-secondary/20 bg-transparent">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" className="flex-1 h-12 border-border text-foreground hover:bg-secondary/20 bg-transparent">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
              <Button variant="outline" className="w-full h-12 border-border text-foreground hover:bg-secondary/20 mt-3 bg-transparent">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!tracking && !loading && !error && (
          <Card className="border-border p-16 text-center">
            <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-xl font-medium text-foreground mb-2">No Shipment Selected</p>
            <p className="text-muted-foreground">Enter your HAWB number above to start tracking your shipment</p>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
