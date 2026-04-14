'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { apiService } from '@/lib/api';
import { Save, RotateCcw, FileText, Hash, Calculator, Loader2 } from 'lucide-react';

interface AllocationRecord {
    id: string;
    branch: string;
    startNumber: number;
    quantity: number;
    endNumber: number;
    date: string;
}

export default function HawbAllocationPage() {
    const [branches, setBranches] = useState<any[]>([]);
    const [records, setRecords] = useState<AllocationRecord[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form
    const [branch, setBranch] = useState('');
    const [startNumber, setStartNumber] = useState('');
    const [quantity, setQuantity] = useState('');

    const endNumber = startNumber && quantity ? parseInt(startNumber) + parseInt(quantity) - 1 : 0;
    const totalAvailable = records.reduce((sum, r) => sum + r.quantity, 0);

    useEffect(() => {
        const loadBranches = async () => {
            try {
                const data = await apiService.getBranches();
                setBranches(Array.isArray(data) ? data : []);
            } catch (err) { console.error(err); }
        };
        loadBranches();
    }, []);

    const handleSave = () => {
        if (!branch || !startNumber || !quantity) {
            setMessage({ type: 'error', text: 'Please fill all fields' }); return;
        }
        const newRecord: AllocationRecord = {
            id: Date.now().toString(),
            branch,
            startNumber: parseInt(startNumber),
            quantity: parseInt(quantity),
            endNumber,
            date: new Date().toISOString().split('T')[0],
        };
        setRecords(prev => [...prev, newRecord]);
        setMessage({ type: 'success', text: `✅ Allocated ${quantity} HAWB numbers (${startNumber} - ${endNumber}) to ${branch}` });
        setBranch(''); setStartNumber(''); setQuantity('');
        setTimeout(() => setMessage(null), 4000);
    };

    const handleClear = () => {
        setBranch(''); setStartNumber(''); setQuantity('');
        setMessage(null);
    };

    return (
        <MainLayout title="Branch-HAWB Allocation">
            <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Branch-HAWB Allocation</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage AWB leaf allocation for different branches</p>
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
                                <label className="text-sm font-medium text-foreground">Branch Name</label>
                                <select value={branch} onChange={e => setBranch(e.target.value)} className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                    <option value="">Select Branch</option>
                                    {branches.map(b => <option key={b._id || b.id} value={b.name}>{b.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-foreground">Starting Number</label>
                                <input type="number" value={startNumber} onChange={e => setStartNumber(e.target.value)} placeholder="e.g. 100001" className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-foreground">Issue Quantity</label>
                                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 100" className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-foreground">Ending Number</label>
                                <div className="h-10 px-3 rounded-md border border-border bg-muted/50 text-foreground text-sm flex items-center font-mono font-bold text-primary">
                                    {endNumber > 0 ? endNumber : '—'}
                                </div>
                            </div>

                            <div className="bg-muted/30 rounded-lg p-3 mt-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground">Total Available</span>
                                    <span className="text-lg font-bold text-primary">{totalAvailable}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button onClick={handleSave} className="h-9 px-5 text-sm font-medium bg-emerald-500 text-white rounded-md hover:bg-emerald-600 flex items-center gap-2">
                                    <Save className="w-4 h-4" /> Save
                                </button>
                                <button onClick={handleClear} className="h-9 px-4 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center gap-2">
                                    <RotateCcw className="w-4 h-4" /> Clear
                                </button>
                                <button className="h-9 px-4 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Report
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Allocation History */}
                    <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-border">
                            <h3 className="text-sm font-semibold text-foreground uppercase">Allocation History</h3>
                        </div>
                        {records.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <Hash className="w-12 h-12 mb-4 opacity-20" />
                                <p className="font-medium">No allocations yet</p>
                                <p className="text-sm mt-1">Allocate HAWB numbers to branches using the form</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="px-3 py-2.5 text-left font-semibold">S.N</th>
                                        <th className="px-3 py-2.5 text-left font-semibold">Branch</th>
                                        <th className="px-3 py-2.5 text-right font-semibold">Start</th>
                                        <th className="px-3 py-2.5 text-right font-semibold">End</th>
                                        <th className="px-3 py-2.5 text-right font-semibold">Quantity</th>
                                        <th className="px-3 py-2.5 text-left font-semibold">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((r, i) => (
                                        <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                                            <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                                            <td className="px-3 py-2.5 font-medium">{r.branch}</td>
                                            <td className="px-3 py-2.5 text-right font-mono">{r.startNumber}</td>
                                            <td className="px-3 py-2.5 text-right font-mono">{r.endNumber}</td>
                                            <td className="px-3 py-2.5 text-right font-bold text-primary">{r.quantity}</td>
                                            <td className="px-3 py-2.5 text-muted-foreground">{r.date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
