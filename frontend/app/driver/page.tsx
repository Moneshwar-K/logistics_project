'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, MapPin, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

interface DriverAssignment {
  id: string;
  hawb: string;
  shipment_id: string;
  consignee: string;
  consignee_address: string;
  consignee_phone: string;
  status: 'assigned' | 'picked' | 'in_delivery' | 'delivered' | 'exception';
  current_location: string;
  assigned_at: string;
  eta: string;
}

export default function DriverPortalPage() {
  const [assignments, setAssignments] = useState<DriverAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };
      const res = await fetch(`${API_BASE}/driver`, { headers });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        // Map API response to DriverAssignment interface
        const mapped: DriverAssignment[] = data.map((a: any) => ({
          id: a._id || a.id,
          hawb: a.shipment?.hawb || a.hawb || '—',
          shipment_id: a.shipment_id || a.shipment?._id || '',
          consignee: a.shipment?.consignee?.name || a.consignee_name || '—',
          consignee_address: a.shipment?.destination_city || a.consignee_address || '—',
          consignee_phone: a.shipment?.consignee?.contact_phone || a.consignee_phone || '—',
          status: a.status || 'assigned',
          current_location: a.current_location || a.shipment?.origin_city || '—',
          assigned_at: a.assigned_at || a.created_at || new Date().toISOString(),
          eta: a.eta || a.expected_delivery || new Date().toISOString(),
        }));
        setAssignments(mapped);
      } else {
        setAssignments([]);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const pendingAssignments = assignments.filter((a) =>
    ['assigned', 'picked', 'in_delivery'].includes(a.status)
  );

  const completedAssignments = assignments.filter((a) =>
    ['delivered', 'exception'].includes(a.status)
  );

  const displayAssignments = activeTab === 'pending' ? pendingAssignments : completedAssignments;

  const getStatusIcon = (status: DriverAssignment['status']) => {
    switch (status) {
      case 'assigned':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'picked':
        return <Package className="w-5 h-5 text-yellow-600" />;
      case 'in_delivery':
        return <MapPin className="w-5 h-5 text-orange-600" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'exception':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
  };

  return (
    <MainLayout title="Driver Portal">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Driver Dashboard</h1>
          <p className="text-muted-foreground">Manage your deliveries and shipments</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Deliveries</p>
                <p className="text-3xl font-bold text-blue-600">{pendingAssignments.length}</p>
              </div>
              <Truck className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed Today</p>
                <p className="text-3xl font-bold text-green-600">
                  {completedAssignments.filter((a) => 
                    new Date(a.assigned_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {assignments.filter((a) => a.status === 'in_delivery').length}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-yellow-600 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-blue-200">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Pending ({pendingAssignments.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'completed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Completed ({completedAssignments.length})
          </button>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {loading ? (
            <Card className="p-8 text-center text-muted-foreground bg-white border-blue-200">
              Loading assignments...
            </Card>
          ) : displayAssignments.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground bg-white border-blue-200">
              No assignments in this category
            </Card>
          ) : (
            displayAssignments.map((assignment) => (
              <Card
                key={assignment.id}
                className="p-6 bg-white border-blue-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(assignment.status)}
                      <h3 className="text-lg font-semibold text-foreground">{assignment.hawb}</h3>
                      <StatusBadge status={assignment.status as any} />
                    </div>
                    <p className="text-sm text-muted-foreground">{assignment.consignee}</p>
                  </div>
                  <Button className="bg-blue-600 text-white hover:bg-blue-700">
                    {activeTab === 'pending' ? 'Update Status' : 'View Details'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Address</p>
                    <p className="text-foreground font-medium">{assignment.consignee_address}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Contact</p>
                    <p className="text-foreground font-medium">{assignment.consignee_phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                      {activeTab === 'pending' ? 'ETA' : 'Delivered'}
                    </p>
                    <p className="text-foreground font-medium">
                      {new Date(assignment.eta).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-100">
                  <p className="text-xs text-muted-foreground">
                    Current Location: <span className="text-foreground font-medium">{assignment.current_location}</span>
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
