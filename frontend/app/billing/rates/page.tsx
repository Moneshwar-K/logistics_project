'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Plus, Search, Edit2, Trash2, X, Filter, Calculator } from 'lucide-react';
import { apiService } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

interface Rate { _id: string; service_type_id: any; origin_zone: string; destination_zone: string; weight_from: number; weight_to: number; rate_per_kg: number; min_charge: number; fuel_surcharge_pct: number; ess_charge: number; fsc_charge: number; handling_charge_per_carton: number; effective_from: string; status: string; }

const emptyRate: Partial<Rate> = { origin_zone: '', destination_zone: '', weight_from: 0, weight_to: 1000, rate_per_kg: 0, min_charge: 500, fuel_surcharge_pct: 10, ess_charge: 0, fsc_charge: 0, handling_charge_per_carton: 50, effective_from: new Date().toISOString().split('T')[0], status: 'active' };

const InputField = ({ label, value, onChange, type = 'text', required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) => (
    <div><label className="text-xs font-medium text-muted-foreground mb-1 block">{label}{required && ' *'}</label>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
);

export default function RatesPage() {
    const [rates, setRates] = useState<Rate[]>([]);
    const [serviceTypes, setServiceTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Partial<Rate> | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Filters
    const [filterService, setFilterService] = useState('');
    const [filterDestination, setFilterDestination] = useState('');

    const getHeaders = () => { const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; return { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }; };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filterService) params.set('service_type_id', filterService);
            if (filterDestination) params.set('destination_zone', filterDestination);

            const [rateRes, stRes] = await Promise.all([
                fetch(`${API_BASE}/rates?${params}`, { headers: getHeaders() }),
                fetch(`${API_BASE}/service-types`, { headers: getHeaders() })
            ]);

            const rateJson = await rateRes.json();
            const stJson = await stRes.json();

            setRates(rateJson.data || []);
            setServiceTypes(stJson.data || []);
        } catch { setError('Failed to load data'); } finally { setLoading(false); }
    }, [filterService, filterDestination]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async () => {
        if (!editing?.service_type_id || !editing?.origin_zone || !editing?.destination_zone) { setError('Service Type and Zones are required'); return; }
        setSaving(true); setError('');
        try {
            const isEdit = !!(editing as Rate)?._id;
            const url = isEdit ? `${API_BASE}/rates/${(editing as Rate)._id}` : `${API_BASE}/rates`;
            const res = await fetch(url, { method: isEdit ? 'PATCH' : 'POST', headers: getHeaders(), body: JSON.stringify(editing) });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed');
            }
            setShowModal(false); setEditing(null); fetchData();
        } catch (e: any) { setError(e.message); } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => { if (!confirm('Deactivate rate?')) return; try { await fetch(`${API_BASE}/rates/${id}`, { method: 'DELETE', headers: getHeaders() }); fetchData(); } catch { setError('Failed'); } };

    return (
        <MainLayout title="Rate Management">
            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div><h1 className="text-2xl font-bold text-foreground">Rate Cards</h1><p className="text-sm text-muted-foreground mt-1">Manage shipping rates, zones and surcharges</p></div>
                    <button onClick={() => { setEditing({ ...emptyRate }); setShowModal(true); setError(''); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm"><Plus className="w-4 h-4" /> Add Rate</button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><select value={filterService} onChange={e => setFilterService(e.target.value)} className="pl-10 pr-8 py-2.5 bg-card border border-border rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 w-full sm:w-64"><option value="">All Services</option>{serviceTypes.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}</select></div>
                    <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="text" placeholder="Filter by destination..." value={filterDestination} onChange={e => setFilterDestination(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    {loading ? <div className="p-8 text-center text-muted-foreground">Loading rates...</div> : rates.length === 0 ? <div className="p-12 text-center"><Calculator className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">No rates found</p></div> : (
                        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-border bg-muted/30">
                            {['Service', 'Origin', 'Destination', 'Weight Slab', 'Rate/Kg', 'Min Charge', 'Surcharges', 'Actions'].map(h => <th key={h} className={`${h === 'Actions' || h.includes('Charge') || h.includes('Rate') ? 'text-right' : 'text-left'} px-4 py-3 text-xs font-medium text-muted-foreground uppercase`}>{h}</th>)}
                        </tr></thead><tbody className="divide-y divide-border">
                                {rates.map(rate => (
                                    <tr key={rate._id} className={rate.status === 'inactive' ? 'opacity-50 grayscale bg-muted/10' : 'hover:bg-muted/20'}>
                                        <td className="px-4 py-3 text-sm font-medium">{typeof rate.service_type_id === 'object' ? rate.service_type_id.code : '—'}</td>
                                        <td className="px-4 py-3 text-sm">{rate.origin_zone}</td>
                                        <td className="px-4 py-3 text-sm font-medium">{rate.destination_zone}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{rate.weight_from} - {rate.weight_to === 10000 ? '∞' : rate.weight_to} kg</td>
                                        <td className="px-4 py-3 text-sm font-mono text-right">₹{rate.rate_per_kg}</td>
                                        <td className="px-4 py-3 text-sm font-mono text-right">₹{rate.min_charge}</td>
                                        <td className="px-4 py-3 text-xs text-right text-muted-foreground">
                                            <div>Fuel: {rate.fuel_surcharge_pct}%</div>
                                            {(rate.ess_charge > 0 || rate.fsc_charge > 0) && <div>Extra: ₹{rate.ess_charge + rate.fsc_charge}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => { setEditing({ ...rate, service_type_id: rate.service_type_id?._id || rate.service_type_id }); setShowModal(true); setError(''); }} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                                            {rate.status === 'active' && <button onClick={() => handleDelete(rate._id)} className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive ml-1"><Trash2 className="w-4 h-4" /></button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody></table></div>
                    )}
                </div>
            </div>

            {showModal && editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-border"><h2 className="text-lg font-bold">{(editing as Rate)?._id ? 'Edit Rate' : 'Add Rate'}</h2><button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded-md"><X className="w-5 h-5" /></button></div>
                        <div className="p-6 space-y-6">
                            {error && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-3">
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Service Type *</label>
                                    <select value={editing.service_type_id || ''} onChange={e => setEditing({ ...editing, service_type_id: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                        <option value="">Select Service</option>
                                        {serviceTypes.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code}) - {s.mode}</option>)}
                                    </select>
                                </div>
                                <InputField label="Origin Zone *" value={editing.origin_zone || ''} onChange={v => setEditing({ ...editing, origin_zone: v.toUpperCase() })} />
                                <InputField label="Destination Zone *" value={editing.destination_zone || ''} onChange={v => setEditing({ ...editing, destination_zone: v.toUpperCase() })} />
                                <InputField label="Effective From" value={typeof editing.effective_from === 'string' ? editing.effective_from.split('T')[0] : ''} onChange={v => setEditing({ ...editing, effective_from: v })} type="date" />
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-border">
                                <InputField label="Weight From (kg)" value={String(editing.weight_from)} onChange={v => setEditing({ ...editing, weight_from: Number(v) })} type="number" />
                                <InputField label="Weight To (kg)" value={String(editing.weight_to)} onChange={v => setEditing({ ...editing, weight_to: Number(v) })} type="number" />
                                <InputField label="Rate per KG (₹)" value={String(editing.rate_per_kg)} onChange={v => setEditing({ ...editing, rate_per_kg: Number(v) })} type="number" />
                                <InputField label="Min Charge (₹)" value={String(editing.min_charge)} onChange={v => setEditing({ ...editing, min_charge: Number(v) })} type="number" />
                            </div>

                            <h3 className="text-sm font-semibold">Surcharges</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <InputField label="Fuel Surcharge (%)" value={String(editing.fuel_surcharge_pct)} onChange={v => setEditing({ ...editing, fuel_surcharge_pct: Number(v) })} type="number" />
                                <InputField label="ESS Charge (₹)" value={String(editing.ess_charge)} onChange={v => setEditing({ ...editing, ess_charge: Number(v) })} type="number" />
                                <InputField label="FSC Charge (₹)" value={String(editing.fsc_charge)} onChange={v => setEditing({ ...editing, fsc_charge: Number(v) })} type="number" />
                                <InputField label="Handling/Ctn (₹)" value={String(editing.handling_charge_per_carton)} onChange={v => setEditing({ ...editing, handling_charge_per_carton: Number(v) })} type="number" />
                            </div>

                        </div>
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? 'Saving...' : 'Save Rate'}</button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
