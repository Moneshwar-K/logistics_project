'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Save, Warehouse, Building } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

interface Organization { _id?: string; name: string; tagline?: string; address?: string; city?: string; state?: string; pincode?: string; country?: string; gstin?: string; pan?: string; cin?: string; email?: string; phone?: string; website?: string; logo_url?: string; proprietor_name?: string; bank_details?: { bank_name: string; account_number: string; ifsc_code: string; branch: string }; terms_and_conditions?: string; }

const emptyOrg: Organization = { name: '', tagline: '', address: '', city: '', state: '', pincode: '', country: 'India', gstin: '', pan: '', cin: '', email: '', phone: '', website: '', proprietor_name: '', bank_details: { bank_name: '', account_number: '', ifsc_code: '', branch: '' }, terms_and_conditions: '' };

const InputField = ({ label, value, onChange, mono, type, span }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean; type?: string; span?: boolean }) => (
    <div className={span ? 'sm:col-span-2' : ''}>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
        <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} className={`w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${mono ? 'font-mono uppercase' : ''}`} />
    </div>
);

export default function OrganizationPage() {
    const [org, setOrg] = useState<Organization>(emptyOrg);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const getHeaders = () => { const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; return { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }; };

    useEffect(() => {
        (async () => {
            try { setLoading(true); const res = await fetch(`${API_BASE}/organization`, { headers: getHeaders() }); const json = await res.json(); if (json.data) setOrg({ ...emptyOrg, ...json.data }); } catch { /* first time — empty org */ } finally { setLoading(false); }
        })();
    }, []);

    const handleSave = async () => {
        if (!org.name) { setError('Organization name is required'); return; }
        setSaving(true); setError(''); setMessage('');
        try { const res = await fetch(`${API_BASE}/organization`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(org) }); if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Failed'); } const json = await res.json(); if (json.data) setOrg({ ...emptyOrg, ...json.data }); setMessage('Settings saved successfully'); setTimeout(() => setMessage(''), 3000); } catch (e: any) { setError(e.message); } finally { setSaving(false); }
    };

    if (loading) return <MainLayout title="Organization"><div className="p-8 text-center text-muted-foreground">Loading organization settings...</div></MainLayout>;

    return (
        <MainLayout title="Organization Settings">
            <div className="space-y-6 max-w-3xl">
                <div className="flex items-center justify-between">
                    <div><h1 className="text-2xl font-bold text-foreground">Organization Settings</h1><p className="text-sm text-muted-foreground mt-1">Company information used in invoices, bills and reports</p></div>
                    <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm disabled:opacity-50">
                        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>

                {message && <div className="p-3 bg-green-500/10 text-green-400 rounded-lg text-sm">{message}</div>}
                {error && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

                {/* Company Info */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2"><Warehouse className="w-5 h-5 text-primary" /><h2 className="text-base font-semibold text-foreground">Company Information</h2></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label="Company Name *" value={org.name} onChange={v => setOrg({ ...org, name: v })} />
                        <InputField label="Tagline" value={org.tagline || ''} onChange={v => setOrg({ ...org, tagline: v })} />
                        <InputField label="Email" value={org.email || ''} onChange={v => setOrg({ ...org, email: v })} type="email" />
                        <InputField label="Phone" value={org.phone || ''} onChange={v => setOrg({ ...org, phone: v })} />
                        <InputField label="Website" value={org.website || ''} onChange={v => setOrg({ ...org, website: v })} />
                        <InputField label="Proprietor/Director" value={org.proprietor_name || ''} onChange={v => setOrg({ ...org, proprietor_name: v })} />
                    </div>
                    <InputField label="Address" value={org.address || ''} onChange={v => setOrg({ ...org, address: v })} span />
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <InputField label="City" value={org.city || ''} onChange={v => setOrg({ ...org, city: v })} />
                        <InputField label="State" value={org.state || ''} onChange={v => setOrg({ ...org, state: v })} />
                        <InputField label="Pincode" value={org.pincode || ''} onChange={v => setOrg({ ...org, pincode: v })} />
                        <InputField label="Country" value={org.country || 'India'} onChange={v => setOrg({ ...org, country: v })} />
                    </div>
                </div>

                {/* Tax & Registration */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2"><Building className="w-5 h-5 text-primary" /><h2 className="text-base font-semibold text-foreground">Tax & Registration</h2></div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <InputField label="GSTIN" value={org.gstin || ''} onChange={v => setOrg({ ...org, gstin: v })} mono />
                        <InputField label="PAN" value={org.pan || ''} onChange={v => setOrg({ ...org, pan: v })} mono />
                        <InputField label="CIN" value={org.cin || ''} onChange={v => setOrg({ ...org, cin: v })} mono />
                    </div>
                </div>

                {/* Bank Details */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <h2 className="text-base font-semibold text-foreground">Bank Details</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label="Bank Name" value={org.bank_details?.bank_name || ''} onChange={v => setOrg({ ...org, bank_details: { ...org.bank_details!, bank_name: v } })} />
                        <InputField label="Account Number" value={org.bank_details?.account_number || ''} onChange={v => setOrg({ ...org, bank_details: { ...org.bank_details!, account_number: v } })} mono />
                        <InputField label="IFSC Code" value={org.bank_details?.ifsc_code || ''} onChange={v => setOrg({ ...org, bank_details: { ...org.bank_details!, ifsc_code: v } })} mono />
                        <InputField label="Branch" value={org.bank_details?.branch || ''} onChange={v => setOrg({ ...org, bank_details: { ...org.bank_details!, branch: v } })} />
                    </div>
                </div>

                {/* Terms */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <h2 className="text-base font-semibold text-foreground">Terms & Conditions</h2>
                    <textarea value={org.terms_and_conditions || ''} onChange={e => setOrg({ ...org, terms_and_conditions: e.target.value })} rows={6} placeholder="Enter terms and conditions that appear on invoices..." className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                </div>
            </div>
        </MainLayout>
    );
}
