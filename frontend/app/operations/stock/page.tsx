'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Package, Search, Box, ArrowRight, RefreshCw, Loader2, Clock, Filter, Download, Truck } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

export default function StockPage() {
    const [stock, setStock] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total_weight: 0, total_pieces: 0, total_shipments: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [destFilter, setDestFilter] = useState('');

    useEffect(() => { fetchStock(); }, []);

    const fetchStock = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/shipments?status=received,booked,pending,picked_up&limit=200`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            const json = await res.json();
            const data = json.data || [];
            setStock(data);
            const total_weight = data.reduce((acc: number, s: any) => acc + (s.total_weight || 0), 0);
            const total_pieces = data.reduce((acc: number, s: any) => acc + (s.total_cartons || 0), 0);
            setStats({ total_weight, total_pieces, total_shipments: data.length });
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const getDaysInStock = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        return Math.floor(diff / 86400000);
    };

    const getAgingColor = (days: number) => {
        if (days <= 1) return 'text-green-600 dark:text-green-400';
        if (days <= 3) return 'text-amber-600 dark:text-amber-400';
        return 'text-red-600 dark:text-red-400';
    };

    const filteredStock = stock.filter(item => {
        if (searchQuery && !(item.hawb || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (statusFilter && item.status !== statusFilter) return false;
        if (destFilter && !(item.destination_city || '').toLowerCase().includes(destFilter.toLowerCase())) return false;
        return true;
    });

    const exportToCSV = () => {
        const headers = ['HAWB', 'Date', 'Destination', 'Shipper', 'PCS', 'Weight', 'Status', 'Days In Stock'];
        const rows = filteredStock.map(s => [
            s.hawb, new Date(s.created_at).toLocaleDateString('en-IN'),
            s.destination_city || '', s.shipper_id?.name || '',
            s.total_cartons, s.total_weight, s.status, getDaysInStock(s.created_at)
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `floor_stock_${new Date().toISOString().split('T')[0]}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    return (
        <MainLayout title="Floor Stock / Day Sheet">
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Floor Stock</h1>
                        <p className="text-sm text-muted-foreground mt-1">Current shipments at origin branch</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={exportToCSV} disabled={filteredStock.length === 0} className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50">
                            <Download className="w-4 h-4" /> Export
                        </button>
                        <button onClick={fetchStock} className="px-4 py-2 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg"><Package className="w-6 h-6" /></div>
                        <div><p className="text-xs text-muted-foreground">Total Shipments</p><p className="text-2xl font-bold text-foreground">{stats.total_shipments}</p></div>
                    </div>
                    <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-lg"><Box className="w-6 h-6" /></div>
                        <div><p className="text-xs text-muted-foreground">Total Pieces</p><p className="text-2xl font-bold text-foreground">{stats.total_pieces}</p></div>
                    </div>
                    <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 rounded-lg"><div className="w-6 h-6 font-bold flex items-center justify-center text-sm">KG</div></div>
                        <div><p className="text-xs text-muted-foreground">Total Weight</p><p className="text-2xl font-bold text-foreground">{stats.total_weight} kg</p></div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[180px]">
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Search HAWB</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="HAWB number..." className="w-full h-9 pl-10 pr-3 rounded-md border border-border bg-background text-foreground text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                <option value="">All</option>
                                <option value="pending">Pending</option>
                                <option value="picked_up">Picked Up</option>
                                <option value="received">Received</option>
                                <option value="booked">Booked</option>
                            </select>
                        </div>
                        <div className="min-w-[150px]">
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Destination</label>
                            <input value={destFilter} onChange={e => setDestFilter(e.target.value)} placeholder="City..." className="h-9 px-3 w-full rounded-md border border-border bg-background text-foreground text-sm" />
                        </div>
                    </div>
                </div>

                {/* Stock Table */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading stock...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold">HAWB</th>
                                        <th className="px-4 py-3 text-left font-semibold">Date</th>
                                        <th className="px-4 py-3 text-left font-semibold">Destination</th>
                                        <th className="px-4 py-3 text-left font-semibold">Shipper</th>
                                        <th className="px-4 py-3 text-right font-semibold">Pcs / Wt</th>
                                        <th className="px-4 py-3 text-center font-semibold">Days</th>
                                        <th className="px-4 py-3 text-right font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredStock.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">
                                            <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                            <p>No stock available</p>
                                        </td></tr>
                                    ) : filteredStock.map(item => {
                                        const days = getDaysInStock(item.created_at);
                                        return (
                                            <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-mono font-bold text-primary">{item.hawb}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{new Date(item.created_at).toLocaleDateString('en-IN')}</td>
                                                <td className="px-4 py-3">{item.destination_branch_id?.branch_name || item.destination_city || '—'}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{item.shipper_id?.name || '—'}</td>
                                                <td className="px-4 py-3 text-right font-mono">{item.total_cartons} / {item.total_weight} kg</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center gap-1 font-bold ${getAgingColor(days)}`}>
                                                        <Clock className="w-3 h-3" /> {days}d
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 capitalize">{item.status?.replace(/_/g, ' ')}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {filteredStock.length > 0 && (
                                    <tfoot>
                                        <tr className="bg-muted/30 font-semibold border-t-2 border-border">
                                            <td colSpan={4} className="px-4 py-3">TOTALS ({filteredStock.length} shipments)</td>
                                            <td className="px-4 py-3 text-right">{filteredStock.reduce((s, i) => s + (i.total_cartons || 0), 0)} / {filteredStock.reduce((s, i) => s + (i.total_weight || 0), 0)} kg</td>
                                            <td colSpan={2} className="px-4 py-3"></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
