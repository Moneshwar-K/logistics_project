'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiService } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';
import { Search, Plus, Filter, Package, Truck, CheckCircle, Clock, AlertCircle, Eye, FileText } from 'lucide-react';
import Link from 'next/link';
import type { Shipment, ShipmentFilters } from '@/types/logistics';

export default function ShipmentsListPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchShipments();
  }, [searchTerm, statusFilter]);

  const fetchShipments = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiService.listShipments({
        hawb: searchTerm || undefined,
        status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
        limit: 100,
      });
      setShipments(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: 'Total',
      value: shipments.length,
      icon: <Package className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50',
    },
    {
      label: 'In Transit',
      value: shipments.filter(s => s.status === 'in_transit').length,
      icon: <Truck className="w-5 h-5 text-yellow-600" />,
      bg: 'bg-yellow-50',
    },
    {
      label: 'Delivered',
      value: shipments.filter(s => s.status === 'delivered').length,
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      bg: 'bg-green-50',
    },
    {
      label: 'Pending',
      value: shipments.filter(s => s.status === 'pending').length,
      icon: <Clock className="w-5 h-5 text-orange-600" />,
      bg: 'bg-orange-50',
    },
  ];

  return (
    <MainLayout title="All Shipments">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Shipments</h1>
            <p className="text-muted-foreground">Manage and track all shipments</p>
          </div>
          <Link href="/shipments/booking/manual">
            <Button className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Shipment
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <Card key={idx} className={`p-4 ${stat.bg} border-blue-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                {stat.icon}
              </div>
            </Card>
          ))}
        </div>

        {/* Search & Filter */}
        <Card className="p-6 mb-6 bg-white border-blue-200">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by HAWB, AWB, or reference number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                  className="pl-10 border-blue-200"
                />
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-blue-200 bg-white text-foreground text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="picked_up">Picked Up</option>
                <option value="in_transit">In Transit</option>
                <option value="ready_for_delivery">Ready for Delivery</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="on_hold">On Hold</option>
                <option value="exception">Exception</option>
              </select>

              <Link href="/shipments/booking/quick">
                <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
                  <Plus className="w-4 h-4 mr-2" />
                  Quick Entry
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <Card className="bg-red-50 border-red-200 p-4 mb-6 text-red-800">
            {error}
          </Card>
        )}

        {/* Shipments Table */}
        <Card className="overflow-hidden bg-white border-blue-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50 border-b border-blue-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">HAWB</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Shipper</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Weight</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      Loading shipments...
                    </td>
                  </tr>
                ) : shipments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      No shipments found
                    </td>
                  </tr>
                ) : (
                  shipments.map((shipment: any) => (
                    <tr key={shipment.id || shipment._id} className="border-b border-blue-100 hover:bg-blue-50">
                      <td className="px-6 py-4">
                        <Link href={`/shipments/${shipment.id || shipment._id}`}>
                          <span className="font-mono text-sm font-bold text-blue-600 hover:underline cursor-pointer">{shipment.hawb}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-foreground">
                          {shipment.origin_city} → {shipment.destination_city}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {shipment.origin_country} → {shipment.destination_country}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {shipment.shipper?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {shipment.total_weight ? `${shipment.total_weight.toFixed(2)} kg` : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={shipment.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(shipment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/tracking/admin?hawb=${shipment.hawb}`}>
                            <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
