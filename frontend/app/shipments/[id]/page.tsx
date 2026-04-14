'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiService } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';
import { Edit, Download, FileText, Truck, MapPin, Package, DollarSign, FileCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Shipment, Invoice, EWayBill, TrackingEvent } from '@/types/logistics';

export default function ShipmentDetailPage({ params }: { params: { id: string } }) {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ewayBills, setEWayBills] = useState<EWayBill[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);

  useEffect(() => {
    fetchDetails();
  }, [params.id]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      // Fetch shipment
      const shipmentData = await apiService.getShipment(params.id);
      setShipment(shipmentData);

      // Fetch related invoices from API
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };

        const [invRes, ewayRes, trackRes] = await Promise.allSettled([
          fetch(`${API_BASE}/invoices?shipment_id=${params.id}`, { headers }),
          fetch(`${API_BASE}/eway-bills?shipment_id=${params.id}`, { headers }),
          fetch(`${API_BASE}/tracking/${shipmentData?.hawb || params.id}`, { headers }),
        ]);

        if (invRes.status === 'fulfilled' && invRes.value.ok) {
          const invJson = await invRes.value.json();
          setInvoices(invJson.data || []);
        }
        if (ewayRes.status === 'fulfilled' && ewayRes.value.ok) {
          const ewayJson = await ewayRes.value.json();
          setEWayBills(ewayJson.data || []);
        }
        if (trackRes.status === 'fulfilled' && trackRes.value.ok) {
          const trackJson = await trackRes.value.json();
          const events = trackJson.data?.events || trackJson.data || [];
          setTrackingEvents(Array.isArray(events) ? events : []);
        }
      } catch (relatedErr) {
        console.error('Failed to fetch related data:', relatedErr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Shipment Details">
        <div className="p-8">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (error || !shipment) {
    return (
      <MainLayout title="Shipment Details">
        <div className="p-8">
          <Link href="/shipments/list">
            <Button variant="outline" className="mb-4 border-blue-200 text-blue-600 bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shipments
            </Button>
          </Link>
          <Card className="bg-red-50 border-red-200 p-6 text-red-800">
            {error || 'Shipment not found'}
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Shipment Details">
      <div className="p-8">
        {/* Back Button */}
        <Link href="/shipments/list">
          <Button variant="outline" className="mb-6 border-blue-200 text-blue-600 bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{shipment.hawb}</h1>
            <p className="text-muted-foreground">Shipment Details & Related Documents</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Status Card */}
          <Card className="p-6 bg-white border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Status</h3>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <StatusBadge status={shipment.status} />
            <p className="text-xs text-muted-foreground mt-4">
              Updated: {new Date(shipment.updated_at).toLocaleString()}
            </p>
          </Card>

          {/* Route Card */}
          <Card className="p-6 bg-white border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Route</h3>
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <p className="text-sm font-medium text-foreground">{shipment.origin_city}, {shipment.origin_country}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">To</p>
                <p className="text-sm font-medium text-foreground">{shipment.destination_city}, {shipment.destination_country}</p>
              </div>
            </div>
          </Card>

          {/* Details Card */}
          <Card className="p-6 bg-white border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Details</h3>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Weight:</span>
                <span className="font-medium text-foreground">{shipment.total_weight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cartons:</span>
                <span className="font-medium text-foreground">{shipment.total_cartons}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-medium text-foreground capitalize">{shipment.service_type}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Party Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Shipper Card */}
            <Card className="p-6 bg-white border-blue-200">
              <h3 className="text-sm font-semibold text-foreground mb-4">Shipper</h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">{shipment.shipper?.name}</p>
                <p className="text-muted-foreground">{shipment.shipper?.email}</p>
                <p className="text-muted-foreground">{shipment.shipper?.phone}</p>
                <p className="text-muted-foreground text-xs">{shipment.shipper?.address}</p>
              </div>
            </Card>

            {/* Consignee Card */}
            <Card className="p-6 bg-white border-blue-200">
              <h3 className="text-sm font-semibold text-foreground mb-4">Consignee</h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">{shipment.consignee?.name}</p>
                <p className="text-muted-foreground">{shipment.consignee?.email}</p>
                <p className="text-muted-foreground">{shipment.consignee?.phone}</p>
                <p className="text-muted-foreground text-xs">{shipment.consignee?.address}</p>
              </div>
            </Card>
          </div>

          {/* Right: Connected Documents */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoices Section */}
            <Card className="p-6 bg-white border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Invoices ({invoices.length})
                </h3>
                <Link href={`/billing/generate-invoice?hawb=${shipment.hawb}`}>
                  <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                    Generate Invoice
                  </Button>
                </Link>
              </div>
              <div className="space-y-2">
                {invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No invoices generated yet</p>
                ) : (
                  invoices.map((invoice) => (
                    <div key={invoice.id} className="p-3 border border-blue-100 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{invoice.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">₹{invoice.total_amount.toLocaleString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        invoice.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.payment_status.toUpperCase()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* E-Way Bills Section */}
            <Card className="p-6 bg-white border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-purple-600" />
                  E-Way Bills ({ewayBills.length})
                </h3>
                <Link href={`/eway-bills/create?shipment_id=${shipment.id}`}>
                  <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                    Generate E-Bill
                  </Button>
                </Link>
              </div>
              <div className="space-y-2">
                {ewayBills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No e-way bills generated yet</p>
                ) : (
                  ewayBills.map((bill) => (
                    <div key={bill.id} className="p-3 border border-blue-100 rounded-lg">
                      <p className="text-sm font-mono font-semibold text-foreground">{bill.eway_bill_number}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          Valid till: {new Date(bill.valid_till).toLocaleDateString()}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          bill.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {bill.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Tracking Timeline */}
            <Card className="p-6 bg-white border-blue-200">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-600" />
                Tracking Timeline
              </h3>
              <div className="space-y-4">
                {trackingEvents.map((event, idx) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      {idx < trackingEvents.length - 1 && <div className="w-0.5 h-16 bg-blue-200"></div>}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-foreground capitalize">{event.status.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground mt-1">{event.location} - {event.city}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
