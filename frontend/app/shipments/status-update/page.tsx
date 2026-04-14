'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiService } from '@/lib/api';
import { AlertCircle, CheckCircle, Loader2, MapPin, Calendar } from 'lucide-react';
import type { ShipmentStatus } from '@/types/logistics';

export default function StatusUpdatePage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hawb, setHawb] = useState('');
  const [newStatus, setNewStatus] = useState<ShipmentStatus>('in_transit');
  const [location, setLocation] = useState('');
  const [remarks, setRemarks] = useState('');

  const statuses: { value: ShipmentStatus; label: string; color: string }[] = [
    { value: 'pending', label: 'Pending', color: 'bg-gray-100' },
    { value: 'picked_up', label: 'Picked Up', color: 'bg-blue-100' },
    { value: 'in_transit', label: 'In Transit', color: 'bg-yellow-100' },
    { value: 'in_port', label: 'In Port', color: 'bg-blue-100' },
    { value: 'customs_clearance', label: 'Customs Clearance', color: 'bg-orange-100' },
    { value: 'ready_for_delivery', label: 'Ready for Delivery', color: 'bg-purple-100' },
    { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-yellow-100' },
    { value: 'delivered', label: 'Delivered', color: 'bg-green-100' },
    { value: 'on_hold', label: 'On Hold', color: 'bg-red-100' },
    { value: 'exception', label: 'Exception', color: 'bg-red-100' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      if (!hawb.trim()) {
        throw new Error('HAWB is required');
      }

      // API call to update status via operations endpoint
      await apiService.updateOperationStatus({
        hawb: hawb.toUpperCase(),
        new_status: newStatus,
        update_date: new Date().toISOString(),
        remarks: remarks || undefined,
        location: location || undefined,
      } as any);

      setSuccess(true);
      // Reset form
      setHawb('');
      setNewStatus('in_transit');
      setLocation('');
      setRemarks('');

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Update Shipment Status">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Update Shipment Status</h1>
          <p className="text-muted-foreground">Real-time shipment tracking and status updates</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="p-8 bg-white border-blue-200">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* HAWB Input */}
                <div>
                  <Label htmlFor="hawb" className="block text-sm font-semibold text-foreground mb-2">
                    HAWB/Tracking Number *
                  </Label>
                  <Input
                    id="hawb"
                    type="text"
                    placeholder="e.g., HAW000001"
                    value={hawb}
                    onChange={(e) => setHawb(e.target.value.toUpperCase())}
                    className="border-blue-200 text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Enter the HAWB number of the shipment to update</p>
                </div>

                {/* Status Selection */}
                <div>
                  <Label className="block text-sm font-semibold text-foreground mb-3">
                    New Status *
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {statuses.map((status) => (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => setNewStatus(status.value)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          newStatus === status.value
                            ? 'border-blue-600 bg-blue-50 text-foreground'
                            : 'border-blue-200 bg-white text-foreground hover:border-blue-400'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <Label htmlFor="location" className="block text-sm font-semibold text-foreground mb-2">
                    Current Location
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="location"
                      type="text"
                      placeholder="e.g., New York Distribution Center"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-10 border-blue-200 text-foreground"
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <Label htmlFor="remarks" className="block text-sm font-semibold text-foreground mb-2">
                    Remarks (Optional)
                  </Label>
                  <textarea
                    id="remarks"
                    placeholder="Add any additional information or notes..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-blue-200 bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                {/* Messages */}
                {error && (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">Status Updated Successfully!</p>
                      <p className="text-sm text-green-700">The shipment status has been updated and customers notified.</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading || !hawb.trim()}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Updating...' : 'Update Status'}
                </Button>
              </form>
            </Card>
          </div>

          {/* Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Flow Info */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-sm font-semibold text-foreground mb-4">Typical Status Flow</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span>Pending → Picked Up</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span>In Transit → Customs</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span>Ready for Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span>Out for Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  <span className="font-semibold">Delivered</span>
                </div>
              </div>
            </Card>

            {/* Recent Updates */}
            <Card className="p-6 bg-white border-blue-200">
              <h3 className="text-sm font-semibold text-foreground mb-4">Recent Updates</h3>
              <div className="space-y-3 text-xs">
                <p className="text-muted-foreground">Recent status updates will appear here after you update a shipment.</p>
              </div>
            </Card>

            {/* Tips */}
            <Card className="p-6 bg-white border-blue-200">
              <h3 className="text-sm font-semibold text-foreground mb-3">Tips</h3>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
                <li>Always include location for better tracking</li>
                <li>Use remarks for exception handling</li>
                <li>Updates notify customers automatically</li>
                <li>Cannot revert to previous status</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
