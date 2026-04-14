'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { apiService } from '@/lib/api';
import { Save, RefreshCw, Trash2, Search, Edit2 } from 'lucide-react';

interface FscRecord {
    id: string;
    clientName: string;
    facilityName: string;
    charge: number;
    fromDate: string;
    toDate: string;
}

export default function FscChargePage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [facilities, setFacilities] = useState<any[]>([]);
    const [records, setRecords] = useState<FscRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form
    const [clientName, setClientName] = useState('');
    const [facilityName, setFacilityName] = useState('');
    const [fscCharge, setFscCharge] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        const loadLookups = async () => {
            try {
                const [clientData, branchData] = await Promise.all([
                    apiService.listParties({ limit: 200 }),
                    apiService.getBranches(),
                ]);
                const cData = clientData?.data || clientData || [];
                setCustomers(Array.isArray(cData) ? cData : []);
                setFacilities(Array.isArray(branchData) ? branchData : []);
            } catch (err) { console.error('Failed to load lookups:', err); }
        };
        loadLookups();
    }, []);

    const handleSave = () => {
        if (!clientName || !facilityName || !fscCharge || !fromDate || !toDate) {
            setMessage({ type: 'error', text: 'All fields marked * are required' });
            return;
        }
        if (editingId) {
            setRecords(prev => prev.map(r => r.id === editingId ? {
                ...r, clientName, facilityName, charge: parseFloat(fscCharge), fromDate, toDate,
            } : r));
            setMessage({ type: 'success', text: `✅ FSC Charge updated for ${clientName}` });
            setEditingId(null);
        } else {
            const newRecord: FscRecord = {
                id: Date.now().toString(), clientName, facilityName,
                charge: parseFloat(fscCharge), fromDate, toDate,
            };
            setRecords(prev => [...prev, newRecord]);
            setMessage({ type: 'success', text: `✅ FSC Charge saved: ${clientName} — ₹${fscCharge}` });
        }
        handleReset();
        setTimeout(() => setMessage(null), 4000);
    };

    const handleReset = () => {
        setClientName(''); setFacilityName(''); setFscCharge('');
        setFromDate(''); setToDate(''); setEditingId(null);
    };

    const handleEdit = (r: FscRecord) => {
        setClientName(r.clientName); setFacilityName(r.facilityName);
        setFscCharge(r.charge.toString()); setFromDate(r.fromDate);
        setToDate(r.toDate); setEditingId(r.id);
    };

    const handleDelete = (id: string) => {
        setRecords(prev => prev.filter(r => r.id !== id));
        setMessage({ type: 'success', text: 'Record deleted' });
        setTimeout(() => setMessage(null), 3000);
    };

    const filteredRecords = searchQuery
        ? records.filter(r => r.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) || r.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
        : records;

    return (
        <MainLayout title="FSC Charge Update">
            <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">FSC CHARGE UPDATE</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage Fuel Surcharge rates by client and facility</p>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Form */}
                    <div className="bg-card border border-border rounded-xl p-5">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-foreground">Client Name <span className="text-red-500">*</span></label>
                                <select value={clientName} onChange={e => setClientName(e.target.value)} className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                    <option value="">Select Client</option>
                                    {customers.map(c => <option key={c._id || c.name} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-foreground">Facility Name <span className="text-red-500">*</span></label>
                                <select value={facilityName} onChange={e => setFacilityName(e.target.value)} className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                    <option value="">Select Facility</option>
                                    {facilities.map(f => <option key={f._id || f.name} value={f.name}>{f.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-foreground">Fsc Charge <span className="text-red-500">*</span></label>
                                <input type="number" value={fscCharge} onChange={e => setFscCharge(e.target.value)} placeholder="0.00" className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-foreground">From Date <span className="text-red-500">*</span></label>
                                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-foreground">To Date <span className="text-red-500">*</span></label>
                                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={handleSave} className="h-9 px-5 text-sm font-medium bg-emerald-500 text-white rounded-md hover:bg-emerald-600 flex items-center gap-2">
                                    <Save className="w-4 h-4" /> {editingId ? 'UPDATE' : 'SAVE'}
                                </button>
                                <button onClick={handleReset} className="h-9 px-5 text-sm font-medium bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4" /> RESET
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <span></span>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search Facility Name Here..." className="h-8 pl-9 pr-3 w-64 rounded-md border border-border bg-background text-foreground text-sm" />
                            </div>
                        </div>
                        {filteredRecords.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <p className="text-sm">No FSC charge records</p>
                                <p className="text-xs mt-1">Add FSC charges using the form</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-amber-100/70 dark:bg-amber-900/20 border-b border-border">
                                            <th className="px-3 py-2.5 text-left font-semibold">S.N</th>
                                            <th className="px-3 py-2.5 text-left font-semibold">Charge ↕</th>
                                            <th className="px-3 py-2.5 text-left font-semibold">Facility Name ↕</th>
                                            <th className="px-3 py-2.5 text-left font-semibold">Client Name ↕</th>
                                            <th className="px-3 py-2.5 text-left font-semibold">From Date ↕</th>
                                            <th className="px-3 py-2.5 text-left font-semibold">To Date ↕</th>
                                            <th className="px-3 py-2.5 text-center font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRecords.map((r, i) => (
                                            <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                                                <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                                                <td className="px-3 py-2.5 font-medium">₹{r.charge}</td>
                                                <td className="px-3 py-2.5">{r.facilityName}</td>
                                                <td className="px-3 py-2.5">{r.clientName}</td>
                                                <td className="px-3 py-2.5 text-muted-foreground">{r.fromDate}</td>
                                                <td className="px-3 py-2.5 text-muted-foreground">{r.toDate}</td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <button onClick={() => handleEdit(r)} className="text-blue-500 hover:text-blue-700 mr-2"><Edit2 className="w-4 h-4 inline" /></button>
                                                    <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4 inline" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
