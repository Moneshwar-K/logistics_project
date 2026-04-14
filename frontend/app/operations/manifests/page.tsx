'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Plus, Truck, FileText, ArrowRight, CheckCircle, Loader2, Printer, Calendar, Package, RotateCcw, Search } from 'lucide-react';
import { apiService } from '@/lib/api';


export default function ManifestPage() {
    const [manifests, setManifests] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [available, setAvailable] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    // Create form
    const [destination, setDestination] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [sealNumber, setSealNumber] = useState('');
    const [driverName, setDriverName] = useState('');
    const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
    const [dateFilter, setDateFilter] = useState('');
    const [destFilter, setDestFilter] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchManifests();
        loadBranches();
    }, []);


    const loadBranches = async () => {
        try {
            const data = await apiService.getBranches();
            setBranches(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
    };

    const fetchManifests = async () => {
        setLoading(true);
        try {
            const json = await apiService.listManifests();
            setManifests(json.data || []);
        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: 'Failed to fetch manifests' });
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailable = async (destId: string) => {
        try {
            const json = await apiService.listShipments({
                status: 'received,booked',
                destination_branch: destId,
                limit: 100
            });
            setAvailable(json.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDestChange = (destId: string) => {
        setDestination(destId);
        setSelectedShipments([]);
        if (destId) fetchAvailable(destId);
        else setAvailable([]);
    };

    const handleCreate = async () => {
        if (!destination || selectedShipments.length === 0) {
            setMessage({ type: 'error', text: 'Select destination and at least one shipment' }); return;
        }
        try {
            await apiService.createManifest({
                destination_branch_id: destination,
                shipment_ids: selectedShipments,
                vehicle_number: vehicleNumber,
                seal_number: sealNumber,
                driver_name: driverName,
            });
            setMessage({ type: 'success', text: '✅ Manifest created!' });
            fetchManifests();
            fetchAvailable(destination);
            setShowCreate(false);
            setSelectedShipments([]);
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || 'Failed to create manifest' });
        }
    };

    const handleDispatch = async (id: string) => {
        try {
            await apiService.dispatchManifest(id);
            setMessage({ type: 'success', text: '✅ Manifest dispatched!' });
            fetchManifests();
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || 'Failed to dispatch' });
        }
    };

    const handlePrint = (manifest: any) => {
        const printContent = `
      <html><head><title>Manifest - ${manifest.manifest_number || manifest._id}</title>
      <style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:12px}th{background:#f5f5f5}.header{text-align:center;margin-bottom:15px}.info{display:flex;justify-content:space-between;margin-bottom:10px;font-size:13px}</style></head>
      <body>
      <div class="header"><h2>MANIFEST</h2><p>${manifest.manifest_number || manifest._id?.slice(-8)}</p></div>
      <div class="info"><div>Origin: ${manifest.origin_branch_id?.branch_name || 'N/A'}</div><div>Dest: ${manifest.destination_branch_id?.branch_name || 'N/A'}</div><div>Date: ${manifest.dispatch_date ? new Date(manifest.dispatch_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</div></div>
      <div class="info"><div>Vehicle: ${manifest.vehicle_number || vehicleNumber || 'N/A'}</div><div>Seal: ${manifest.seal_number || sealNumber || 'N/A'}</div><div>Driver: ${manifest.driver_name || driverName || 'N/A'}</div></div>
      <table><thead><tr><th>S.No</th><th>HAWB</th><th>Origin</th><th>Dest</th><th>Pcs</th><th>Wt (kg)</th></tr></thead>
      <tbody>${(manifest.shipment_ids || []).map((s: any, i: number) => `<tr><td>${i + 1}</td><td>${s.hawb || ''}</td><td>${s.origin_city || ''}</td><td>${s.destination_city || ''}</td><td>${s.total_cartons || ''}</td><td>${s.total_weight || ''}</td></tr>`).join('')}</tbody></table>
      <p style="margin-top:15px;font-size:13px">Total: ${manifest.total_shipments || 0} shipments | ${manifest.total_weight || 0} kg</p>
      <p style="margin-top:30px">Received By: __________________ Date: __________</p></body></html>`;
        const w = window.open('', '_blank');
        if (w) { w.document.write(printContent); w.document.close(); w.print(); }
    };

    const toggleShipment = (id: string) => {
        setSelectedShipments(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            created: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            dispatched: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            in_transit: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
            received: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        };
        return map[status] || 'bg-gray-100 text-gray-800';
    };

    const filteredManifests = manifests.filter(m => {
        if (dateFilter && !m.dispatch_date?.startsWith(dateFilter) && !m.created_at?.startsWith(dateFilter)) return false;
        if (destFilter && m.destination_branch_id?._id !== destFilter) return false;
        return true;
    });

    return (
        <MainLayout title="Manifests">
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div><h1 className="text-2xl font-bold text-foreground">Manifests</h1><p className="text-sm text-muted-foreground mt-1">Create, dispatch, and manage inter-branch manifests</p></div>
                    <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> New Manifest
                    </button>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                {/* Create Manifest Panel */}
                {showCreate && (
                    <div className="bg-card border border-border rounded-xl p-5 mb-4">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Create New Manifest</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Destination Branch</label>
                                <select value={destination} onChange={e => handleDestChange(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                    <option value="">Select Branch</option>
                                    {branches.map(b => <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Vehicle Number</label>
                                <input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} placeholder="e.g. TN01 AB 1234" className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm font-mono" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Seal Number</label>
                                <input value={sealNumber} onChange={e => setSealNumber(e.target.value)} placeholder="Seal #" className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Driver Name</label>
                                <input value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Driver Name" className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                            </div>
                        </div>

                        {available.length > 0 && (
                            <div className="bg-muted/30 rounded-lg overflow-hidden max-h-[250px] overflow-y-auto mb-3">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-muted/50">
                                        <tr className="border-b border-border"><th className="px-3 py-2 text-center w-10">✓</th><th className="px-3 py-2 text-left font-semibold">HAWB</th><th className="px-3 py-2 text-left font-semibold">Origin</th><th className="px-3 py-2 text-left font-semibold">Dest</th><th className="px-3 py-2 text-right font-semibold">Pcs / Wt</th></tr>
                                    </thead>
                                    <tbody>
                                        {available.map(s => (
                                            <tr key={s._id} onClick={() => toggleShipment(s._id)} className={`border-b border-border/50 cursor-pointer ${selectedShipments.includes(s._id) ? 'bg-primary/10' : 'hover:bg-muted/30'}`}>
                                                <td className="px-3 py-2 text-center"><input type="checkbox" checked={selectedShipments.includes(s._id)} readOnly className="accent-primary" /></td>
                                                <td className="px-3 py-2 font-mono font-bold text-primary">{s.hawb}</td>
                                                <td className="px-3 py-2">{s.origin_city || '—'}</td>
                                                <td className="px-3 py-2">{s.destination_city || '—'}</td>
                                                <td className="px-3 py-2 text-right">{s.total_cartons} / {s.total_weight}kg</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <button onClick={handleCreate} disabled={!destination || selectedShipments.length === 0} className="h-9 px-5 text-sm font-medium bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50">
                            Create Manifest ({selectedShipments.length} shipments)
                        </button>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-card border border-border rounded-xl p-3 mb-4 flex items-end gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Date Filter</label>
                        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Destination</label>
                        <select value={destFilter} onChange={e => setDestFilter(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                            <option value="">All</option>
                            {branches.map(b => <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    {(dateFilter || destFilter) && <button onClick={() => { setDateFilter(''); setDestFilter(''); }} className="h-9 px-3 text-xs text-red-500 hover:text-red-700"><RotateCcw className="w-3 h-3" /></button>}
                </div>

                {/* Manifest List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...</div>
                    ) : filteredManifests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
                            <Package className="w-12 h-12 mb-4 opacity-20" /><p>No manifests found</p>
                        </div>
                    ) : filteredManifests.map(m => (
                        <div key={m._id} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-lg"><FileText className="w-6 h-6" /></div>
                                    <div>
                                        <p className="font-bold text-lg text-foreground">{m.manifest_number || m._id?.slice(-8)}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {m.origin_branch_id?.branch_name || '—'} <ArrowRight className="w-3 h-3 inline" /> {m.destination_branch_id?.branch_name || '—'}
                                            {m.vehicle_number && <span className="ml-2">• 🚛 {m.vehicle_number}</span>}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(m.status)}`}>{m.status?.replace(/_/g, ' ') || 'Created'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6 text-sm">
                                    <div><span className="text-xs text-muted-foreground">Shipments</span><p className="font-bold">{m.total_shipments || 0}</p></div>
                                    <div><span className="text-xs text-muted-foreground">Weight</span><p className="font-bold">{m.total_weight || 0} kg</p></div>
                                    <div><span className="text-xs text-muted-foreground">Date</span><p className="font-medium">{m.dispatch_date ? new Date(m.dispatch_date).toLocaleDateString('en-IN') : '—'}</p></div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handlePrint(m)} className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted flex items-center gap-1"><Printer className="w-3.5 h-3.5" /> Print</button>
                                    {m.status === 'created' && (
                                        <button onClick={() => handleDispatch(m._id)} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Dispatch</button>
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
