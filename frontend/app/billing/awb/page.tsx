'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Plus, Search, Edit2, Plane, Filter, Package, Calendar } from 'lucide-react';
import Link from 'next/link';
import { apiService } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

interface Awb { _id: string; awb_number: string; airline: string; origin: string; destination: string; total_weight: number; total_pieces: number; status: string; issue_date: string; flight_number?: string; shipment_ids?: any[]; }

const emptyAwb: Partial<Awb> = { awb_number: '', airline: '', origin: 'DEL', destination: 'DXB', status: 'open', issue_date: new Date().toISOString().split('T')[0] };

const InputField = ({ label, value, onChange, type = 'text', required, mono }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; mono?: boolean }) => (
    <div><label className="text-xs font-medium text-muted-foreground mb-1 block">{label}{required && ' *'}</label>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className={`w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${mono ? 'font-mono' : ''}`} /></div>
);

export default function AwbPage() {
    const [awbs, setAwbs] = useState<Awb[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Partial<Awb> | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const getHeaders = () => { const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; return { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }; };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams(); if (search) params.set('awb_number', search);
            const res = await fetch(`${API_BASE}/awbs?${params}`, { headers: getHeaders() });
            const json = await res.json();
            setAwbs(json.data || []);
        } catch { setError('Failed to load data'); } finally { setLoading(false); }
    }, [search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async () => {
        if (!editing?.awb_number || !editing?.airline) { setError('AWB Number and Airline are required'); return; }
        setSaving(true); setError('');
        try {
            const isEdit = !!(editing as Awb)?._id;
            const url = isEdit ? `${API_BASE}/awbs/${(editing as Awb)._id}` : `${API_BASE}/awbs`;
            const res = await fetch(url, { method: isEdit ? 'PATCH' : 'POST', headers: getHeaders(), body: JSON.stringify(editing) });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to save AWB');
            }
            setShowModal(false); setEditing(null); fetchData();
        } catch (e: any) { setError(e.message); } finally { setSaving(false); }
    };

    return (
        <MainLayout title="AWB Management">
            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div><h1 className="text-2xl font-bold text-foreground">AWB Management</h1><p className="text-sm text-muted-foreground mt-1">Track Master Airway Bills and flight details</p></div>
                    <button onClick={() => { setEditing({ ...emptyAwb }); setShowModal(true); setError(''); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm"><Plus className="w-4 h-4" /> Create AWB</button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="text" placeholder="Search AWB Number..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                    <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                        <option value="">All Status</option>
                        <option value="open">Open</option>
                        <option value="loaded">Loaded</option>
                        <option value="departed">Departed</option>
                        <option value="arrived">Arrived</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {awbs.filter(a => !statusFilter || a.status === statusFilter).filter(a => !dateFilter || a.issue_date?.startsWith(dateFilter)).map(awb => (
                        <div key={awb._id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow relative">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <Plane className="w-5 h-5 text-blue-500" />
                                    <span className="font-mono font-bold text-lg">{awb.awb_number}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${awb.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : awb.status === 'loaded' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : awb.status === 'departed' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : awb.status === 'arrived' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'}`}>{awb.status}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground mb-4">
                                <div>Airline: <span className="text-foreground">{awb.airline}</span></div>
                                <div>Flight: <span className="text-foreground">{awb.flight_number || '—'}</span></div>
                                <div>Route: <span className="text-foreground">{awb.origin} → {awb.destination}</span></div>
                                <div>Date: <span className="text-foreground">{new Date(awb.issue_date).toLocaleDateString()}</span></div>
                            </div>

                            <div className="bg-muted/30 rounded-lg p-3 flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">{awb.total_pieces} pcs</span>
                                </div>
                                <span className="text-sm font-medium">{awb.total_weight} kg</span>
                            </div>

                            {awb.shipment_ids && awb.shipment_ids.length > 0 && (
                                <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                                    <Package className="w-3 h-3" /> {awb.shipment_ids.length} HAWBs linked
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                                <button onClick={() => { setEditing(awb); setShowModal(true); }} className="text-xs font-medium text-primary hover:underline flex items-center gap-1"><Edit2 className="w-3 h-3" /> Edit</button>
                            </div>
                        </div>
                    ))}
                </div>

                {awbs.length === 0 && !loading && <div className="text-center py-12 text-muted-foreground">No AWBs found</div>}
            </div>

            {showModal && editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="p-6 border-b border-border"><h2 className="text-lg font-bold">{(editing as Awb)?._id ? 'Edit AWB' : 'Create New AWB'}</h2></div>
                        <div className="p-6 space-y-4">
                            {error && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}
                            <InputField label="AWB Number" value={editing.awb_number || ''} onChange={v => setEditing({ ...editing, awb_number: v })} required mono />
                            <InputField label="Airline" value={editing.airline || ''} onChange={v => setEditing({ ...editing, airline: v })} required />

                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Origin" value={editing.origin || ''} onChange={v => setEditing({ ...editing, origin: v.toUpperCase() })} />
                                <InputField label="Destination" value={editing.destination || ''} onChange={v => setEditing({ ...editing, destination: v.toUpperCase() })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Flight No" value={editing.flight_number || ''} onChange={v => setEditing({ ...editing, flight_number: v })} mono />
                                <InputField label="Issue Date" value={typeof editing.issue_date === 'string' ? editing.issue_date.split('T')[0] : ''} onChange={v => setEditing({ ...editing, issue_date: v })} type="date" />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                                <select value={editing.status || 'open'} onChange={e => setEditing({ ...editing, status: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                    <option value="open">Open</option>
                                    <option value="loaded">Loaded</option>
                                    <option value="departed">Departed</option>
                                    <option value="arrived">Arrived</option>
                                    <option value="closed">Closed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                        </div>
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? 'Saving...' : 'Save AWB'}</button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
