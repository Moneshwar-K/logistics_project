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
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { BookingFormData, Party } from '@/types/logistics';

export default function QuickBookingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    shipperName: '',
    shipperEmail: '',
    shipperPhone: '',
    consigneeName: '',
    consigneeEmail: '',
    consigneePhone: '',
    originCity: 'Mumbai',
    destinationCity: 'Delhi',
    cartons: '1',
    weight: '',
    invoiceValue: '',
    packageType: 'CARTON',
    goodsDescription: '',
    mode: 'air' as const,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        address: '',
        city: formData.originCity,
        state: '',
        postal_code: '',
        country: 'India',
      };

      const consignee: Party = {
        id: '',
        name: formData.consigneeName,
        email: formData.consigneeEmail,
        phone: formData.consigneePhone,
        address: '',
        city: formData.destinationCity,
        state: '',
        postal_code: '',
        country: 'India',
      };

      const bookingData: BookingFormData = {
        shipper,
        consignee,
        origin_city: formData.originCity,
        origin_country: 'India',
        destination_city: formData.destinationCity,
        destination_country: 'India',
        service_type: 'parcel',
        shipment_type: 'parcel',
        total_cartons: parseInt(formData.cartons),
        total_weight: parseFloat(formData.weight),
        invoice_value: parseFloat(formData.invoiceValue),
        invoice_currency: 'INR',
        package_type: formData.packageType,
        goods_description: formData.goodsDescription,
        mode: formData.mode as 'air' | 'sea' | 'land',
      };

      await apiService.createShipment(bookingData);
      setSuccess(true);
      setFormData({
        shipperName: '',
        shipperEmail: '',
        shipperPhone: '',
        consigneeName: '',
        consigneeEmail: '',
        consigneePhone: '',
        originCity: 'Mumbai',
        destinationCity: 'Delhi',
        cartons: '1',
        weight: '',
        invoiceValue: '',
        packageType: 'CARTON',
        goodsDescription: '',
        mode: 'air',
      });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Quick Booking">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Info Card */}
        <Card className="border-border bg-blue-500/10 border-blue-500/50 p-4">
          <p className="text-sm text-blue-200">
            Quick Booking Form - Fill in essential details only. Ideal for fast shipment creation.
          </p>
        </Card>

        {/* Success Message */}
        {success && (
          <Card className="border-status-delivered bg-status-delivered/10 border-status-delivered/50 p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-status-delivered flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Shipment Created Successfully!</p>
              <p className="text-sm text-muted-foreground mt-1">Your HAWB has been generated and is ready for processing.</p>
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
        <Card className="border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Shipper Section */}
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4">Shipper Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground mb-2 block">Name *</Label>
                  <Input
                    name="shipperName"
                    placeholder="John Doe"
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
                    placeholder="john@example.com"
                    value={formData.shipperEmail}
                    onChange={handleChange}
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="md:col-span-2">
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
              </div>
            </div>

            {/* Consignee Section */}
            <div className="border-t border-border pt-8">
              <h3 className="text-lg font-bold text-foreground mb-4">Consignee Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground mb-2 block">Name *</Label>
                  <Input
                    name="consigneeName"
                    placeholder="Jane Smith"
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
                    placeholder="jane@example.com"
                    value={formData.consigneeEmail}
                    onChange={handleChange}
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="md:col-span-2">
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
              </div>
            </div>

            {/* Route Section */}
            <div className="border-t border-border pt-8">
              <h3 className="text-lg font-bold text-foreground mb-4">Shipment Route</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground mb-2 block">Origin City *</Label>
                  <Select value={formData.originCity} onValueChange={(value) => handleSelectChange('originCity', value)}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="Mumbai">Mumbai</SelectItem>
                      <SelectItem value="Delhi">Delhi</SelectItem>
                      <SelectItem value="Bangalore">Bangalore</SelectItem>
                      <SelectItem value="Chennai">Chennai</SelectItem>
                      <SelectItem value="Kolkata">Kolkata</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">Destination City *</Label>
                  <Select value={formData.destinationCity} onValueChange={(value) => handleSelectChange('destinationCity', value)}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="Mumbai">Mumbai</SelectItem>
                      <SelectItem value="Delhi">Delhi</SelectItem>
                      <SelectItem value="Bangalore">Bangalore</SelectItem>
                      <SelectItem value="Chennai">Chennai</SelectItem>
                      <SelectItem value="Kolkata">Kolkata</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Shipment Details Section */}
            <div className="border-t border-border pt-8">
              <h3 className="text-lg font-bold text-foreground mb-4">Shipment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label className="text-foreground mb-2 block">Invoice Value (INR) *</Label>
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
                <div>
                  <Label className="text-foreground mb-2 block">Mode of Transport *</Label>
                  <Select value={formData.mode} onValueChange={(value) => handleSelectChange('mode', value)}>
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
                <div className="md:col-span-2">
                  <Label className="text-foreground mb-2 block">Goods Description *</Label>
                  <Input
                    name="goodsDescription"
                    placeholder="e.g., Finished Leather, Electronics, Garments, Documents"
                    value={formData.goodsDescription}
                    onChange={handleChange}
                    required
                    className="bg-input border-border text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Brief description of the goods being shipped</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-border pt-8 flex gap-3">
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
                  'Create Shipment'
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
