'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { apiService } from '@/lib/api';
import {
    Search, Loader2, RotateCcw, FileText, CheckSquare, Square, Printer
} from 'lucide-react';

interface HawbItem {
    _id: string;
    hawb: string;
    created_at: string;
    total_cartons: number;
    total_weight: number;
    origin_city: string;
    invoice_value: number;
    service_type: string;
    shipper_id?: any;
}

export default function DutyBillGenerationPage() {
    const [shipments, setShipments] = useState<HawbItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);

    // Filters
    const [branchName, setBranchName] = useState('');
    const [customer, setCustomer] = useState('');
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [hawbSearch, setHawbSearch] = useState('');

    // Selection  
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Charge Description
    const [basicCustomsDuty, setBasicCustomsDuty] = useState(0);
    const [socialWelfare, setSocialWelfare] = useState(0);
    const [igstAmount, setIgstAmount] = useState(0);
    const [otherCharge, setOtherCharge] = useState(0);
    const [billOfEntryNo, setBillOfEntryNo] = useState('');

    // Clearance Charges
    const [dutyCharge, setDutyCharge] = useState(0);
    const [highValue, setHighValue] = useState(0);
    const [rcmcIgst, setRcmcIgst] = useState(0);
    const [eou100, setEou100] = useState(0);
    const [sez, setSez] = useState(0);
    const [mepz, setMepz] = useState(0);

    useEffect(() => {
        const loadLookups = async () => {
            try {
                const [branchData, clientData] = await Promise.all([
                    apiService.getBranches(),
                    apiService.listParties({ role: 'shipper', limit: 200 }),
                ]);
                setBranches(Array.isArray(branchData) ? branchData : []);
                const cData = clientData?.data || clientData || [];
                setCustomers(Array.isArray(cData) ? cData : []);
            } catch (err) { console.error('Failed to load lookups:', err); }
        };
        loadLookups();
    }, []);

    const handleSearch = useCallback(async () => {
        setLoading(true);
        try {
            const filters: any = { limit: 500 };
            if (dateFrom) filters.date_from = dateFrom;
            if (dateTo) filters.date_to = dateTo;
            if (branchName) filters.branch_id = branchName;
            const response = await apiService.listShipments(filters);
            let data: HawbItem[] = response?.data || [];
            if (!Array.isArray(data)) data = [];
            if (customer) data = data.filter(s => (s.shipper_id?.name || '').toLowerCase().includes(customer.toLowerCase()));
            setShipments(data);
            setSelectedIds(new Set());
        } catch (err) {
            console.error('Search failed:', err);
            setShipments([]);
        } finally { setLoading(false); }
    }, [dateFrom, dateTo, branchName, customer]);

    const handleReset = () => {
        setBranchName(''); setCustomer('');
        setDateFrom(new Date().toISOString().split('T')[0]);
        setDateTo(new Date().toISOString().split('T')[0]);
        setInvoiceDate(new Date().toISOString().split('T')[0]);
        setHawbSearch(''); setShipments([]); setSelectedIds(new Set());
        setBasicCustomsDuty(0); setSocialWelfare(0); setIgstAmount(0);
        setOtherCharge(0); setBillOfEntryNo('');
        setDutyCharge(0); setHighValue(0); setRcmcIgst(0);
        setEou100(0); setSez(0); setMepz(0);
        setMessage(null);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredShipments.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(filteredShipments.map(s => s._id)));
    };

    const filteredShipments = hawbSearch
        ? shipments.filter(s => (s.hawb || '').toLowerCase().includes(hawbSearch.toLowerCase()))
        : shipments;

    const selectedShipments = filteredShipments.filter(s => selectedIds.has(s._id));
    const totalFreight = selectedShipments.reduce((sum, s) => sum + (s.invoice_value || 0), 0);

    const sgstRate = 0.09, cgstRate = 0.09, igstRate = 0.18;

    const handleGenerateDutyBill = async () => {
        if (selectedIds.size === 0) {
            setMessage({ type: 'error', text: 'Please select at least one HAWB' }); return;
        }
        
        const subtotal = basicCustomsDuty + socialWelfare + igstAmount + otherCharge + 
                         dutyCharge + highValue + rcmcIgst + eou100 + sez + mepz;
        
        const data = {
            shipment_ids: Array.from(selectedIds),
            invoice_date: invoiceDate,
            bill_of_entry_no: billOfEntryNo,
            
            basic_customs_duty: basicCustomsDuty,
            social_welfare_surcharge: socialWelfare,
            igst_amount: igstAmount,
            other_charge: otherCharge,
            
            duty_charge: dutyCharge,
            high_value_charge: highValue,
            rcmc_igst_charge: rcmcIgst,
            eou_100_charge: eou100,
            sez_charge: sez,
            mepz_charge: mepz,
            
            subtotal: subtotal,
            total_amount: subtotal // Simplified for now
        };

        try {
            await apiService.createDutyBill(data);
            setMessage({ type: 'success', text: `✅ Duty Bill generated successfully for ${selectedIds.size} HAWB(s)` });
            setSelectedIds(new Set());
            handleSearch(); // Refresh list
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || 'Failed to generate duty bill' });
        }
    };

    return (
        <MainLayout title="Duty Bill Generation">
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Duty Bill Generation</h1>
                    <p className="text-sm text-muted-foreground mt-1">Generate duty bills with customs and clearance charges</p>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                {/* SEARCH / FILTER */}
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Search / Filter</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Branch Name</label>
                            <select value={branchName} onChange={e => setBranchName(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                <option value="">Select</option>
                                {branches.map(b => <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Customer</label>
                            <select value={customer} onChange={e => setCustomer(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                <option value="">Select</option>
                                {customers.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">From Date</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">To Date</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Invoice Date</label>
                            <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSearch} className="h-9 px-5 text-sm font-medium bg-emerald-500 text-white rounded-md hover:bg-emerald-600 flex items-center gap-2"><Search className="w-4 h-4" /> Search</button>
                        <button onClick={handleReset} className="h-9 px-4 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Reset</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* LEFT: UN-BILLED HAWB NO'S */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <h3 className="text-sm font-semibold text-cyan-600 uppercase">UN-BILLED HAWB NO'S</h3>
                            <input value={hawbSearch} onChange={e => setHawbSearch(e.target.value)} placeholder="Enter HAWB number" className="h-8 px-3 w-48 rounded-md border border-border bg-background text-foreground text-sm" />
                        </div>
                        {loading ? (
                            <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Searching...</div>
                        ) : filteredShipments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground"><FileText className="w-10 h-10 mb-3 opacity-20" /><p className="text-sm">No un-billed HAWBs</p></div>
                        ) : (
                            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0 bg-muted/50">
                                        <tr className="border-b border-border">
                                            <th className="px-2 py-2 text-center w-8">
                                                <button onClick={toggleSelectAll}>{selectedIds.size === filteredShipments.length ? <CheckSquare className="w-3 h-3 text-primary mx-auto" /> : <Square className="w-3 h-3 mx-auto" />}</button>
                                            </th>
                                            <th className="px-2 py-2 text-left font-semibold">HAWB No</th>
                                            <th className="px-2 py-2 text-right font-semibold">PCS-WT</th>
                                            <th className="px-2 py-2 text-right font-semibold">FREIGHT</th>
                                            <th className="px-2 py-2 text-right font-semibold">FSC</th>
                                            <th className="px-2 py-2 text-right font-semibold">SGST(9%)</th>
                                            <th className="px-2 py-2 text-right font-semibold">CGST(9%)</th>
                                            <th className="px-2 py-2 text-right font-semibold">IGST(18%)</th>
                                            <th className="px-2 py-2 text-right font-semibold">TOTAL AMT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredShipments.map(s => {
                                            const freight = s.invoice_value || 0;
                                            const sgst = Math.round(freight * sgstRate);
                                            const cgst = Math.round(freight * cgstRate);
                                            const igst = Math.round(freight * igstRate);
                                            const total = freight + sgst + cgst + igst;
                                            return (
                                                <tr key={s._id} onClick={() => toggleSelect(s._id)} className={`border-b border-border/50 cursor-pointer transition-colors ${selectedIds.has(s._id) ? 'bg-primary/10' : 'hover:bg-muted/30'}`}>
                                                    <td className="px-2 py-2 text-center">{selectedIds.has(s._id) ? <CheckSquare className="w-3 h-3 text-primary mx-auto" /> : <Square className="w-3 h-3 text-muted-foreground mx-auto" />}</td>
                                                    <td className="px-2 py-2 font-mono font-bold text-primary">{s.hawb}</td>
                                                    <td className="px-2 py-2 text-right">{s.total_cartons}-{s.total_weight}</td>
                                                    <td className="px-2 py-2 text-right">₹{freight.toLocaleString()}</td>
                                                    <td className="px-2 py-2 text-right text-muted-foreground">₹0</td>
                                                    <td className="px-2 py-2 text-right">₹{sgst}</td>
                                                    <td className="px-2 py-2 text-right">₹{cgst}</td>
                                                    <td className="px-2 py-2 text-right">₹{igst}</td>
                                                    <td className="px-2 py-2 text-right font-bold">₹{total.toLocaleString()}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: CHARGE DESCRIPTION + CLEARANCE */}
                    <div className="space-y-4">
                        <div className="bg-card border border-border rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-red-500 uppercase mb-3">CHARGE DESCRIPTION</h3>
                            {selectedIds.size > 0 && <p className="text-xs text-muted-foreground mb-2">HAWB NO — {selectedIds.size} selected</p>}
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground">Basic Customs Duty</label>
                                    <input type="number" value={basicCustomsDuty} onChange={e => setBasicCustomsDuty(Number(e.target.value))} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground">Social Welfare SurCharge</label>
                                    <input type="number" value={socialWelfare} onChange={e => setSocialWelfare(Number(e.target.value))} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground">IGST (Amount)</label>
                                    <input type="number" value={igstAmount} onChange={e => setIgstAmount(Number(e.target.value))} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground">Other Charge</label>
                                    <input type="number" value={otherCharge} onChange={e => setOtherCharge(Number(e.target.value))} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground">Bill Of Entry No</label>
                                    <input value={billOfEntryNo} onChange={e => setBillOfEntryNo(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-cyan-600 uppercase mb-3">CLEARANCE CHARGES</h3>
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground">Duty</label>
                                    <input type="number" value={dutyCharge} onChange={e => setDutyCharge(Number(e.target.value))} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground">High value</label>
                                    <input type="number" value={highValue} onChange={e => setHighValue(Number(e.target.value))} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground">RCMC / IGST</label>
                                    <input type="number" value={rcmcIgst} onChange={e => setRcmcIgst(Number(e.target.value))} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground">100% EOU</label>
                                    <input type="number" value={eou100} onChange={e => setEou100(Number(e.target.value))} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground">SEZ</label>
                                    <input type="number" value={sez} onChange={e => setSez(Number(e.target.value))} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground">MEPZ</label>
                                    <input type="number" value={mepz} onChange={e => setMepz(Number(e.target.value))} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                                </div>
                            </div>
                        </div>

                        <button onClick={handleGenerateDutyBill} disabled={selectedIds.size === 0} className="w-full h-11 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50">
                            <Printer className="w-4 h-4" /> Generate Duty Bill ({selectedIds.size} HAWBs)
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
