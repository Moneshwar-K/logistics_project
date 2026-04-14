'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Plus, Search, Edit2, Trash2, X, Users, User, Filter, CreditCard, Upload, FileText, Banknote } from 'lucide-react';
import { apiService } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

interface IECBranch {
    branch_code: string;
    branch_name: string;
    address: string;
}

interface Client {
    _id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    party_type: string;
    gst_number?: string;
    pan_number?: string;
    iec_code?: string;
    iec_branches?: IECBranch[];
    // Financials
    payment_terms?: string;
    credit_limit?: number;
    credit_days?: number;
    opening_balance?: { amount: number; type: 'debit' | 'credit'; date: string };
    bank_details?: {
        account_name: string;
        account_number: string;
        ifsc_code: string;
        bank_name: string;
        branch_name: string;
    };
    tds_config?: { percentage: number; section: string };
    // Other
    contact_person?: string;
    sales_person_id?: string;
    documents?: { doc_type: string; doc_number: string; file_url?: string; expiry_date?: string }[];
    status: string;
}

const emptyClient: Partial<Client> = {
    name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '',
    country: 'India', party_type: 'client', payment_terms: 'prepaid', credit_limit: 0,
    gst_number: '', pan_number: '', iec_code: '', contact_person: '', iec_branches: [],
    credit_days: 0,
    opening_balance: { amount: 0, type: 'debit', date: new Date().toISOString().split('T')[0] },
    bank_details: { account_name: '', account_number: '', ifsc_code: '', bank_name: '', branch_name: '' },
    tds_config: { percentage: 0, section: '' },
    documents: [],
    status: 'active'
};

const TabButton = ({ id, activeTab, setActiveTab, label, icon: Icon }: any) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
    >
        <Icon className="w-4 h-4" /> {label}
    </button>
);

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);
    const [activeTab, setActiveTab] = useState('basic'); // basic, financial, kyc, settings
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [employees, setEmployees] = useState<any[]>([]);

    const getHeaders = () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    };

    const fetchClients = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (filterType) params.set('party_type', filterType);
            const res = await fetch(`${API_BASE}/parties?${params}`, { headers: getHeaders() });
            const json = await res.json();
            setClients(json.data || []);
        } catch {
            setError('Failed to load clients');
        } finally {
            setLoading(false);
        }
    }, [search, filterType]);

    useEffect(() => {
        fetchClients();
        // Fetch employees for sales person dropdown
        fetch(`${API_BASE}/employees?role=sales`, { headers: getHeaders() })
            .then(r => r.json())
            .then(j => setEmployees(j.data || []))
            .catch(() => { });
    }, [fetchClients]);

    const handleSave = async () => {
        if (!editingClient?.name || !editingClient?.email || !editingClient?.phone) {
            setError('Name, Email and Phone are required');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const isEdit = !!(editingClient as Client)?._id;
            const url = isEdit ? `${API_BASE}/parties/${(editingClient as Client)._id}` : `${API_BASE}/parties`;
            const method = isEdit ? 'PATCH' : 'POST';
            const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(editingClient) });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to save');
            }
            setShowModal(false);
            setEditingClient(null);
            fetchClients();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deactivate this client?')) return;
        try {
            await fetch(`${API_BASE}/parties/${id}`, { method: 'DELETE', headers: getHeaders() });
            fetchClients();
        } catch {
            setError('Failed to deactivate client');
        }
    };

    const openCreate = () => {
        setEditingClient(JSON.parse(JSON.stringify(emptyClient))); // Deep copy
        setActiveTab('basic');
        setShowModal(true);
        setError('');
    };

    const openEdit = (c: Client) => {
        setEditingClient(JSON.parse(JSON.stringify(c))); // Deep copy
        setActiveTab('basic');
        setShowModal(true);
        setError('');
    };

    const partyTypes = [
        { value: 'client', label: 'Client' },
        { value: 'agent', label: 'Agent' },
        { value: 'vendor', label: 'Vendor' },
        { value: 'consignee', label: 'Consignee' },
    ];

    return (
        <MainLayout title="Client Management">
            <div className="space-y-6">
                {/* Header & Stats & Filter - Keep same structure */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Client Management</h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage clients contacts, financials and settings</p>
                    </div>
                    <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm">
                        <Plus className="w-4 h-4" /> Add Client
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" placeholder="Search by name, email, phone..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm" />
                    </div>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2.5 bg-card border border-border rounded-lg text-sm">
                        <option value="">All Types</option>
                        {partyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>

                {/* Table - Keep roughly same but updated columns/data if needed */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    {loading ? <div className="p-8 text-center">Loading...</div> : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/30 border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Contact</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Financials</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {clients.map((c) => (
                                        <tr key={c._id} className="hover:bg-muted/20">
                                            <td className="px-4 py-3"><div className="font-medium text-sm">{c.name}</div><div className="text-xs text-muted-foreground">{c.city}</div></td>
                                            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">{c.party_type}</span></td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground"><div>{c.phone}</div><div className="text-xs">{c.email}</div></td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="text-foreground capitalize">{c.payment_terms}</div>
                                                <div className="text-xs text-muted-foreground">Limit: ₹{(c.credit_limit || 0).toLocaleString()}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-muted rounded text-muted-foreground"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(c._id)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded ml-1"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && editingClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-bold text-foreground">{(editingClient as Client)?._id ? 'Edit Client' : 'Add New Client'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded-md"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Tabs */}
                        <div className="flex px-6 border-b border-border bg-muted/10">
                            <TabButton id="basic" activeTab={activeTab} setActiveTab={setActiveTab} label="Basic Info" icon={User} />
                            <TabButton id="financial" activeTab={activeTab} setActiveTab={setActiveTab} label="Financials" icon={Banknote} />
                            <TabButton id="kyc" activeTab={activeTab} setActiveTab={setActiveTab} label="KYC & Docs" icon={FileText} />
                            <TabButton id="settings" activeTab={activeTab} setActiveTab={setActiveTab} label="Settings" icon={Filter} />
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {error && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm mb-4">{error}</div>}

                            {/* BASIC TAB */}
                            {activeTab === 'basic' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div><label className="text-xs font-medium block mb-1">Name *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={editingClient.name} onChange={e => setEditingClient({ ...editingClient, name: e.target.value })} /></div>
                                        <div><label className="text-xs font-medium block mb-1">Type *</label><select className="w-full border rounded-lg px-3 py-2 text-sm" value={editingClient.party_type} onChange={e => setEditingClient({ ...editingClient, party_type: e.target.value })}>{partyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                                        <div><label className="text-xs font-medium block mb-1">Email *</label><input type="email" className="w-full border rounded-lg px-3 py-2 text-sm" value={editingClient.email} onChange={e => setEditingClient({ ...editingClient, email: e.target.value })} /></div>
                                        <div><label className="text-xs font-medium block mb-1">Phone *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={editingClient.phone} onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })} /></div>
                                        <div><label className="text-xs font-medium block mb-1">Contact Person</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={editingClient.contact_person} onChange={e => setEditingClient({ ...editingClient, contact_person: e.target.value })} /></div>
                                        <div><label className="text-xs font-medium block mb-1">Alt Phone</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                                    </div>
                                    <div className="border-t pt-4">
                                        <h3 className="font-semibold text-sm mb-3">Address</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            <input type="text" placeholder="Address Line" className="w-full border rounded-lg px-3 py-2 text-sm" value={editingClient.address} onChange={e => setEditingClient({ ...editingClient, address: e.target.value })} />
                                            <div className="grid grid-cols-3 gap-4">
                                                <input type="text" placeholder="City" className="border rounded-lg px-3 py-2 text-sm" value={editingClient.city} onChange={e => setEditingClient({ ...editingClient, city: e.target.value })} />
                                                <input type="text" placeholder="State" className="border rounded-lg px-3 py-2 text-sm" value={editingClient.state} onChange={e => setEditingClient({ ...editingClient, state: e.target.value })} />
                                                <input type="text" placeholder="Pincode" className="border rounded-lg px-3 py-2 text-sm" value={editingClient.pincode} onChange={e => setEditingClient({ ...editingClient, pincode: e.target.value })} />
                                            </div>
                                            <input type="text" placeholder="Country" className="w-full border rounded-lg px-3 py-2 text-sm" value={editingClient.country} onChange={e => setEditingClient({ ...editingClient, country: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* FINANCIAL TAB */}
                            {activeTab === 'financial' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div><label className="text-xs font-medium block mb-1">Payment Terms</label><select className="w-full border rounded-lg px-3 py-2 text-sm" value={editingClient.payment_terms} onChange={e => setEditingClient({ ...editingClient, payment_terms: e.target.value })}><option value="prepaid">Prepaid</option><option value="credit">Credit</option><option value="cod">COD</option><option value="tbb">TBB</option></select></div>
                                        <div><label className="text-xs font-medium block mb-1">Credit Limit (₹)</label><input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={editingClient.credit_limit} onChange={e => setEditingClient({ ...editingClient, credit_limit: Number(e.target.value) })} /></div>
                                        <div><label className="text-xs font-medium block mb-1">Credit Days</label><input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={editingClient.credit_days} onChange={e => setEditingClient({ ...editingClient, credit_days: Number(e.target.value) })} /></div>
                                        <div><label className="text-xs font-medium block mb-1">Sales Person</label><select className="w-full border rounded-lg px-3 py-2 text-sm" value={editingClient.sales_person_id} onChange={e => setEditingClient({ ...editingClient, sales_person_id: e.target.value })}><option value="">Select...</option>{employees.map(em => <option key={em._id} value={em._id}>{em.name}</option>)}</select></div>
                                    </div>

                                    <div className="border border-border rounded-lg p-4 bg-muted/20">
                                        <h3 className="font-semibold text-sm mb-3">Opening Balance</h3>
                                        <div className="flex gap-4">
                                            <div className="flex-1"><label className="text-xs block mb-1">Amount</label><input type="number" className="w-full border rounded px-2 py-1.5 text-sm" value={editingClient.opening_balance?.amount} onChange={e => setEditingClient({ ...editingClient, opening_balance: { ...editingClient.opening_balance!, amount: Number(e.target.value) } })} /></div>
                                            <div className="w-32"><label className="text-xs block mb-1">Type</label><select className="w-full border rounded px-2 py-1.5 text-sm" value={editingClient.opening_balance?.type} onChange={e => setEditingClient({ ...editingClient, opening_balance: { ...editingClient.opening_balance!, type: e.target.value as any } })}><option value="debit">Debit</option><option value="credit">Credit</option></select></div>
                                            <div className="flex-1"><label className="text-xs block mb-1">Date</label><input type="date" className="w-full border rounded px-2 py-1.5 text-sm" value={editingClient.opening_balance?.date ? new Date(editingClient.opening_balance.date).toISOString().split('T')[0] : ''} onChange={e => setEditingClient({ ...editingClient, opening_balance: { ...editingClient.opening_balance!, date: e.target.value } })} /></div>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <h3 className="font-semibold text-sm mb-3">Bank Details</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="text" placeholder="Bank Name" className="border rounded px-3 py-2 text-sm" value={editingClient.bank_details?.bank_name} onChange={e => setEditingClient({ ...editingClient, bank_details: { ...editingClient.bank_details!, bank_name: e.target.value } })} />
                                            <input type="text" placeholder="Branch Name" className="border rounded px-3 py-2 text-sm" value={editingClient.bank_details?.branch_name} onChange={e => setEditingClient({ ...editingClient, bank_details: { ...editingClient.bank_details!, branch_name: e.target.value } })} />
                                            <input type="text" placeholder="Account Number" className="border rounded px-3 py-2 text-sm" value={editingClient.bank_details?.account_number} onChange={e => setEditingClient({ ...editingClient, bank_details: { ...editingClient.bank_details!, account_number: e.target.value } })} />
                                            <input type="text" placeholder="IFSC Code" className="border rounded px-3 py-2 text-sm" value={editingClient.bank_details?.ifsc_code} onChange={e => setEditingClient({ ...editingClient, bank_details: { ...editingClient.bank_details!, ifsc_code: e.target.value } })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* KYC TAB */}
                            {activeTab === 'kyc' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div><label className="text-xs font-medium block mb-1">GST Number</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm uppercase font-mono" value={editingClient.gst_number} onChange={e => setEditingClient({ ...editingClient, gst_number: e.target.value })} /></div>
                                        <div><label className="text-xs font-medium block mb-1">PAN Number</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm uppercase font-mono" value={editingClient.pan_number} onChange={e => setEditingClient({ ...editingClient, pan_number: e.target.value })} /></div>
                                        <div><label className="text-xs font-medium block mb-1">IEC Code</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm uppercase font-mono" value={editingClient.iec_code} onChange={e => setEditingClient({ ...editingClient, iec_code: e.target.value })} /></div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <h3 className="font-semibold text-sm mb-3">Documents</h3>
                                        <div className="bg-muted/10 border border-border rounded-lg p-6 text-center border-dashed">
                                            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">Drag and drop files here, or click to upload</p>
                                            <p className="text-xs text-muted-foreground mt-1">(GST Certificate, PAN Card, IEC Copy)</p>
                                        </div>
                                    </div>

                                    {editingClient.iec_code && (
                                        <div className="border-t pt-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="font-semibold text-sm">IEC Branches</h3>
                                                <button onClick={() => setEditingClient(prev => ({ ...prev, iec_branches: [...(prev?.iec_branches || []), { branch_code: '', branch_name: '', address: '' }] }))} className="text-xs text-primary hover:underline">+ Add Branch</button>
                                            </div>
                                            {(editingClient.iec_branches || []).map((b, idx) => (
                                                <div key={idx} className="flex gap-2 mb-2">
                                                    <input placeholder="Code" className="w-20 border rounded px-2 py-1 text-xs" value={b.branch_code} onChange={e => { const newB = [...editingClient.iec_branches!]; newB[idx].branch_code = e.target.value; setEditingClient({ ...editingClient, iec_branches: newB }); }} />
                                                    <input placeholder="Name" className="flex-1 border rounded px-2 py-1 text-xs" value={b.branch_name} onChange={e => { const newB = [...editingClient.iec_branches!]; newB[idx].branch_name = e.target.value; setEditingClient({ ...editingClient, iec_branches: newB }); }} />
                                                    <input placeholder="Address" className="flex-1 border rounded px-2 py-1 text-xs" value={b.address} onChange={e => { const newB = [...editingClient.iec_branches!]; newB[idx].address = e.target.value; setEditingClient({ ...editingClient, iec_branches: newB }); }} />
                                                    <button onClick={() => { const newB = editingClient.iec_branches!.filter((_, i) => i !== idx); setEditingClient({ ...editingClient, iec_branches: newB }); }} className="text-destructive"><X className="w-4 h-4" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* SETTINGS TAB */}
                            {activeTab === 'settings' && (
                                <div className="space-y-4">
                                    <div className="border border-border rounded-lg p-4">
                                        <h3 className="font-semibold text-sm mb-3">TDS Configuration</h3>
                                        <div className="flex gap-4">
                                            <div className="flex-1"><label className="text-xs block mb-1">Percentage (%)</label><input type="number" className="w-full border rounded px-2 py-1.5 text-sm" value={editingClient.tds_config?.percentage} onChange={e => setEditingClient({ ...editingClient, tds_config: { ...editingClient.tds_config!, percentage: Number(e.target.value) } })} /></div>
                                            <div className="flex-1"><label className="text-xs block mb-1">Section (e.g. 194C)</label><input type="text" className="w-full border rounded px-2 py-1.5 text-sm uppercase" value={editingClient.tds_config?.section} onChange={e => setEditingClient({ ...editingClient, tds_config: { ...editingClient.tds_config!, section: e.target.value } })} /></div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 p-4 border border-border rounded-lg">
                                        <input type="checkbox" className="w-4 h-4" checked={editingClient.status === 'active'} onChange={e => setEditingClient({ ...editingClient, status: e.target.checked ? 'active' : 'inactive' })} />
                                        <label className="text-sm font-medium">Active Client</label>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-border flex justify-end gap-3 bg-card">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save Client'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
