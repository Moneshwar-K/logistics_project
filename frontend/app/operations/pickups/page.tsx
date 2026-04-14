'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Plus, Search, MapPin, Truck, CheckCircle, Calendar, Filter, User, X, Loader2 } from 'lucide-react';
import { apiService } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

interface Pickup {
    pickup_id: string;
    _id: string;
    customer_id: any;
    pickup_date: string;
    time_slot: string;
    address: string;
    city: string;
    estimated_weight: number;
    estimated_pieces: number;
    status: 'pending' | 'assigned' | 'picked_up' | 'cancelled';
    driver_id?: any;
}

export default function PickupPage() {
    const [pickups, setPickups] = useState<Pickup[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [customerFilter, setCustomerFilter] = useState('');

    // Create Form State
    const [formData, setFormData] = useState({
        customer_id: '',
        pickup_date: new Date().toISOString().split('T')[0],
        time_slot: '10:00 AM - 02:00 PM',
        address: '',
        city: 'Delhi',
        pincode: '',
        contact_person: '',
        contact_phone: '',
        estimated_weight: '',
        estimated_pieces: '',
        description: ''
    });

    // Master Data for Selects
    const [customers, setCustomers] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);

    const getHeaders = () => { const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; return { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }; };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [pRes, cRes, dRes] = await Promise.all([
                fetch(`${API_BASE}/pickups`, { headers: getHeaders() }),
                fetch(`${API_BASE}/parties?type=shipper`, { headers: getHeaders() }),
                fetch(`${API_BASE}/employees?role=driver`, { headers: getHeaders() }) // Assuming query param works
            ]);

            const pJson = await pRes.json();
            const cJson = await cRes.json();
            const dJson = await dRes.json();

            setPickups(pJson.data || []);
            setCustomers(cJson.data || []);
            setDrivers(dJson.data || []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSubmit = async () => {
        try {
            // Quick validation
            if (!formData.customer_id || !formData.address) return alert('Fill required fields');

            const res = await fetch(`${API_BASE}/pickups`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed');
            setShowModal(false);
            fetchData();
        } catch (e: any) { alert(e.message); }
    };

    const handleAssign = async (pickupId: string, driverId: string) => {
        try {
            await fetch(`${API_BASE}/pickups/${pickupId}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ driver_id: driverId })
            });
            fetchData();
        } catch (e) { alert('Failed to assign'); }
    };

    const handleMarkPicked = async (pickupId: string) => {
        if (!confirm('Mark as picked up? This requires creating a shipment (next step). For now just updating status.')) return;
        try {
            await fetch(`${API_BASE}/pickups/${pickupId}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ status: 'picked_up' })
            });
            fetchData();
        } catch (e) { alert('Failed'); }
    };

    const handleCancel = async (pickupId: string) => {
        const reason = prompt('Enter cancellation reason:');
        if (!reason) return;
        try {
            await fetch(`${API_BASE}/pickups/${pickupId}`, {
                method: 'PATCH', headers: getHeaders(),
                body: JSON.stringify({ status: 'cancelled', cancellation_reason: reason })
            });
            fetchData();
        } catch (e) { alert('Failed to cancel'); }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: any = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            picked_up: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        };
        return <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${colors[status] || 'bg-gray-100'}`}>{status.replace('_', ' ')}</span>;
    };

    return (
        <MainLayout title="Pickup Management">
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div><h1 className="text-2xl font-bold text-foreground">Pickups</h1><p className="text-sm text-muted-foreground mt-1">Manage pickup requests and driver assignments</p></div>
                    <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium"><Plus className="w-4 h-4" /> New Request</button>
                </div>

                {/* Filters */}
                <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap items-end gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Date</label>
                        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Customer</label>
                        <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                            <option value="">All</option>
                            {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Status</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                            <option value="">All</option>
                            <option value="pending">Pending</option>
                            <option value="assigned">Assigned</option>
                            <option value="picked_up">Picked Up</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    {(dateFilter || statusFilter || customerFilter) && <button onClick={() => { setDateFilter(''); setStatusFilter(''); setCustomerFilter(''); }} className="h-9 px-2 text-xs text-red-500">Clear</button>}
                </div>

                {/* List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pickups
                        .filter(p => !dateFilter || p.pickup_date?.startsWith(dateFilter))
                        .filter(p => !statusFilter || p.status === statusFilter)
                        .filter(p => !customerFilter || p.customer_id?._id === customerFilter || p.customer_id === customerFilter)
                        .map(pickup => (
                            <div key={pickup._id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-primary/10 p-2 rounded-lg text-primary"><Truck className="w-5 h-5" /></div>
                                        <div>
                                            <p className="font-bold text-sm">{pickup.pickup_id}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(pickup.pickup_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <StatusBadge status={pickup.status} />
                                </div>

                                <div className="space-y-2 text-sm mb-4">
                                    <div className="flex items-center gap-2 text-foreground"><User className="w-3.5 h-3.5 text-muted-foreground" /> <span className="font-medium">{pickup.customer_id?.name || 'Unknown Client'}</span></div>
                                    <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="w-3.5 h-3.5 mt-0.5" /> <span className="line-clamp-2">{pickup.address}, {pickup.city}</span></div>
                                    <div className="flex items-center gap-2 text-muted-foreground ml-5 text-xs"><span>{pickup.estimated_weight} kg</span> • <span>{pickup.estimated_pieces} pcs</span></div>
                                </div>

                                {/* Actions / Assignment */}
                                <div className="border-t border-border pt-3 mt-auto">
                                    {pickup.status === 'pending' || pickup.status === 'assigned' ? (
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={pickup.driver_id?._id || pickup.driver_id || ''}
                                                onChange={(e) => handleAssign(pickup._id, e.target.value)}
                                                className="flex-1 text-xs border border-border rounded p-1.5 bg-background"
                                            >
                                                <option value="">Select Driver...</option>
                                                {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                            </select>
                                            {pickup.status === 'assigned' && (
                                                <button onClick={() => handleMarkPicked(pickup._id)} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200" title="Mark Picked Up"><CheckCircle className="w-4 h-4" /></button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-muted-foreground italic">Completed / Cancelled</div>
                                    )}
                                    {pickup.driver_id && <p className="text-xs text-green-600 dark:text-green-400 mt-1">Assigned: {pickup.driver_id.name || 'Driver'}</p>}
                                    {pickup.status === 'pending' && (
                                        <button onClick={() => handleCancel(pickup._id)} className="text-xs text-red-500 hover:text-red-700 mt-1 flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                                    )}
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* Basic Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-card w-full max-w-lg p-6 rounded-xl border border-border shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-bold mb-4">New Pickup Request</h2>
                        <div className="space-y-3">
                            <div><label className="text-xs font-semibold block mb-1">Customer</label>
                                <select className="w-full text-sm border rounded p-2" value={formData.customer_id} onChange={e => setFormData({ ...formData, customer_id: e.target.value })}>
                                    <option value="">Select Customer</option>
                                    {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select></div>

                            <div className="grid grid-cols-2 gap-3">
                                <input type="date" className="border rounded p-2 text-sm" value={formData.pickup_date} onChange={e => setFormData({ ...formData, pickup_date: e.target.value })} />
                                <select className="w-full text-sm border border-border rounded-md p-2 bg-background text-foreground" value={formData.time_slot} onChange={e => setFormData({ ...formData, time_slot: e.target.value })}>
                                    <option value="08:00 AM - 12:00 PM">Morning (8AM-12PM)</option>
                                    <option value="12:00 PM - 04:00 PM">Afternoon (12PM-4PM)</option>
                                    <option value="04:00 PM - 08:00 PM">Evening (4PM-8PM)</option>
                                </select>
                            </div>

                            <input type="text" placeholder="Address" className="w-full border rounded p-2 text-sm" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" placeholder="City" className="border rounded p-2 text-sm" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                <input type="text" placeholder="Pincode" className="border rounded p-2 text-sm" value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" placeholder="Contact Person" className="border rounded p-2 text-sm" value={formData.contact_person} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} />
                                <input type="text" placeholder="Phone" className="border rounded p-2 text-sm" value={formData.contact_phone} onChange={e => setFormData({ ...formData, contact_phone: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <input type="number" placeholder="Est. Weight (kg)" className="border rounded p-2 text-sm" value={formData.estimated_weight} onChange={e => setFormData({ ...formData, estimated_weight: e.target.value })} />
                                <input type="number" placeholder="Est. Pieces" className="border rounded p-2 text-sm" value={formData.estimated_pieces} onChange={e => setFormData({ ...formData, estimated_pieces: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border rounded">Cancel</button>
                            <button onClick={handleSubmit} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded">Create Request</button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
