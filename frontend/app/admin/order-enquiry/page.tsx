'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { apiService } from '@/lib/api';
import { Search, Loader2, Eye, RotateCcw, Package, Calendar } from 'lucide-react';

interface OrderItem {
    _id: string;
    hawb: string;
    created_at: string;
    origin_city: string;
    destination_city: string;
    total_weight: number;
    total_cartons: number;
    status: string;
    service_type: string;
    shipper_id?: any;
    consignee_id?: any;
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    picked_up: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    in_transit: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function OrderEnquiryPage() {
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

    const handleSearch = useCallback(async () => {
        setLoading(true);
        try {
            const filters: any = { limit: 200 };
            if (dateFrom) filters.date_from = dateFrom;
            if (dateTo) filters.date_to = dateTo;
            if (statusFilter) filters.status = statusFilter;
            const response = await apiService.listShipments(filters);
            let data: OrderItem[] = (response?.data || []) as any[];
            if (!Array.isArray(data)) data = [];
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                data = data.filter(o =>
                    (o.hawb || '').toLowerCase().includes(q) ||
                    (o.shipper_id?.name || '').toLowerCase().includes(q) ||
                    (o.consignee_id?.name || '').toLowerCase().includes(q)
                );
            }
            setOrders(data);
        } catch (err) {
            console.error('Search failed:', err);
            setOrders([]);
        } finally { setLoading(false); }
    }, [dateFrom, dateTo, statusFilter, searchQuery]);

    const handleReset = () => {
        setDateFrom(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
        setDateTo(new Date().toISOString().split('T')[0]);
        setStatusFilter(''); setSearchQuery(''); setOrders([]);
        setSelectedOrder(null);
    };

    return (
        <MainLayout title="Order Enquiry View">
            <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Order Enquiry View</h1>
                    <p className="text-sm text-muted-foreground mt-1">Search and view order details</p>
                </div>

                {/* Filters */}
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">From Date</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">To Date</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Status</label>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                <option value="">All</option>
                                <option value="pending">Pending</option>
                                <option value="picked_up">Picked Up</option>
                                <option value="in_transit">In Transit</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1 min-w-[200px]">
                            <label className="text-xs font-medium text-muted-foreground">Search (HAWB, Client)</label>
                            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="HAWB No or Client Name" className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                        </div>
                        <button onClick={handleSearch} className="h-9 px-5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2">
                            <Search className="w-4 h-4" /> Search
                        </button>
                        <button onClick={handleReset} className="h-9 px-4 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2">
                            <RotateCcw className="w-4 h-4" /> Reset
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Order List */}
                    <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Searching...</div>
                        ) : orders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <Package className="w-12 h-12 mb-4 opacity-20" />
                                <p className="font-medium">No orders found</p>
                                <p className="text-sm mt-1">Use filters and click Search</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border">
                                            <th className="px-3 py-2.5 text-left font-semibold">S.N</th>
                                            <th className="px-3 py-2.5 text-left font-semibold">HAWB No</th>
                                            <th className="px-3 py-2.5 text-left font-semibold">Date</th>
                                            <th className="px-3 py-2.5 text-left font-semibold">Shipper</th>
                                            <th className="px-3 py-2.5 text-left font-semibold">Origin → Dest</th>
                                            <th className="px-3 py-2.5 text-right font-semibold">PCS / WT</th>
                                            <th className="px-3 py-2.5 text-left font-semibold">Status</th>
                                            <th className="px-3 py-2.5 text-center font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((o, i) => (
                                            <tr key={o._id} className={`border-b border-border/50 cursor-pointer transition-colors ${selectedOrder?._id === o._id ? 'bg-primary/10' : 'hover:bg-muted/30'}`} onClick={() => setSelectedOrder(o)}>
                                                <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                                                <td className="px-3 py-2.5 font-mono font-bold text-primary">{o.hawb}</td>
                                                <td className="px-3 py-2.5 text-muted-foreground">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                                                <td className="px-3 py-2.5">{o.shipper_id?.name || '—'}</td>
                                                <td className="px-3 py-2.5">{o.origin_city || '—'} → {o.destination_city || '—'}</td>
                                                <td className="px-3 py-2.5 text-right">{o.total_cartons}/{o.total_weight}kg</td>
                                                <td className="px-3 py-2.5"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-800'}`}>{o.status?.replace(/_/g, ' ')}</span></td>
                                                <td className="px-3 py-2.5 text-center"><button className="text-primary hover:text-primary/80"><Eye className="w-4 h-4" /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Order Detail Panel */}
                    <div className="bg-card border border-border rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-3">Order Details</h3>
                        {selectedOrder ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="text-xs text-muted-foreground block">HAWB No</span><span className="font-mono font-bold text-primary">{selectedOrder.hawb}</span></div>
                                    <div><span className="text-xs text-muted-foreground block">Date</span><span>{new Date(selectedOrder.created_at).toLocaleDateString('en-IN')}</span></div>
                                    <div><span className="text-xs text-muted-foreground block">Service</span><span className="capitalize">{selectedOrder.service_type}</span></div>
                                    <div><span className="text-xs text-muted-foreground block">Status</span><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[selectedOrder.status] || 'bg-gray-100 text-gray-800'}`}>{selectedOrder.status?.replace(/_/g, ' ')}</span></div>
                                </div>
                                <hr className="border-border" />
                                <div className="text-sm">
                                    <span className="text-xs text-muted-foreground block mb-1">Shipper</span>
                                    <span className="font-medium">{selectedOrder.shipper_id?.name || '—'}</span>
                                </div>
                                <div className="text-sm">
                                    <span className="text-xs text-muted-foreground block mb-1">Consignee</span>
                                    <span className="font-medium">{selectedOrder.consignee_id?.name || '—'}</span>
                                </div>
                                <hr className="border-border" />
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="text-xs text-muted-foreground block">Origin</span><span>{selectedOrder.origin_city || '—'}</span></div>
                                    <div><span className="text-xs text-muted-foreground block">Destination</span><span>{selectedOrder.destination_city || '—'}</span></div>
                                    <div><span className="text-xs text-muted-foreground block">Pieces</span><span className="font-bold">{selectedOrder.total_cartons}</span></div>
                                    <div><span className="text-xs text-muted-foreground block">Weight</span><span className="font-bold">{selectedOrder.total_weight} kg</span></div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Eye className="w-8 h-8 mb-3 opacity-20" />
                                <p className="text-sm">Select an order to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
