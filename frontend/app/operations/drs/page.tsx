'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Plus, Truck, MapPin, Search, Loader2, Printer, Calendar, CheckCircle, Package, Clock, ChevronRight, RotateCcw } from 'lucide-react';
import { apiService } from '@/lib/api';

type DRSStatus = 'created' | 'out_for_delivery' | 'completed';

export default function DRSPage() {
    const [drsList, setDrsList] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [stockItems, setStockItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    // Form state
    const [selectedDriver, setSelectedDriver] = useState('');
    const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
    const [drsDate, setDrsDate] = useState(new Date().toISOString().split('T')[0]);
    const [dateFilter, setDateFilter] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchDRS();
        fetchDrivers();
        fetchStock();
    }, []);


    const fetchDRS = async () => {
        setLoading(true);
        try {
            const json = await apiService.listDRS();
            setDrsList(json.data || []);
        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: 'Failed to fetch DRS' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDrivers = async () => {
        try {
            const json = await apiService.listEmployees({ department: 'operations' }); // Drivers are in operations
            setDrivers(json.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchStock = async () => {
        try {
            const json = await apiService.listShipments({ status: 'received,booked,pending', limit: 100 });
            setStockItems(json.data || []);
        } catch (e) { console.error(e); }
    };

    const handleCreate = async () => {
        if (!selectedDriver || selectedShipments.length === 0) {
            setMessage({ type: 'error', text: 'Select a driver and at least one shipment' }); return;
        }
        try {
            await apiService.createDRS({ driver_id: selectedDriver, shipment_ids: selectedShipments, date: drsDate });
            setMessage({ type: 'success', text: '✅ DRS created successfully!' });
            fetchDRS();
            fetchStock();
            setShowCreate(false);
            setSelectedDriver('');
            setSelectedShipments([]);
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || 'Failed to create DRS' });
        }
    };

    const handleMarkOut = async (id: string) => {
        try {
            await apiService.markDRSOut(id);
            setMessage({ type: 'success', text: '✅ DRS dispatched!' });
            fetchDRS();
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || 'Failed to dispatch' });
        }
    };

    const handlePrint = (drs: any) => {
        const printContent = `
      <html><head><title>DRS - ${drs.drs_number || drs._id}</title>
      <style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}.header{text-align:center;margin-bottom:20px}</style></head>
      <body><div class="header"><h2>Delivery Run Sheet</h2><p>DRS No: ${drs.drs_number || drs._id?.slice(-8)}</p><p>Date: ${drs.date ? new Date(drs.date).toLocaleDateString('en-IN') : 'N/A'}</p><p>Driver: ${drs.driver_id?.name || 'N/A'}</p></div>
      <table><thead><tr><th>S.No</th><th>HAWB</th><th>Consignee</th><th>Address</th><th>Pcs</th><th>Wt (kg)</th><th>Signature</th></tr></thead>
      <tbody>${(drs.shipment_ids || []).map((s: any, i: number) => `<tr><td>${i + 1}</td><td>${s.hawb || ''}</td><td>${s.consignee_id?.name || ''}</td><td>${s.destination_city || ''}</td><td>${s.total_cartons || ''}</td><td>${s.total_weight || ''}</td><td></td></tr>`).join('')}</tbody></table>
      <p style="margin-top:30px">Driver Signature: __________________</p></body></html>`;
        const w = window.open('', '_blank');
        if (w) { w.document.write(printContent); w.document.close(); w.print(); }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            created: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            out_for_delivery: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        };
        return map[status] || 'bg-gray-100 text-gray-800';
    };

    const toggleShipment = (id: string) => {
        setSelectedShipments(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const filteredDRS = dateFilter ? drsList.filter(d => d.date?.startsWith(dateFilter)) : drsList;

    return (
        <MainLayout title="Delivery Run Sheets">
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div><h1 className="text-2xl font-bold text-foreground">Delivery Run Sheets</h1><p className="text-sm text-muted-foreground mt-1">Create and manage delivery run sheets for drivers</p></div>
                    <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> New DRS
                    </button>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                {/* Create DRS Panel */}
                {showCreate && (
                    <div className="bg-card border border-border rounded-xl p-5 mb-4">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Create New DRS</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Driver</label>
                                <select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                    <option value="">Select Driver</option>
                                    {drivers.map(d => <option key={d._id} value={d._id}>{d.name} — {d.phone}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">DRS Date</label>
                                <input type="date" value={drsDate} onChange={e => setDrsDate(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                            </div>
                            <div className="flex items-end">
                                <button onClick={handleCreate} disabled={!selectedDriver || selectedShipments.length === 0} className="h-9 px-5 text-sm font-medium bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50">
                                    Create DRS ({selectedShipments.length} items)
                                </button>
                            </div>
                        </div>

                        {/* Shipment Selection */}
                        <div className="bg-muted/30 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-muted/50">
                                    <tr className="border-b border-border"><th className="px-3 py-2 text-center w-10">✓</th><th className="px-3 py-2 text-left font-semibold">HAWB</th><th className="px-3 py-2 text-left font-semibold">Consignee</th><th className="px-3 py-2 text-left font-semibold">Dest</th><th className="px-3 py-2 text-right font-semibold">Pcs / Wt</th></tr>
                                </thead>
                                <tbody>
                                    {stockItems.map(s => (
                                        <tr key={s._id} onClick={() => toggleShipment(s._id)} className={`border-b border-border/50 cursor-pointer ${selectedShipments.includes(s._id) ? 'bg-primary/10' : 'hover:bg-muted/30'}`}>
                                            <td className="px-3 py-2 text-center"><input type="checkbox" checked={selectedShipments.includes(s._id)} readOnly className="accent-primary" /></td>
                                            <td className="px-3 py-2 font-mono font-bold text-primary">{s.hawb}</td>
                                            <td className="px-3 py-2">{s.consignee_id?.name || '—'}</td>
                                            <td className="px-3 py-2">{s.destination_city || '—'}</td>
                                            <td className="px-3 py-2 text-right">{s.total_cartons} / {s.total_weight}kg</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Date Filter */}
                <div className="bg-card border border-border rounded-xl p-3 mb-4 flex items-end gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Filter by Date</label>
                        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                    </div>
                    {dateFilter && <button onClick={() => setDateFilter('')} className="h-9 px-3 text-xs text-red-500 hover:text-red-700"><RotateCcw className="w-3 h-3" /></button>}
                </div>

                {/* DRS List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...</div>
                    ) : filteredDRS.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
                            <Truck className="w-12 h-12 mb-4 opacity-20" /><p>No delivery run sheets found</p>
                        </div>
                    ) : filteredDRS.map(drs => (
                        <div key={drs._id} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg"><Truck className="w-6 h-6" /></div>
                                    <div>
                                        <p className="font-bold text-lg text-foreground">{drs.drs_number || drs._id?.slice(-8)}</p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Calendar className="w-3 h-3" /> {drs.date ? new Date(drs.date).toLocaleDateString('en-IN') : '—'}
                                            <span className="mx-1">•</span>
                                            Driver: <span className="font-medium text-foreground">{drs.driver_id?.name || '—'}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(drs.status)}`}>{drs.status?.replace(/_/g, ' ') || 'Created'}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6 text-sm">
                                    <div><span className="text-xs text-muted-foreground">Shipments</span><p className="font-bold">{drs.total_shipments || drs.shipment_ids?.length || 0}</p></div>
                                    <div><span className="text-xs text-muted-foreground">Weight</span><p className="font-bold">{drs.total_weight || 0} kg</p></div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handlePrint(drs)} className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted flex items-center gap-1"><Printer className="w-3.5 h-3.5" /> Print</button>
                                    {drs.status === 'created' && (
                                        <button onClick={() => handleMarkOut(drs._id)} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Dispatch</button>
                                    )}
                                    {drs.status === 'out_for_delivery' && (
                                        <button className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Complete</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
}
