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
    destination_city: string;
    invoice_value: number;
    service_type: string;
    shipper_id?: any;
    selected?: boolean;
}

export default function InvoiceGenerationPage() {
    const [shipments, setShipments] = useState<HawbItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [branches, setBranches] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);

    // Filters
    const [branchName, setBranchName] = useState('');
    const [customer, setCustomer] = useState('');
    const [cBranch, setCBranch] = useState('');
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
    const [destination, setDestination] = useState('');
    const [serviceType, setServiceType] = useState('');
    const [hawbSearch, setHawbSearch] = useState('');

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Load lookups
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
            } catch (err) {
                console.error('Failed to load lookups:', err);
            }
        };
        loadLookups();
    }, []);

    const handleSearch = useCallback(async () => {
        setLoading(true);
        setMessage(null);
        try {
            const filters: any = { limit: 500 };
            if (dateFrom) filters.date_from = dateFrom;
            if (dateTo) filters.date_to = dateTo;
            if (serviceType) filters.service_type = serviceType;
            if (branchName) filters.branch_id = branchName;

            const response = await apiService.listShipments(filters);
            let data: HawbItem[] = response?.data || [];
            if (!Array.isArray(data)) data = [];

            // Filter by customer
            if (customer) {
                data = data.filter(s => (s.shipper_id?.name || '').toLowerCase().includes(customer.toLowerCase()));
            }
            // Filter by destination
            if (destination) {
                data = data.filter(s => (s.destination_city || '').toLowerCase().includes(destination.toLowerCase()));
            }

            setShipments(data);
            setSelectedIds(new Set());
        } catch (err) {
            console.error('Search failed:', err);
            setShipments([]);
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo, serviceType, branchName, customer, destination]);

    const handleReset = () => {
        setBranchName(''); setCustomer(''); setCBranch('');
        setDateFrom(new Date().toISOString().split('T')[0]);
        setDateTo(new Date().toISOString().split('T')[0]);
        setDestination(''); setServiceType(''); setHawbSearch('');
        setShipments([]); setSelectedIds(new Set());
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
        if (selectedIds.size === filteredShipments.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredShipments.map(s => s._id)));
        }
    };

    const filteredShipments = hawbSearch
        ? shipments.filter(s => (s.hawb || '').toLowerCase().includes(hawbSearch.toLowerCase()))
        : shipments;

    const selectedShipments = filteredShipments.filter(s => selectedIds.has(s._id));
    const totalFreight = selectedShipments.reduce((sum, s) => sum + (s.invoice_value || 0), 0);
    const totalPcs = selectedShipments.reduce((sum, s) => sum + (s.total_cartons || 0), 0);
    const totalWeight = selectedShipments.reduce((sum, s) => sum + (s.total_weight || 0), 0);

    const handleGenerateInvoice = async () => {
        if (selectedIds.size === 0) {
            setMessage({ type: 'error', text: 'Please select at least one HAWB to generate invoice' });
            return;
        }
        setGenerating(true);
        setMessage(null);
        try {
            // Fix: The apiService.createInvoice expects an array of shipment IDs, not the full object
            const shipmentIds = Array.from(selectedIds);
            const result = await apiService.createInvoice(shipmentIds);
            
            setMessage({ 
                type: 'success', 
                text: `✅ Invoice ${result.invoice_number} generated successfully! Total: ₹${result.total_amount.toLocaleString()}` 
            });
            
            // Clear selection and refresh list
            setSelectedIds(new Set());
            handleSearch();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to generate invoice' });
        } finally {
            setGenerating(false);
        }
    };

    return (
        <MainLayout title="Invoice Bill Generation">
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Bill Generation</h1>
                    <p className="text-sm text-muted-foreground mt-1">Search un-billed HAWBs and generate invoice bills</p>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                {/* SEARCH / FILTER */}
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Search / Filter</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Branch Name</label>
                            <select value={branchName} onChange={e => setBranchName(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                <option value="">Select Branch</option>
                                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Customer</label>
                            <select value={customer} onChange={e => setCustomer(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                <option value="">Select Customer</option>
                                {customers.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">C.Branch</label>
                            <select value={cBranch} onChange={e => setCBranch(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                <option value="">Select Branch Mode</option>
                                {branches.map(b => <option key={b._id || b.id} value={b.name}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Destination</label>
                            <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="ALL" className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">From Date</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">To Date</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Service Type</label>
                            <select value={serviceType} onChange={e => setServiceType(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                <option value="">ALL</option>
                                <option value="air">AIR FREIGHT</option>
                                <option value="sea">SEA FREIGHT</option>
                                <option value="land">SURFACE</option>
                            </select>
                        </div>
                        <div className="flex items-end gap-2">
                            <button onClick={handleSearch} className="h-9 px-5 text-sm font-medium bg-emerald-500 text-white rounded-md hover:bg-emerald-600 flex items-center gap-2">
                                <Search className="w-4 h-4" /> Search
                            </button>
                            <button onClick={handleReset} className="h-9 px-4 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2">
                                <RotateCcw className="w-4 h-4" /> Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* VIEW / LIST */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <h3 className="text-sm font-semibold text-primary uppercase">VIEW / LIST</h3>
                        <div className="flex items-center gap-3">
                            <input
                                value={hawbSearch} onChange={e => setHawbSearch(e.target.value)}
                                placeholder="Enter HAWB number"
                                className="h-8 px-3 w-56 rounded-md border border-border bg-background text-foreground text-sm"
                            />
                            {selectedIds.size > 0 && (
                                <button onClick={handleGenerateInvoice} disabled={generating} className="h-8 px-4 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50">
                                    {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
                                    Generate Invoice ({selectedIds.size})
                                </button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Searching...
                        </div>
                    ) : filteredShipments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <FileText className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-medium">No HAWBs found</p>
                            <p className="text-sm mt-1">Set filters and click Search to find un-billed HAWBs</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="px-3 py-3 text-center w-10">
                                            <button onClick={toggleSelectAll} className="text-primary">
                                                {selectedIds.size === filteredShipments.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                            </button>
                                        </th>
                                        <th className="px-3 py-3 text-left font-semibold">S.No</th>
                                        <th className="px-3 py-3 text-left font-semibold">AWB NO</th>
                                        <th className="px-3 py-3 text-left font-semibold">Date</th>
                                        <th className="px-3 py-3 text-right font-semibold">PCS</th>
                                        <th className="px-3 py-3 text-right font-semibold">WT</th>
                                        <th className="px-3 py-3 text-left font-semibold">CITY</th>
                                        <th className="px-3 py-3 text-right font-semibold">FREIGHT</th>
                                        <th className="px-3 py-3 text-right font-semibold">FSC</th>
                                        <th className="px-3 py-3 text-right font-semibold">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredShipments.map((s, i) => (
                                        <tr
                                            key={s._id}
                                            onClick={() => toggleSelect(s._id)}
                                            className={`border-b border-border/50 cursor-pointer transition-colors ${selectedIds.has(s._id) ? 'bg-primary/10' : 'hover:bg-muted/30'}`}
                                        >
                                            <td className="px-3 py-2.5 text-center">
                                                {selectedIds.has(s._id) ? <CheckSquare className="w-4 h-4 text-primary mx-auto" /> : <Square className="w-4 h-4 text-muted-foreground mx-auto" />}
                                            </td>
                                            <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                                            <td className="px-3 py-2.5 font-mono font-bold text-primary">{s.hawb}</td>
                                            <td className="px-3 py-2.5 text-muted-foreground">{new Date(s.created_at).toLocaleDateString('en-IN')}</td>
                                            <td className="px-3 py-2.5 text-right">{s.total_cartons}</td>
                                            <td className="px-3 py-2.5 text-right">{s.total_weight}</td>
                                            <td className="px-3 py-2.5">{s.destination_city}</td>
                                            <td className="px-3 py-2.5 text-right font-medium">₹{(s.invoice_value || 0).toLocaleString()}</td>
                                            <td className="px-3 py-2.5 text-right text-muted-foreground">₹0</td>
                                            <td className="px-3 py-2.5 text-right font-bold">₹{(s.invoice_value || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                {selectedIds.size > 0 && (
                                    <tfoot>
                                        <tr className="bg-primary/5 font-semibold border-t-2 border-primary/30">
                                            <td colSpan={4} className="px-3 py-3 text-primary">SELECTED: {selectedIds.size} HAWBs</td>
                                            <td className="px-3 py-3 text-right">{totalPcs}</td>
                                            <td className="px-3 py-3 text-right">{totalWeight.toFixed(2)}</td>
                                            <td></td>
                                            <td className="px-3 py-3 text-right text-emerald-600">₹{totalFreight.toLocaleString()}</td>
                                            <td></td>
                                            <td className="px-3 py-3 text-right text-emerald-600 text-base">₹{totalFreight.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
