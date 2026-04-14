'use client';

import React from "react"

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiService } from '@/lib/api';
import { AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react';
import type { BookingFormData, Party } from '@/types/logistics';

export default function ManualBookingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    // Shipper
    shipperName: '',
    shipperEmail: '',
    shipperPhone: '',
    shipperAddress: '',
    shipperCity: '',
    shipperState: '',
    shipperPostalCode: '',
    shipperGst: '',
    // Consignee
    consigneeName: '',
    consigneeEmail: '',
    consigneePhone: '',
    consigneeAddress: '',
    consigneeCity: '',
    consigneeState: '',
    consigneePostalCode: '',
    consigneeGst: '',
    // Route
    originCountry: 'India',
    destinationCountry: 'India',
    // Shipment
    serviceType: 'air' as const,
    shipmentType: 'parcel' as const,
    cartons: '1',
    weight: '',
    weightCbm: '',
    invoiceValue: '',
    currency: 'INR',
    packageType: 'CARTON',
    goodsDescription: '',
    mode: 'air' as const,
    carrier: '',
    referenceNumber: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const shipper: Party = {
        id: '',
        name: formData.shipperName,
        email: formData.shipperEmail,
        phone: formData.shipperPhone,
        address: formData.shipperAddress,
        city: formData.shipperCity,
        state: formData.shipperState,
        postal_code: formData.shipperPostalCode,
        country: formData.originCountry,
        gst_number: formData.shipperGst,
      };

      const consignee: Party = {
        id: '',
        name: formData.consigneeName,
        email: formData.consigneeEmail,
        phone: formData.consigneePhone,
        address: formData.consigneeAddress,
        city: formData.consigneeCity,
        state: formData.consigneeState,
        postal_code: formData.consigneePostalCode,
        country: formData.destinationCountry,
        gst_number: formData.consigneeGst,
      };

      const bookingData: BookingFormData = {
        shipper,
        consignee,
        origin_city: formData.shipperCity,
        origin_country: formData.originCountry,
        destination_city: formData.consigneeCity,
        destination_country: formData.destinationCountry,
        service_type: formData.serviceType,
        shipment_type: formData.shipmentType,
        total_cartons: parseInt(formData.cartons),
        total_weight: parseFloat(formData.weight),
        total_weight_cbm: formData.weightCbm ? parseFloat(formData.weightCbm) : undefined,
        invoice_value: parseFloat(formData.invoiceValue),
        invoice_currency: formData.currency,
        package_type: formData.packageType,
        goods_description: formData.goodsDescription,
        mode: formData.mode,
        carrier: formData.carrier || undefined,
        reference_number: formData.referenceNumber || undefined,
        documents: files.length > 0 ? files : undefined,
      };

      await apiService.createShipment(bookingData);
      setSuccess(true);
      setFormData({
        shipperName: '',
        shipperEmail: '',
        shipperPhone: '',
        shipperAddress: '',
        shipperCity: '',
        shipperState: '',
        shipperPostalCode: '',
        shipperGst: '',
        consigneeName: '',
        consigneeEmail: '',
        consigneePhone: '',
        consigneeAddress: '',
        consigneeCity: '',
        consigneeState: '',
        consigneePostalCode: '',
        consigneeGst: '',
        originCountry: 'India',
        destinationCountry: 'India',
        serviceType: 'air',
        shipmentType: 'parcel',
        cartons: '1',
        weight: '',
        weightCbm: '',
        invoiceValue: '',
        currency: 'INR',
        packageType: 'CARTON',
        goodsDescription: '',
        mode: 'air',
        carrier: '',
        referenceNumber: '',
      });
      setFiles([]);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Manual Booking">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success Message */}
        {success && (
          <Card className="border-status-delivered bg-status-delivered/10 border-status-delivered/50 p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-status-delivered flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Shipment Created Successfully!</p>
              <p className="text-sm text-muted-foreground mt-1">Your HAWB has been generated and documents have been uploaded.</p>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="border-destructive bg-destructive/10 border-destructive/50 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Error</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </Card>
        )}

        {/* Form Card */}
        <Card className="border-border">
          <form onSubmit={handleSubmit} className="divide-y divide-border">
            {/* Shipper Section */}
            <div className="p-8">
              <h3 className="text-lg font-bold text-foreground mb-6">Shipper Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground mb-2 block">Name *</Label>
                  <Input
                    name="shipperName"
                    placeholder="Full Name"
                    value={formData.shipperName}
                    onChange={handleChange}
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Email *</Label>
                  <Input
                    name="shipperEmail"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.shipperEmail}
                    onChange={handleChange}
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Phone *</Label>
                  <Input
                    name="shipperPhone"
                    placeholder="+91 98765 43210"
                    value={formData.shipperPhone}
                    onChange={handleChange}
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">GST Number</Label>
                  <Input
                    name="shipperGst"
                    placeholder="18AABCU9603R1Z0"
                    value={formData.shipperGst}
                    onChange={handleChange}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-foreground mb-2 block">Full Address *</Label>
                  <Input
                    name="shipperAddress"
                    placeholder="Street Address"
                    value={formData.shipperAddress}
                    onChange={handleChange}
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">City *</Label>
                  <Input
                    name="shipperCity"
                    placeholder="City"
                    value={formData.shipperCity}
                    onChange={handleChange}
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">State</Label>
                  <Input
                    name="shipperState"
                    placeholder="State"
                    value={formData.shipperState}
                    onChange={handleChange}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Postal Code</Label>
                  <Input
                    name="shipperPostalCode"
                    placeholder="400001"
                    value={formData.shipperPostalCode}
                    onChange={handleChange}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Country</Label>
                  <Select value={formData.originCountry} onValueChange={(value) => handleSelectChange('originCountry', value)}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="USA">USA</SelectItem>
                      <SelectItem value="UK">UK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Consignee Section */}
            <div className="p-8">
              <h3 className="text-lg font-bold text-foreground mb-6">Consignee Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground mb-2 block">Name *</Label>
                  <Input
                    name="consigneeName"
                    placeholder="Full Name"
                    value={formData.consigneeName}
                    onChange={handleChange}
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Email *</Label>
                  <Input
                    name="consigneeEmail"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.consigneeEmail}
                    onChange={handleChange}
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Phone *</Label>
                  <Input
                    name="consigneePhone"
                    placeholder="+91 87654 32109"
                    value={formData.consigneePhone}
                    onChange={handleChange}
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">GST Number</Label>
                  <Input
                    name="consigneeGst"
                    placeholder="18AABCU9603R1Z0"
                    value={formData.consigneeGst}
                    onChange={handleChange}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-foreground mb-2 block">Full Address *</Label>
                  <Input
                    name="consigneeAddress"
                    placeholder="Street Address"
                    value={formData.consigneeAddress}
                    onChange={handleChange}
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">City *</Label>
                  <Input
                    name="consigneeCity"
                    placeholder="City"
                    value={formData.consigneeCity}
                    onChange={handleChange}
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">State</Label>
                  <Input
                    name="consigneeState"
                    placeholder="State"
                    value={formData.consigneeState}
                    onChange={handleChange}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Postal Code</Label>
                  <Input
                    name="consigneePostalCode"
                    placeholder="110001"
                    value={formData.consigneePostalCode}
                    onChange={handleChange}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Country</Label>
                  <Select value={formData.destinationCountry} onValueChange={(value) => handleSelectChange('destinationCountry', value)}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="USA">USA</SelectItem>
                      <SelectItem value="UK">UK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Shipment Details Section */}
            <div className="p-8">
              <h3 className="text-lg font-bold text-foreground mb-6">Shipment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground mb-2 block">Service Type *</Label>
                  <Select value={formData.serviceType} onValueChange={(value: any) => handleSelectChange('serviceType', value)}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="air">Air</SelectItem>
                      <SelectItem value="sea">Sea</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                      <SelectItem value="parcel">Parcel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Shipment Type *</Label>
                  <Select value={formData.shipmentType} onValueChange={(value: any) => handleSelectChange('shipmentType', value)}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="parcel">Parcel</SelectItem>
                      <SelectItem value="cargo">Cargo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Mode of Transport *</Label>
                  <Select value={formData.mode} onValueChange={(value: any) => handleSelectChange('mode', value)}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="air">Air</SelectItem>
                      <SelectItem value="sea">Sea</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Carrier</Label>
                  <Input
                    name="carrier"
                    placeholder="Carrier Name"
                    value={formData.carrier}
                    onChange={handleChange}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Number of Cartons *</Label>
                  <Input
                    name="cartons"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={formData.cartons}
                    onChange={handleChange}
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Total Weight (kg) *</Label>
                  <Input
                    name="weight"
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="5"
                    value={formData.weight}
                    onChange={handleChange}
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Volume (CBM)</Label>
                  <Input
                    name="weightCbm"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData.weightCbm}
                    onChange={handleChange}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Reference Number</Label>
                  <Input
                    name="referenceNumber"
                    placeholder="Reference"
                    value={formData.referenceNumber}
                    onChange={handleChange}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Invoice Value ({formData.currency}) *</Label>
                  <Input
                    name="invoiceValue"
                    type="number"
                    min="0"
                    placeholder="1000"
                    value={formData.invoiceValue}
                    onChange={handleChange}
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleSelectChange('currency', value)}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="INR">INR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Package Type *</Label>
                  <Select value={formData.packageType} onValueChange={(value) => handleSelectChange('packageType', value)}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="CARTON">Carton</SelectItem>
                      <SelectItem value="BUNDLE">Bundle</SelectItem>
                      <SelectItem value="PALLET">Pallet</SelectItem>
                      <SelectItem value="BOX">Box</SelectItem>
                      <SelectItem value="CRATE">Crate</SelectItem>
                      <SelectItem value="DRUM">Drum</SelectItem>
                      <SelectItem value="BAG">Bag</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-foreground mb-2 block">Goods Description *</Label>
                  <Input
                    name="goodsDescription"
                    placeholder="e.g., Finished Leather, Electronics, Garments, Textile Products, Documents"
                    value={formData.goodsDescription}
                    onChange={handleChange}
                    required
                    className="bg-input border-border text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Detailed description of the goods being shipped for POD and invoice documentation</p>
                </div>
              </div>
            </div>

            {/* Document Upload Section */}
            <div className="p-8">
              <h3 className="text-lg font-bold text-foreground mb-6">Upload Documents</h3>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium mb-1">Drag and drop files here</p>
                <p className="text-sm text-muted-foreground mb-4">or</p>
                <label>
                  <span className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg cursor-pointer inline-block">
                    Select Files
                  </span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </label>
                {files.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-foreground mb-2">Selected Files ({files.length}):</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {files.map((file, index) => (
                        <li key={index}>• {file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-8 border-t border-border flex gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Shipment...
                  </>
                ) : (
                  'Create Shipment & Upload Documents'
                )}
              </Button>
              <Button
                type="button"
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex-1 h-12 border-border text-foreground hover:bg-secondary/20"
              >
                Reset
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
}
