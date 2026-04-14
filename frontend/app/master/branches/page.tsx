'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Plus, Search, Edit2, Trash2, X, Building2, Filter } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

interface Branch {
    _id: string;
    name: string;
    code: string;
    branch_type: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    zone: string;
    gst_number?: string;
    contact_email: string;
    contact_phone: string;
    manager_name?: string;
    manager_phone?: string;
    bank_details?: {
        bank_name: string;
        account_number: string;
        ifsc_code: string;
        account_holder: string;
        branch: string;
    };
    weight_config?: {
        min_weight: number;
        max_weight: number;
        dimensional_factor: number;
    };
    accounts_config?: {
        ledger_name: string;
        ledger_code: string;
    };
    status: string;
}

const emptyBranch: Partial<Branch> = {
    name: '', code: '', branch_type: 'origin', address: '', city: '', state: '', pincode: '', country: 'India', zone: '',
    gst_number: '', contact_email: '', contact_phone: '', manager_name: '', manager_phone: '',
    bank_details: { bank_name: '', account_number: '', ifsc_code: '', account_holder: '', branch: '' },
    weight_config: { min_weight: 0, max_weight: 0, dimensional_factor: 5000 },
    accounts_config: { ledger_name: '', ledger_code: '' }
};

const branchTypes = [{ value: 'origin', label: 'Origin' }, { value: 'destination', label: 'Destination' }, { value: 'hub', label: 'Hub' }, { value: 'warehouse', label: 'Warehouse' }];

const InputField = ({ label, value, onChange, required, mono, type }: { label: string; value: string | number; onChange: (v: string) => void; required?: boolean; mono?: boolean; type?: string }) => (
    <div><label className="text-xs font-medium text-muted-foreground mb-1 block">{label}{required && ' *'}</label>
        <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} className={`w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${mono ? 'font-mono uppercase' : ''}`} /></div>
);

export default function BranchesPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Partial<Branch> | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const getHeaders = () => { const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; return { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }; };

    const fetchBranches = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (filterType) params.set('branch_type', filterType);
            // cache: 'no-store' ensures browser never serves stale cache after add/edit
            const res = await fetch(`${API_BASE}/branches?${params}`, {
                headers: getHeaders(),
                cache: 'no-store',
            });
            if (!res.ok) throw new Error('Server error: ' + res.status);
            const json = await res.json();
            const branchData = json.data?.data || json.data || [];
            setBranches(Array.isArray(branchData) ? branchData : []);
        } catch (e: any) {
            setError(e.message || 'Failed to load branches');
        } finally {
            setLoading(false);
        }
    }, [search, filterType]);

    useEffect(() => { fetchBranches(); }, [fetchBranches]);

    const handleSave = async () => {
        // Validate all DB-required fields
        if (!editing?.name?.trim()) { setError('Branch Name is required'); return; }
        if (!editing?.code?.trim()) { setError('Branch Code is required'); return; }
        if (!editing?.contact_email?.trim()) { setError('Contact Email is required'); return; }
        if (!editing?.contact_phone?.trim()) { setError('Contact Phone is required'); return; }
        if (!editing?.address?.trim()) { setError('Address is required'); return; }
        if (!editing?.city?.trim()) { setError('City is required'); return; }

        setSaving(true);
        setError('');
        try {
            const isEdit = !!(editing as Branch)?._id;
            const url = isEdit
                ? `${API_BASE}/branches/${(editing as Branch)._id}`
                : `${API_BASE}/branches`;
            const res = await fetch(url, {
                method: isEdit ? 'PATCH' : 'POST',
                headers: getHeaders(),
                cache: 'no-store',
                body: JSON.stringify(editing),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || err.error || 'Failed to save branch');
            }
            setShowModal(false);
            setEditing(null);
            await fetchBranches(); // re-fetch fresh list from server
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => { if (!confirm('Deactivate this branch?')) return; try { await fetch(`${API_BASE}/branches/${id}`, { method: 'DELETE', headers: getHeaders() }); fetchBranches(); } catch { setError('Failed to deactivate'); } };

    return (
        <MainLayout title="Branch Management">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div><h1 className="text-2xl font-bold text-foreground">Branch Management</h1><p className="text-sm text-muted-foreground mt-1">Manage origin, destination, hub and warehouse branches</p></div>
                    <button onClick={() => { setEditing({ ...emptyBranch }); setShowModal(true); setError(''); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm"><Plus className="w-4 h-4" /> Add Branch</button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="text" placeholder="Search branches..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                    <div className="relative"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="pl-10 pr-8 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"><option value="">All Types</option>{branchTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[{ label: 'Total', value: branches.length, c: 'text-blue-400' }, { label: 'Origin', value: branches.filter(b => b.branch_type === 'origin').length, c: 'text-green-400' }, { label: 'Hub', value: branches.filter(b => b.branch_type === 'hub').length, c: 'text-purple-400' }, { label: 'Warehouse', value: branches.filter(b => b.branch_type === 'warehouse').length, c: 'text-amber-400' }].map((s, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-4"><div className="flex items-center gap-3"><Building2 className={`w-5 h-5 ${s.c}`} /><div><p className="text-2xl font-bold text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></div></div>
                    ))}
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    {loading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : branches.length === 0 ? <div className="p-12 text-center"><Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">No branches found</p></div> : (
                        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-border bg-muted/30">
                            {['Branch', 'Code', 'Type', 'Location', 'Zone', 'Contact', 'Manager', 'Actions'].map(h => <th key={h} className={`${h === 'Actions' ? 'text-right' : 'text-left'} px-4 py-3 text-xs font-medium text-muted-foreground uppercase`}>{h}</th>)}
                        </tr></thead><tbody className="divide-y divide-border">
                                {branches.map((b) => (
                                    <tr key={b._id} className="hover:bg-muted/20">
                                        <td className="px-4 py-3 font-medium text-sm">{b.name}</td>
                                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{b.code}</td>
                                        <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${b.branch_type === 'origin' ? 'bg-green-500/10 text-green-400' : b.branch_type === 'hub' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>{b.branch_type}</span></td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{b.city}, {b.state || b.country}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{b.zone || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground"><div>{b.contact_phone}</div><div className="text-xs">{b.contact_email}</div></td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{b.manager_name || '—'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => { setEditing({ ...b }); setShowModal(true); setError(''); }} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(b._id)} className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive ml-1"><Trash2 className="w-4 h-4" /></button>
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
                        <div className="flex items-center justify-between p-6 border-b border-border"><h2 className="text-lg font-bold">{(editing as Branch)?._id ? 'Edit Branch' : 'Add New Branch'}</h2><button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded-md"><X className="w-5 h-5" /></button></div>
                        <div className="p-6 space-y-4">
                            {error && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Name" value={editing.name || ''} onChange={v => setEditing({ ...editing, name: v })} required />
                                <InputField label="Code" value={editing.code || ''} onChange={v => setEditing({ ...editing, code: v })} required mono />
                                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label><select value={editing.branch_type || 'origin'} onChange={e => setEditing({ ...editing, branch_type: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">{branchTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                                <InputField label="Zone" value={editing.zone || ''} onChange={v => setEditing({ ...editing, zone: v })} />
                            </div>
                            <InputField label="Address" value={editing.address || ''} onChange={v => setEditing({ ...editing, address: v })} required />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <InputField label="City" value={editing.city || ''} onChange={v => setEditing({ ...editing, city: v })} required />
                                <InputField label="State" value={editing.state || ''} onChange={v => setEditing({ ...editing, state: v })} />
                                <InputField label="Pincode" value={editing.pincode || ''} onChange={v => setEditing({ ...editing, pincode: v })} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="GST Number" value={editing.gst_number || ''} onChange={v => setEditing({ ...editing, gst_number: v })} mono />
                                <InputField label="Country" value={editing.country || 'India'} onChange={v => setEditing({ ...editing, country: v })} />
                                <InputField label="Contact Email" value={editing.contact_email || ''} onChange={v => setEditing({ ...editing, contact_email: v })} required type="email" />
                                <InputField label="Contact Phone" value={editing.contact_phone || ''} onChange={v => setEditing({ ...editing, contact_phone: v })} required />
                                <InputField label="Manager Name" value={editing.manager_name || ''} onChange={v => setEditing({ ...editing, manager_name: v })} />
                                <InputField label="Manager Phone" value={editing.manager_phone || ''} onChange={v => setEditing({ ...editing, manager_phone: v })} />
                            </div>
                            {/* Bank Details */}
                            <div className="border-t pt-4">
                                <h3 className="font-semibold text-sm mb-3">Bank Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField label="Bank Name" value={editing.bank_details?.bank_name || ''} onChange={v => setEditing({ ...editing, bank_details: { ...editing.bank_details!, bank_name: v } })} />
                                    <InputField label="Branch Name" value={editing.bank_details?.branch || ''} onChange={v => setEditing({ ...editing, bank_details: { ...editing.bank_details!, branch: v } })} />
                                    <InputField label="Account Number" value={editing.bank_details?.account_number || ''} onChange={v => setEditing({ ...editing, bank_details: { ...editing.bank_details!, account_number: v } })} mono />
                                    <InputField label="IFSC Code" value={editing.bank_details?.ifsc_code || ''} onChange={v => setEditing({ ...editing, bank_details: { ...editing.bank_details!, ifsc_code: v } })} mono />
                                    <InputField label="Account Holder" value={editing.bank_details?.account_holder || ''} onChange={v => setEditing({ ...editing, bank_details: { ...editing.bank_details!, account_holder: v } })} />
                                </div>
                            </div>

                            {/* Weight Configuration */}
                            <div className="border-t pt-4">
                                <h3 className="font-semibold text-sm mb-3">Weight Configuration</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <InputField label="Min Weight (kg)" type="number" value={editing.weight_config?.min_weight || 0} onChange={v => setEditing({ ...editing, weight_config: { ...editing.weight_config!, min_weight: Number(v) } })} />
                                    <InputField label="Max Weight (kg)" type="number" value={editing.weight_config?.max_weight || 0} onChange={v => setEditing({ ...editing, weight_config: { ...editing.weight_config!, max_weight: Number(v) } })} />
                                    <InputField label="Dim. Factor" type="number" value={editing.weight_config?.dimensional_factor || 0} onChange={v => setEditing({ ...editing, weight_config: { ...editing.weight_config!, dimensional_factor: Number(v) } })} />
                                </div>
                            </div>

                            {/* Accounts Configuration */}
                            <div className="border-t pt-4">
                                <h3 className="font-semibold text-sm mb-3">Accounts Configuration</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField label="Ledger Name" value={editing.accounts_config?.ledger_name || ''} onChange={v => setEditing({ ...editing, accounts_config: { ...editing.accounts_config!, ledger_name: v } })} />
                                    <InputField label="Ledger Code" value={editing.accounts_config?.ledger_code || ''} onChange={v => setEditing({ ...editing, accounts_config: { ...editing.accounts_config!, ledger_code: v } })} />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? 'Saving...' : 'Save Branch'}</button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
