'use client';

import React, { useState, useRef } from 'react';
import { apiService } from '@/lib/api';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Loader2, FileCheck } from 'lucide-react';
import type { Shipment } from '@/types/logistics';

export default function GenerateEWayBillPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'search' | 'details' | 'confirm'>('search');
  const [hawb, setHawb] = useState('');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [formData, setFormData] = useState({
    consignor_gstin: '',
    consignee_gstin: '',
    vehicle_number: '',
    transporter_id: '',
    valid_till_days: '1',
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!hawb.trim()) {
        throw new Error('HAWB is required');
      }

      // Fetch real shipment by HAWB
      const shipmentData = await apiService.getShipmentByHAWB(hawb.toUpperCase());
      if (!shipmentData) throw new Error('Shipment not found');

      setShipment(shipmentData);
      setFormData(prev => ({
        ...prev,
        consignor_gstin: shipmentData.shipper?.gst_number || '',
        consignee_gstin: shipmentData.consignee?.gst_number || '',
      }));
      setStep('details');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.consignor_gstin.trim()) {
        throw new Error('Consignor GSTIN is required');
      }
      if (!formData.consignee_gstin.trim()) {
        throw new Error('Consignee GSTIN is required');
      }
      if (!formData.vehicle_number.trim()) {
        throw new Error('Vehicle number is required');
      }

      // Generate e-way bill via API
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };

      const res = await fetch(`${API_BASE}/eway-bills`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          shipment_id: shipment?.id || shipment?._id,
          consignor_gstin: formData.consignor_gstin,
          consignee_gstin: formData.consignee_gstin,
          vehicle_number: formData.vehicle_number,
          transporter_id: formData.transporter_id,
          valid_till_days: parseInt(formData.valid_till_days) || 1,
          total_invoice_value: shipment?.invoice_value || 0,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to generate e-way bill');
      }

      setSuccess(true);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate e-way bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Generate E-Way Bill">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Generate E-Way Bill</h1>
          <p className="text-muted-foreground">Create GST-compliant e-way bills for shipments</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-between max-w-md">
          {['search', 'details', 'confirm'].map((s, idx) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                step === s ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
              }`}>
                {idx + 1}
              </div>
              {idx < 2 && <div className={`flex-1 h-1 mx-2 ${step !== 'search' && step !== 'details' ? 'bg-blue-600' : 'bg-blue-200'}`}></div>}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {/* Step 1: Search */}
            {step === 'search' && (
              <Card className="p-8 bg-white border-blue-200">
                <h2 className="text-lg font-semibold text-foreground mb-6">Step 1: Find Shipment</h2>

                <form onSubmit={handleSearch} className="space-y-4">
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
                    <p className="text-xs text-muted-foreground mt-1">Enter shipment HAWB to proceed</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !hawb.trim()}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Search & Continue
                  </Button>
                </form>

                {error && (
                  <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
              </Card>
            )}

            {/* Step 2: Details */}
            {step === 'details' && shipment && (
              <Card className="p-8 bg-white border-blue-200">
                <h2 className="text-lg font-semibold text-foreground mb-6">Step 2: E-Way Bill Details</h2>

                {/* Shipment Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">HAWB</p>
                      <p className="font-semibold text-foreground">{shipment.hawb}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Shipment Value</p>
                      <p className="font-semibold text-foreground">₹{shipment.invoice_value?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">From</p>
                      <p className="font-semibold text-foreground">{shipment.origin_city}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">To</p>
                      <p className="font-semibold text-foreground">{shipment.destination_city}</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Consignor GSTIN */}
                  <div>
                    <Label htmlFor="consignor_gstin" className="block text-sm font-semibold text-foreground mb-2">
                      Consignor GSTIN *
                    </Label>
                    <Input
                      id="consignor_gstin"
                      type="text"
                      placeholder="27AABCT1234H1Z0"
                      value={formData.consignor_gstin}
                      onChange={(e) => setFormData({ ...formData, consignor_gstin: e.target.value.toUpperCase() })}
                      className="border-blue-200 text-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-1">15-digit GST number of shipper</p>
                  </div>

                  {/* Consignee GSTIN */}
                  <div>
                    <Label htmlFor="consignee_gstin" className="block text-sm font-semibold text-foreground mb-2">
                      Consignee GSTIN *
                    </Label>
                    <Input
                      id="consignee_gstin"
                      type="text"
                      placeholder="27AABCT5678H1Z0"
                      value={formData.consignee_gstin}
                      onChange={(e) => setFormData({ ...formData, consignee_gstin: e.target.value.toUpperCase() })}
                      className="border-blue-200 text-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-1">15-digit GST number of consignee</p>
                  </div>

                  {/* Vehicle Number */}
                  <div>
                    <Label htmlFor="vehicle_number" className="block text-sm font-semibold text-foreground mb-2">
                      Vehicle Number *
                    </Label>
                    <Input
                      id="vehicle_number"
                      type="text"
                      placeholder="e.g., DL01AB1234"
                      value={formData.vehicle_number}
                      onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
                      className="border-blue-200 text-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Vehicle registration number</p>
                  </div>

                  {/* Transporter ID */}
                  <div>
                    <Label htmlFor="transporter_id" className="block text-sm font-semibold text-foreground mb-2">
                      Transporter ID (Optional)
                    </Label>
                    <Input
                      id="transporter_id"
                      type="text"
                      placeholder="GSTIN of transporter"
                      value={formData.transporter_id}
                      onChange={(e) => setFormData({ ...formData, transporter_id: e.target.value })}
                      className="border-blue-200 text-foreground"
                    />
                  </div>

                  {/* Validity */}
                  <div>
                    <Label htmlFor="valid_till_days" className="block text-sm font-semibold text-foreground mb-2">
                      Valid For (Days)
                    </Label>
                    <Input
                      id="valid_till_days"
                      type="number"
                      min="1"
                      max="30"
                      value={formData.valid_till_days}
                      onChange={(e) => setFormData({ ...formData, valid_till_days: e.target.value })}
                      className="border-blue-200 text-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-1">1 = Single trip, 30 = Monthly validity</p>
                  </div>

                  {error && (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setStep('search');
                        setHawb('');
                        setShipment(null);
                      }}
                      className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Generate E-Way Bill
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Step 3: Success */}
            {step === 'confirm' && success && (
              <Card className="p-8 bg-white border-blue-200">
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">E-Way Bill Generated!</h2>
                  <p className="text-muted-foreground mb-6">
                    The e-way bill has been successfully created and is ready for use.
                  </p>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <p className="text-sm text-muted-foreground mb-2">E-Way Bill Number</p>
                    <p className="font-mono text-2xl font-bold text-green-600">
                      {`40100${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
                      Download PDF
                    </Button>
                    <Button variant="outline" className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
                      Send via Email
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-purple-50 border-purple-200 sticky top-8">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-purple-600" />
                E-Way Bill Info
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-foreground mb-1">What is E-Way Bill?</p>
                  <p className="text-muted-foreground">
                    An electronic document issued by GST authorities for movement of goods exceeding ₹50,000.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-foreground mb-1">Requirements</p>
                  <ul className="text-muted-foreground list-disc list-inside space-y-1">
                    <li>Valid GSTIN for parties</li>
                    <li>Vehicle number</li>
                    <li>Shipment value details</li>
                  </ul>
                </div>

                <div className="border-t border-purple-200 pt-4">
                  <p className="font-semibold text-foreground mb-2">Validity Period</p>
                  <p className="text-muted-foreground text-xs">
                    Single trip: 1 day<br />
                    Multi-trip: Up to 30 days
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-xs font-semibold text-yellow-800 mb-1">⚠️ Important</p>
                  <p className="text-xs text-yellow-700">
                    Required for interstate movement of goods. Ensure accuracy of GSTIN.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
