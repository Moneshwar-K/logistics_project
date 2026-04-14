'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Search, CheckCircle, Clock, AlertCircle, Download, Eye, TrendingUp, Filter } from 'lucide-react';
import Link from 'next/link';

interface EWayBill {
  id: string;
  eway_bill_number: string;
  hawb: string;
  shipment_id: string;
  consignor_gstin: string;
  consignee_gstin: string;
  total_value: number;
  vehicle_number: string;
  status: 'generated' | 'in_transit' | 'delivered' | 'expired';
  valid_till: string;
  created_at: string;
  origin_city?: string;
  destination_city?: string;
  consignor_name?: string;
}

export default function EWayBillsPage() {
  const [ewayBills, setEWayBills] = useState<EWayBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | EWayBill['status']>('all');

  useEffect(() => {
    fetchEWayBills();
  }, []);

  const fetchEWayBills = async () => {
    setLoading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };
      const res = await fetch(`${API_BASE}/eway-bills`, { headers });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        const mapped: EWayBill[] = data.map((b: any) => ({
          id: b._id || b.id,
          eway_bill_number: b.eway_bill_number || b.ewb_number || '—',
          hawb: b.shipment?.hawb || b.hawb || '—',
          shipment_id: b.shipment_id || '',
          consignor_gstin: b.consignor_gstin || '—',
          consignee_gstin: b.consignee_gstin || '—',
          total_value: b.total_invoice_value || b.total_value || 0,
          vehicle_number: b.vehicle_number || '—',
          status: b.status || 'generated',
          valid_till: b.valid_till || b.valid_upto || new Date().toISOString(),
          created_at: b.created_at || new Date().toISOString(),
          origin_city: b.shipment?.origin_city || b.from_place || '',
          destination_city: b.shipment?.destination_city || b.to_place || '',
          consignor_name: b.consignor_name || '',
        }));
        setEWayBills(mapped);
      } else {
        setEWayBills([]);
      }
    } catch (error) {
      console.error('Failed to fetch e-way bills:', error);
      setEWayBills([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = ewayBills.filter((bill) => {
    const matchesSearch = bill.eway_bill_number.includes(searchTerm) ||
      bill.hawb.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || bill.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: EWayBill['status']) => {
    switch (status) {
      case 'generated':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'in_transit':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusBadgeColor = (status: EWayBill['status']) => {
    const colors: Record<EWayBill['status'], string> = {
      generated: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-yellow-100 text-yellow-800',
      delivered: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const stats = [
    {
      label: 'Total E-Bills',
      value: ewayBills.length,
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50',
    },
    {
      label: 'In Transit',
      value: ewayBills.filter(b => b.status === 'in_transit').length,
      icon: <Clock className="w-5 h-5 text-yellow-600" />,
      bg: 'bg-yellow-50',
    },
    {
      label: 'Delivered',
      value: ewayBills.filter(b => b.status === 'delivered').length,
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      bg: 'bg-green-50',
    },
  ];

  return (
    <MainLayout title="E-Way Bills">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">E-Way Bills</h1>
            <p className="text-muted-foreground">Manage and track GST e-way bill status</p>
          </div>
          <Link href="/eway-bills/generate">
            <Button className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Generate E-Way Bill
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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

        {/* Filters */}
        <Card className="p-6 mb-6 bg-white border-blue-200">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by e-bill number, HAWB, or consignor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-blue-200"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | EWayBill['status'])}
                className="px-4 py-2 rounded-lg border border-blue-200 bg-white text-foreground text-sm"
              >
                <option value="all">All Status</option>
                <option value="generated">Generated</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </Card>

        {/* E-Way Bills Table */}
        <Card className="overflow-hidden bg-white border-blue-200">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading e-way bills...</div>
          ) : filteredBills.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No e-way bills found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-blue-200 bg-blue-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">E-Bill #</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">HAWB</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Consignor</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Valid Till</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill) => (
                    <tr key={bill.id} className="border-b border-blue-100 hover:bg-blue-50">
                      <td className="px-6 py-4 text-sm">
                        <span className="font-mono font-bold text-blue-600">{bill.eway_bill_number}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{bill.hawb}</td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        <div>{bill.consignor_name || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">{bill.consignor_gstin}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {bill.origin_city ? `${bill.origin_city} → ${bill.destination_city}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{bill.vehicle_number}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-foreground">₹{bill.total_value.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(bill.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(bill.status)}`}>
                            {bill.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(bill.valid_till).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
