'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { FileText, ArrowDown, CheckCircle, Package, Loader2, Calendar, AlertTriangle, RefreshCw, Clock, Search } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

export default function ReceivingPage() {
    const [manifests, setManifests] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'incoming' | 'history'>('incoming');
    const [dateFilter, setDateFilter] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    // Discrepancy
    const [showDiscrepancy, setShowDiscrepancy] = useState<string | null>(null);
    const [discrepancy, setDiscrepancy] = useState({ actual_pieces: '', actual_weight: '', remarks: '', type: 'ok' });

    useEffect(() => { fetchIncoming(); }, []);

    const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}`, 'Content-Type': 'application/json' });

    const fetchIncoming = async () => {
        setLoading(true);
        try {
            const [inRes, histRes] = await Promise.all([
                fetch(`${API_BASE}/manifests?status=dispatched`, { headers: getHeaders() }),
                fetch(`${API_BASE}/manifests?status=received`, { headers: getHeaders() }),
            ]);
            const inJson = await inRes.json();
            const histJson = await histRes.json();
            setManifests(inJson.data || []);
            setHistory(histJson.data || []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleReceive = async (id: string) => {
        if (!confirm('Receive this manifest? Shipment stock will be added to your branch.')) return;
        try {
            const res = await fetch(`${API_BASE}/manifests/${id}/receive`, { method: 'PATCH', headers: getHeaders() });
            if (res.ok) {
                setMessage({ type: 'success', text: '✅ Manifest received successfully!' });
                fetchIncoming();
            }
        } catch (e) { setMessage({ type: 'error', text: 'Failed to receive manifest' }); }
    };

    const filteredManifests = dateFilter ? manifests.filter(m => m.dispatch_date?.startsWith(dateFilter)) : manifests;
    const filteredHistory = dateFilter && activeTab === 'history' ? history.filter(m => m.dispatch_date?.startsWith(dateFilter)) : history;

    return (
        <MainLayout title="Receiving">
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div><h1 className="text-2xl font-bold text-foreground">Inbound Receiving</h1><p className="text-sm text-muted-foreground mt-1">Receive shipments from other branches</p></div>
                    <button onClick={fetchIncoming} className="px-4 py-2 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-0 mb-4 border-b border-border">
                    <button onClick={() => setActiveTab('incoming')} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'incoming' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        <ArrowDown className="w-4 h-4" /> Incoming ({manifests.length})
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        <CheckCircle className="w-4 h-4" /> Received History ({history.length})
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-card border border-border rounded-xl p-3 mb-4 flex items-end gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Filter by Date</label>
                        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                    </div>
                    {dateFilter && <button onClick={() => setDateFilter('')} className="h-9 px-3 text-xs text-red-500 hover:text-red-700">Clear</button>}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...</div>
                ) : activeTab === 'incoming' ? (
                    <div className="space-y-3">
                        {filteredManifests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
                                <Package className="w-12 h-12 mb-4 opacity-20" /><p>No incoming manifests</p>
                            </div>
                        ) : filteredManifests.map(m => (
                            <div key={m._id} className="bg-card border border-border p-5 rounded-xl hover:shadow-sm transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 rounded-lg"><ArrowDown className="w-6 h-6" /></div>
                                        <div>
                                            <p className="font-bold text-lg text-foreground">{m.manifest_number || m._id?.slice(-8)}</p>
                                            <p className="text-sm text-muted-foreground">From: <span className="font-medium text-foreground">{m.origin_branch_id?.branch_name || '—'}</span> • {m.dispatch_date ? new Date(m.dispatch_date).toLocaleDateString('en-IN') : '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Contents</p>
                                            <p className="font-medium text-sm">{m.total_shipments || 0} Shpts / {m.total_weight || 0} kg</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Vehicle</p>
                                            <p className="font-medium text-sm">{m.vehicle_number || '—'}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setShowDiscrepancy(showDiscrepancy === m._id ? null : m._id)} className="px-3 py-1.5 text-sm border border-amber-400 text-amber-600 rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/20 flex items-center gap-1">
                                                <AlertTriangle className="w-3.5 h-3.5" /> Report
                                            </button>
                                            <button onClick={() => handleReceive(m._id)} className="px-4 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium text-sm flex items-center gap-1">
                                                <CheckCircle className="w-3.5 h-3.5" /> Receive
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {showDiscrepancy === m._id && (
                                    <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-muted-foreground">Discrepancy Type</label>
                                            <select value={discrepancy.type} onChange={e => setDiscrepancy({ ...discrepancy, type: e.target.value })} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                                <option value="ok">No Issue</option>
                                                <option value="short">Short Received</option>
                                                <option value="excess">Excess Received</option>
                                                <option value="damaged">Damaged</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-muted-foreground">Actual Pieces</label>
                                            <input value={discrepancy.actual_pieces} onChange={e => setDiscrepancy({ ...discrepancy, actual_pieces: e.target.value })} type="number" placeholder="Pieces" className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-muted-foreground">Actual Weight</label>
                                            <input value={discrepancy.actual_weight} onChange={e => setDiscrepancy({ ...discrepancy, actual_weight: e.target.value })} type="number" placeholder="kg" className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-muted-foreground">Remarks</label>
                                            <input value={discrepancy.remarks} onChange={e => setDiscrepancy({ ...discrepancy, remarks: e.target.value })} placeholder="Details..." className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">Manifest</th>
                                    <th className="px-4 py-3 text-left font-semibold">From</th>
                                    <th className="px-4 py-3 text-left font-semibold">Dispatch Date</th>
                                    <th className="px-4 py-3 text-right font-semibold">Shipments</th>
                                    <th className="px-4 py-3 text-right font-semibold">Weight</th>
                                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredHistory.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No receiving history</td></tr>
                                ) : filteredHistory.map(m => (
                                    <tr key={m._id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 font-bold text-primary">{m.manifest_number || m._id?.slice(-8)}</td>
                                        <td className="px-4 py-3">{m.origin_branch_id?.branch_name || '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{m.dispatch_date ? new Date(m.dispatch_date).toLocaleDateString('en-IN') : '—'}</td>
                                        <td className="px-4 py-3 text-right">{m.total_shipments || 0}</td>
                                        <td className="px-4 py-3 text-right">{m.total_weight || 0} kg</td>
                                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Received</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
