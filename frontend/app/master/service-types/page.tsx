'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Plus, Search, Edit2, Trash2, X, Globe, Zap, Clock } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

interface ServiceType { _id: string; code: string; name: string; description?: string; mode: string; is_express: boolean; transit_days: number; status: string; }

const emptyServiceType: Partial<ServiceType> = { code: '', name: '', description: '', mode: 'air', is_express: false, transit_days: 1 };
const modes = [{ value: 'air', label: 'Air' }, { value: 'sea', label: 'Sea' }, { value: 'surface', label: 'Surface' }, { value: 'train', label: 'Train' }, { value: 'parcel', label: 'Parcel' }, { value: 'express', label: 'Express' }];

export default function ServiceTypesPage() {
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Partial<ServiceType> | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const getHeaders = () => { const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; return { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }; };

    const fetchData = useCallback(async () => {
        try { setLoading(true); const res = await fetch(`${API_BASE}/service-types`, { headers: getHeaders() }); const json = await res.json(); setServiceTypes(json.data || []); } catch { setError('Failed to load'); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async () => {
        if (!editing?.code || !editing?.name) { setError('Code and Name are required'); return; }
        setSaving(true); setError('');
        try { const isEdit = !!(editing as ServiceType)?._id; const url = isEdit ? `${API_BASE}/service-types/${(editing as ServiceType)._id}` : `${API_BASE}/service-types`; const res = await fetch(url, { method: isEdit ? 'PATCH' : 'POST', headers: getHeaders(), body: JSON.stringify(editing) }); if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Failed'); } setShowModal(false); setEditing(null); fetchData(); } catch (e: any) { setError(e.message); } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => { if (!confirm('Deactivate?')) return; try { await fetch(`${API_BASE}/service-types/${id}`, { method: 'DELETE', headers: getHeaders() }); fetchData(); } catch { setError('Failed'); } };

    return (
        <MainLayout title="Service Types">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div><h1 className="text-2xl font-bold text-foreground">Service Types</h1><p className="text-sm text-muted-foreground mt-1">Manage shipping service types and modes</p></div>
                    <button onClick={() => { setEditing({ ...emptyServiceType }); setShowModal(true); setError(''); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm"><Plus className="w-4 h-4" /> Add Service Type</button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[{ label: 'Total', value: serviceTypes.length, c: 'text-blue-400', icon: Globe }, { label: 'Air', value: serviceTypes.filter(s => s.mode === 'air').length, c: 'text-cyan-400', icon: Globe }, { label: 'Express', value: serviceTypes.filter(s => s.is_express).length, c: 'text-amber-400', icon: Zap }, { label: 'Avg Transit', value: serviceTypes.length ? Math.round(serviceTypes.reduce((a, s) => a + s.transit_days, 0) / serviceTypes.length) + 'd' : '—', c: 'text-green-400', icon: Clock }].map((s, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-4"><div className="flex items-center gap-3"><s.icon className={`w-5 h-5 ${s.c}`} /><div><p className="text-2xl font-bold text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></div></div>
                    ))}
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    {loading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : serviceTypes.length === 0 ? <div className="p-12 text-center"><Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">No service types found</p></div> : (
                        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-border bg-muted/30">
                            {['Code', 'Name', 'Mode', 'Express', 'Transit Days', 'Description', 'Actions'].map(h => <th key={h} className={`${h === 'Actions' ? 'text-right' : 'text-left'} px-4 py-3 text-xs font-medium text-muted-foreground uppercase`}>{h}</th>)}
                        </tr></thead><tbody className="divide-y divide-border">
                                {serviceTypes.map(st => (
                                    <tr key={st._id} className="hover:bg-muted/20">
                                        <td className="px-4 py-3 text-sm font-mono font-medium">{st.code}</td>
                                        <td className="px-4 py-3 text-sm font-medium">{st.name}</td>
                                        <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st.mode === 'air' ? 'bg-cyan-500/10 text-cyan-400' : st.mode === 'sea' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>{st.mode}</span></td>
                                        <td className="px-4 py-3">{st.is_express ? <Zap className="w-4 h-4 text-amber-400" /> : <span className="text-muted-foreground">—</span>}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{st.transit_days} days</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">{st.description || '—'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => { setEditing({ ...st }); setShowModal(true); setError(''); }} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(st._id)} className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive ml-1"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody></table></div>
                    )}
                </div>
            </div>

            {showModal && editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-border"><h2 className="text-lg font-bold">{(editing as ServiceType)?._id ? 'Edit Service Type' : 'Add Service Type'}</h2><button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded-md"><X className="w-5 h-5" /></button></div>
                        <div className="p-6 space-y-4">
                            {error && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Code *</label><input type="text" value={editing.code || ''} onChange={e => setEditing({ ...editing, code: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono uppercase" /></div>
                                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label><input type="text" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Mode</label><select value={editing.mode || 'air'} onChange={e => setEditing({ ...editing, mode: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">{modes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
                                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Transit Days</label><input type="number" min="1" value={editing.transit_days || 1} onChange={e => setEditing({ ...editing, transit_days: Number(e.target.value) })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                            </div>
                            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label><textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" /></div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={editing.is_express || false} onChange={e => setEditing({ ...editing, is_express: e.target.checked })} className="w-4 h-4 rounded border-border" />
                                <span className="text-sm text-foreground">Express Service</span>
                            </label>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
