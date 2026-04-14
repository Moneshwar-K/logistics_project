'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { apiService } from '@/lib/api';
import {
    Plus, RefreshCw, Trash2, Edit2, Upload, Loader2, Save
} from 'lucide-react';

interface TariffEntry {
    id: string;
    weight: number;
    amount: number;
    rateType: 'Flat' | 'PerKg';
}

interface TariffRecord {
    id: string;
    customer: string;
    destination: string;
    serviceType: string;
    trainName: string;
    shipmentType: string;
    date: string;
    status: string;
    rates: TariffEntry[];
}

export default function ZoneTariffPage() {
    const [branches, setBranches] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [records, setRecords] = useState<TariffRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Filters
    const [filterBranch, setFilterBranch] = useState('');
    const [filterCustomer, setFilterCustomer] = useState('');

    // Form
    const [originBranch, setOriginBranch] = useState('');
    const [destLocation, setDestLocation] = useState('');
    const [serviceType, setServiceType] = useState('AIR FREIGHT');
    const [shipmentType, setShipmentType] = useState('NON DOCUMENTS');
    const [effectiveDate, setEffectiveDate] = useState('');

    // Rate entries
    const [rates, setRates] = useState<TariffEntry[]>([]);
    const [newWeight, setNewWeight] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newRateType, setNewRateType] = useState<'Flat' | 'PerKg'>('Flat');

    useEffect(() => {
        const loadLookups = async () => {
            try {
                const [branchData, clientData] = await Promise.all([
                    apiService.getBranches(),
                    apiService.listParties({ limit: 200 }),
                ]);
                setBranches(Array.isArray(branchData) ? branchData : []);
                const cData = clientData?.data || clientData || [];
                setCustomers(Array.isArray(cData) ? cData : []);
            } catch (err) { console.error('Failed to load lookups:', err); }
        };
        loadLookups();
    }, []);

    const addRate = () => {
        if (!newWeight || !newAmount) return;
        setRates(prev => [...prev, {
            id: Date.now().toString(),
            weight: parseFloat(newWeight),
            amount: parseFloat(newAmount),
            rateType: newRateType,
        }]);
        setNewWeight(''); setNewAmount('');
    };

    const removeRate = (id: string) => setRates(prev => prev.filter(r => r.id !== id));

    const handleSave = () => {
        if (!originBranch || !destLocation || !serviceType || rates.length === 0) {
            setMessage({ type: 'error', text: 'Please fill all fields and add at least one rate entry' });
            return;
        }
        const newRecord: TariffRecord = {
            id: Date.now().toString(),
            customer: filterCustomer || 'ALL',
            destination: destLocation,
            serviceType,
            trainName: '',
            shipmentType,
            date: effectiveDate || new Date().toISOString().split('T')[0],
            status: 'Active',
            rates: [...rates],
        };
        setRecords(prev => [...prev, newRecord]);
        setMessage({ type: 'success', text: `✅ Zone Tariff saved: ${destLocation} - ${serviceType} (${rates.length} rate entries)` });
        // Reset form
        setOriginBranch(''); setDestLocation('');
        setServiceType('AIR FREIGHT'); setShipmentType('NON DOCUMENTS');
        setEffectiveDate(''); setRates([]);
        setTimeout(() => setMessage(null), 4000);
    };

    const handleReset = () => {
        setOriginBranch(''); setDestLocation('');
        setServiceType('AIR FREIGHT'); setShipmentType('NON DOCUMENTS');
        setEffectiveDate(''); setRates([]);
        setNewWeight(''); setNewAmount('');
        setMessage(null);
    };

    return (
        <MainLayout title="Zone Tariff">
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Zone Tariff</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage shipping rates by zone, service type, and weight</p>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                {/* SELECT / FILTER */}
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">SELECT / FILTER</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Branch Name</label>
                            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                <option value="">Select</option>
                                {branches.map(b => <option key={b._id || b.id} value={b.name}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Customer Name</label>
                            <select value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                <option value="">Select</option>
                                {customers.map(c => <option key={c._id || c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* LEFT: ADD/UPDATE Form */}
                    <div className="bg-card border border-border rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-foreground uppercase mb-3">ADD / UPDATE</h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-muted-foreground">Origin Branch</label>
                                <select value={originBranch} onChange={e => setOriginBranch(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                    <option value="">Select</option>
                                    {branches.map(b => <option key={b._id || b.id} value={b.name}>{b.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-muted-foreground">Destination Location</label>
                                <input value={destLocation} onChange={e => setDestLocation(e.target.value)} placeholder="Enter destination" className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-muted-foreground">Service Type</label>
                                <select value={serviceType} onChange={e => setServiceType(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                    <option>AIR FREIGHT</option><option>SEA FREIGHT</option><option>SURFACE</option>
                                    <option>DELHIVERY SURFACE</option><option>EXPRESS</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-muted-foreground">Shipment Type</label>
                                <select value={shipmentType} onChange={e => setShipmentType(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                    <option>NON DOCUMENTS</option><option>DOCUMENTS</option><option>SAMPLES</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1 col-span-2">
                                <label className="text-xs text-muted-foreground">Effective Date</label>
                                <input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                            </div>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <button onClick={handleSave} className="h-9 px-4 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
                            <button onClick={handleSave} className="h-9 px-4 text-sm bg-emerald-500 text-white rounded-md hover:bg-emerald-600 flex items-center gap-1"><Save className="w-3 h-3" /> Update</button>
                            <button onClick={handleReset} className="h-9 px-4 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Reset</button>
                            <button className="h-9 px-4 text-sm bg-amber-500 text-white rounded-md hover:bg-amber-600 flex items-center gap-1"><Upload className="w-3 h-3" /> Excel_Upload</button>
                        </div>

                        {/* Rate entries */}
                        <div className="border border-border rounded-lg p-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Rate Entries</p>
                            <div className="flex gap-2 mb-3">
                                <div className="flex flex-col gap-1 flex-1">
                                    <label className="text-xs text-muted-foreground">Weight</label>
                                    <input type="number" value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder="kg" className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                                </div>
                                <div className="flex flex-col gap-1 flex-1">
                                    <label className="text-xs text-muted-foreground">Amount</label>
                                    <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="₹" className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                                </div>
                                <div className="flex flex-col gap-1 flex-1">
                                    <label className="text-xs text-muted-foreground">RateType</label>
                                    <select value={newRateType} onChange={e => setNewRateType(e.target.value as any)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                        <option>Flat</option><option>PerKg</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button onClick={addRate} className="h-9 px-3 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"><Plus className="w-4 h-4" /></button>
                                </div>
                            </div>
                            {rates.length > 0 && (
                                <div className="space-y-1">
                                    {rates.map(r => (
                                        <div key={r.id} className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-md text-sm">
                                            <span>{r.weight} kg — ₹{r.amount} ({r.rateType})</span>
                                            <button onClick={() => removeRate(r.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: VIEW / LIST */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <h3 className="text-sm font-semibold text-foreground uppercase">VIEW / LIST</h3>
                            <button onClick={() => setRecords([])} className="text-muted-foreground hover:text-foreground"><RefreshCw className="w-4 h-4" /></button>
                        </div>
                        {records.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <p className="text-sm">No tariff records yet</p>
                                <p className="text-xs mt-1">Add zone tariff entries using the form</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border">
                                            <th className="px-2 py-2 text-center w-8"><input type="checkbox" /></th>
                                            <th className="px-2 py-2 text-left font-semibold">Customer</th>
                                            <th className="px-2 py-2 text-left font-semibold">DESTINATION</th>
                                            <th className="px-2 py-2 text-left font-semibold">SERVICE TYPE</th>
                                            <th className="px-2 py-2 text-left font-semibold">SHIPMENT TYPE</th>
                                            <th className="px-2 py-2 text-left font-semibold">DATE</th>
                                            <th className="px-2 py-2 text-left font-semibold">STATUS</th>
                                            <th className="px-2 py-2 text-center font-semibold">ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {records.map(r => (
                                            <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                                                <td className="px-2 py-2 text-center"><input type="checkbox" /></td>
                                                <td className="px-2 py-2">{r.customer}</td>
                                                <td className="px-2 py-2">{r.destination}</td>
                                                <td className="px-2 py-2">{r.serviceType}</td>
                                                <td className="px-2 py-2">{r.shipmentType}</td>
                                                <td className="px-2 py-2">{r.date}</td>
                                                <td className="px-2 py-2"><span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">{r.status}</span></td>
                                                <td className="px-2 py-2 text-center">
                                                    <button className="text-blue-500 hover:text-blue-700 mr-2"><Edit2 className="w-3 h-3" /></button>
                                                    <button onClick={() => setRecords(prev => prev.filter(x => x.id !== r.id))} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
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
