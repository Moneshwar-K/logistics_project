'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Loader2, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/lib/api';
// import type { Shipment } from '@/types/logistics'; // Using any for now to avoid strict type issues if types aren't fully updated

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

interface ChargeBreakdown {
  base_charge: number;
  weight_charge: number;
  service_surcharge: number;
  fuel_surcharge: number;
  handling_charge: number;
  subtotal: number;
  tax_percentage: number;
  tax_amount: number;
  total: number;
  rate_applied?: any;
}

export default function GenerateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hawb, setHawb] = useState(searchParams.get('hawb') || '');
  const [shipment, setShipment] = useState<any | null>(null);
  const [charges, setCharges] = useState<ChargeBreakdown | null>(null);
  const [taxPercentage, setTaxPercentage] = useState(18);
  const [notes, setNotes] = useState('');

  const getHeaders = () => { const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; return { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }; };

  const calculatePreview = async (ship: any, tax: number) => {
    try {
      const chargesData = await apiService.calculateCharges(ship._id);
      if (chargesData && chargesData.success && chargesData.data) {
        const c = chargesData.data;
        const subtotal = c.total;
        const tax_amount = (subtotal * tax) / 100;
        const total = subtotal + tax_amount;

        setCharges({
          base_charge: c.freight, // Mapping freight to base_charge for display compatibility
          weight_charge: 0, // Included in freight
          service_surcharge: 0, // Included in aggregations if any
          fuel_surcharge: c.fuel_surcharge,
          handling_charge: c.docket_charge, // Mapping docket to handling
          subtotal,
          tax_percentage: tax,
          tax_amount,
          total,
          rate_applied: { rate_per_kg: c.rate_applied }
        });
      }
    } catch (e) {
      console.error('Calculation failed', e);
      // Fallback or show error
    }
  };

  const handleSearchShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      if (!hawb.trim()) throw new Error('HAWB is required');

      // Fetch shipment by HAWB
      // Assuming we have an endpoint for this, or list with filter
      const res = await fetch(`${API_BASE}/shipments?hawb=${hawb.trim()}`, { headers: getHeaders() });
      const json = await res.json();

      if (!json.data || json.data.length === 0) {
        throw new Error('Shipment not found');
      }

      const foundShipment = json.data[0];
      setShipment(foundShipment);

      // Calculate preview
      await calculatePreview(foundShipment, taxPercentage);

    } catch (err: any) {
      setError(err.message || 'Failed to fetch shipment');
      setShipment(null);
      setCharges(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!shipment) return;
    setLoading(true); setError('');

    try {
      const res = await fetch(`${API_BASE}/invoices`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          shipment_id: shipment._id,
          notes: notes
          // The backend calculates charges again to be safe, but we could pass them if we wanted to override
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to generate');
      }

      const json = await res.json();
      setSuccess(true);

      // Redirect to invoice detail after short delay
      setTimeout(() => {
        router.push(`/billing/invoices/${json.data._id}`);
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Generate Invoice">
      <div className="p-8">
        <div className="mb-8"><h1 className="text-3xl font-bold text-foreground mb-2">Generate Invoice</h1><p className="text-muted-foreground">Create invoices from shipments with automatic calculations</p></div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Step 1 */}
            <Card className="p-8 mb-6 bg-card border-border">
              <h2 className="text-lg font-semibold text-foreground mb-6">Step 1: Find Shipment</h2>
              <form onSubmit={handleSearchShipment} className="space-y-4">
                <div>
                  <Label htmlFor="hawb" className="block text-sm font-semibold text-foreground mb-2">HAWB/Tracking Number *</Label>
                  <Input id="hawb" value={hawb} onChange={(e) => setHawb(e.target.value.toUpperCase())} placeholder="e.g., DEL-DXB-001" className="bg-background" />
                </div>
                <Button type="submit" disabled={loading || !hawb.trim()} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Search Shipment
                </Button>
              </form>
              {error && <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3"><AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" /><p className="text-sm text-destructive">{error}</p></div>}
            </Card>

            {/* Step 2 */}
            {shipment && (
              <Card className="p-8 mb-6 bg-card border-border">
                <h2 className="text-lg font-semibold text-foreground mb-6">Step 2: Shipment Details</h2>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div><p className="text-sm text-muted-foreground mb-1">HAWB</p><p className="text-lg font-bold">{shipment.hawb}</p></div>
                  <div><p className="text-sm text-muted-foreground mb-1">Service Type</p><p className="text-lg font-bold capitalize">{shipment.service_type || 'Standard'}</p></div>
                  <div><p className="text-sm text-muted-foreground mb-1">Route</p><p className="text-lg font-bold">{shipment.origin_city} → {shipment.destination_city}</p></div>
                  <div><p className="text-sm text-muted-foreground mb-1">Weight</p><p className="text-lg font-bold">{shipment.total_weight} kg</p></div>
                </div>
                <div className="bg-muted/30 border border-border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-muted-foreground mb-1">From:</p><p className="font-medium">{shipment.shipper_id?.name || 'Shipper'}</p></div>
                    <div><p className="text-muted-foreground mb-1">To:</p><p className="font-medium">{shipment.consignee_id?.name || 'Consignee'}</p></div>
                  </div>
                </div>
              </Card>
            )}

            {/* Step 3 */}
            {charges && (
              <Card className="p-8 mb-6 bg-card border-border">
                <h2 className="text-lg font-semibold text-foreground mb-6">Step 3: Charges & Taxes</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between p-3 bg-muted/20 rounded"><span>Base Charge</span><span className="font-medium">₹{charges.base_charge.toLocaleString()}</span></div>
                  <div className="flex justify-between p-3 bg-muted/20 rounded"><span>Weight Charge</span><span className="font-medium">₹{charges.weight_charge.toLocaleString()}</span></div>
                  {charges.service_surcharge > 0 && <div className="flex justify-between p-3 bg-muted/20 rounded"><span>Service Surcharge</span><span className="font-medium">₹{charges.service_surcharge.toLocaleString()}</span></div>}
                  {charges.fuel_surcharge > 0 && <div className="flex justify-between p-3 bg-muted/20 rounded"><span>Fuel Surcharge</span><span className="font-medium">₹{charges.fuel_surcharge.toLocaleString()}</span></div>}
                  <div className="flex justify-between p-3 bg-muted/20 rounded"><span>Handling Charge</span><span className="font-medium">₹{charges.handling_charge.toLocaleString()}</span></div>

                  <div className="border-t border-border pt-3 flex justify-between p-3 font-semibold"><span>Subtotal</span><span>₹{charges.subtotal.toLocaleString()}</span></div>

                  <div className="flex justify-between items-center p-3 gap-4">
                    <div className="flex-1"><label className="text-sm font-semibold block mb-2">Tax (%)</label><Input type="number" value={taxPercentage} onChange={e => { const v = parseFloat(e.target.value) || 0; setTaxPercentage(v); calculatePreview(shipment, v); }} /></div>
                    <div className="text-right"><p className="text-xs text-muted-foreground mb-1">Tax Amount</p><p className="text-lg font-bold">₹{charges.tax_amount.toLocaleString()}</p></div>
                  </div>

                  <div className="border-t-2 border-primary pt-3 flex justify-between p-4 bg-primary/5 rounded-lg"><span className="text-lg font-bold">Total Amount</span><span className="text-2xl font-bold text-primary">₹{charges.total.toLocaleString()}</span></div>
                </div>

                <div className="mb-6"><Label className="block text-sm font-semibold mb-2">Notes</Label><textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary" rows={3} placeholder="Add invoice notes..." /></div>

                {success && <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3 mb-6"><CheckCircle className="w-5 h-5 text-green-600 mt-0.5" /><div><p className="text-sm font-semibold text-green-800">Invoice Generated!</p><p className="text-sm text-green-700">Redirecting to invoice details...</p></div></div>}

                <Button onClick={handleGenerateInvoice} disabled={loading} className="w-full bg-green-600 text-white hover:bg-green-700 py-6 text-lg">{loading ? 'Generating...' : 'Generate Invoice'}</Button>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 bg-muted/30 border-border sticky top-8">
              <h3 className="font-semibold mb-4">Rate Info</h3>
              {charges?.rate_applied ? (
                <div className="text-sm space-y-2">
                  <p><strong>Rate Card Found:</strong> <span className="text-green-600">Yes</span></p>
                  <p>Min Charge: ₹{charges.rate_applied.min_charge}</p>
                  <p>Rate/Kg: ₹{charges.rate_applied.rate_per_kg}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No specific rate card found for this route/weight. Using default standard rates.</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
