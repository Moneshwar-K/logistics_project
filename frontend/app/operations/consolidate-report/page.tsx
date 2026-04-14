'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { apiService } from '@/lib/api';
import {
    Search, Download, RefreshCw, Loader2, FileSpreadsheet,
    Calendar, Filter, Package, RotateCcw
} from 'lucide-react';

interface HawbRow {
    _id: string;
    hawb: string;
    created_at: string;
    shipper_id?: any;
    consignee_id?: any;
    total_cartons: number;
    total_weight: number;
    origin_city: string;
    destination_city: string;
    invoice_value: number;
    status: string;
    service_type: string;
    billing?: any;
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    picked_up: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    in_transit: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    on_hold: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function ConsolidateReportPage() {
    const [rows, setRows] = useState<HawbRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
    const [customerFilter, setCustomerFilter] = useState('');
    const [facilityFilter, setFacilityFilter] = useState('');
    const [serviceTypeFilter, setServiceTypeFilter] = useState('');
    const [customers, setCustomers] = useState<any[]>([]);
    const [facilities, setFacilities] = useState<any[]>([]);

    // Load lookups
    useEffect(() => {
        const loadLookups = async () => {
            try {
                const [clientData, branchData] = await Promise.all([
                    apiService.listParties({ role: 'shipper', limit: 200 }),
                    apiService.getBranches(),
                ]);
                const cData = clientData?.data || clientData || [];
                setCustomers(Array.isArray(cData) ? cData : []);
                setFacilities(Array.isArray(branchData) ? branchData : []);
            } catch (err) {
                console.error('Failed to load lookups:', err);
            }
        };
        loadLookups();
    }, []);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const filters: any = { limit: 1000 };
            if (dateFrom) filters.date_from = dateFrom;
            if (dateTo) filters.date_to = dateTo;
            if (serviceTypeFilter) filters.service_type = serviceTypeFilter;

            const response = await apiService.listShipments(filters);
            let data: HawbRow[] = response?.data || [];
            if (!Array.isArray(data)) data = [];

            // Client-side filtering
            if (customerFilter) {
                data = data.filter(r =>
                    (r.shipper_id?.name || '').toLowerCase().includes(customerFilter.toLowerCase())
                );
            }
            if (facilityFilter) {
                data = data.filter(r =>
                    (r.billing?.facility || r.origin_city || '').toLowerCase().includes(facilityFilter.toLowerCase())
                );
            }

            setRows(data);
        } catch (err) {
            console.error('Failed to fetch report:', err);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo, customerFilter, facilityFilter, serviceTypeFilter]);

    const handleReset = () => {
        setDateFrom(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
        setDateTo(new Date().toISOString().split('T')[0]);
        setCustomerFilter('');
        setFacilityFilter('');
        setServiceTypeFilter('');
        setRows([]);
    };

    const downloadExcel = () => {
        const headers = ['S.N', 'HAWB No', 'HAWB Date', 'Customer', 'PCS', 'Weight', 'Freight', 'FSC', 'City', 'Facility', 'Delivery Date', 'Status'];
        const csvRows = rows.map((r, i) => [
            i + 1,
            r.hawb || '',
            new Date(r.created_at).toLocaleDateString('en-IN'),
            r.shipper_id?.name || '',
            r.total_cartons || 0,
            r.total_weight || 0,
            r.invoice_value || 0,
            0,
            r.destination_city || '',
            r.billing?.facility || r.origin_city || '',
            '',
            r.status || '',
        ]);
        const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `consolidate_report_${dateFrom}_to_${dateTo}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    // Totals
    const totalPcs = rows.reduce((sum, r) => sum + (r.total_cartons || 0), 0);
    const totalWeight = rows.reduce((sum, r) => sum + (r.total_weight || 0), 0);
    const totalFreight = rows.reduce((sum, r) => sum + (r.invoice_value || 0), 0);

    return (
        <MainLayout title="Consolidate Report">
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Consolidate Report</h1>
                        <p className="text-sm text-muted-foreground mt-1">Comprehensive HAWB data report with filters</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={downloadExcel} disabled={rows.length === 0} className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2 disabled:opacity-50">
                            <FileSpreadsheet className="w-4 h-4" /> DOWNLOAD
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">From Date</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">To Date</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                        </div>
                        <div className="min-w-[180px]">
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Customer Name</label>
                            <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} className="h-9 w-full px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                <option value="">All Customers</option>
                                {customers.map(c => <option key={c._id || c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="min-w-[150px]">
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Facility</label>
                            <select value={facilityFilter} onChange={e => setFacilityFilter(e.target.value)} className="h-9 w-full px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                <option value="">All Facilities</option>
                                {facilities.map(f => <option key={f._id || f.name} value={f.name}>{f.name}</option>)}
                            </select>
                        </div>
                        <div className="min-w-[140px]">
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Service Type</label>
                            <select value={serviceTypeFilter} onChange={e => setServiceTypeFilter(e.target.value)} className="h-9 w-full px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                <option value="">ALL</option>
                                <option value="air">AIR FREIGHT</option>
                                <option value="sea">SEA FREIGHT</option>
                                <option value="land">SURFACE</option>
                            </select>
                        </div>
                        <button onClick={fetchReport} className="h-9 px-5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2">
                            <Search className="w-4 h-4" /> SEARCH
                        </button>
                        <button onClick={handleReset} className="h-9 px-4 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2">
                            <RotateCcw className="w-4 h-4" /> RESET
                        </button>
                    </div>
                </div>

                {/* Summary */}
                {rows.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-card border border-border rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Total Records</p>
                            <p className="text-xl font-bold text-foreground">{rows.length}</p>
                        </div>
                        <div className="bg-card border border-border rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Total PCS</p>
                            <p className="text-xl font-bold text-foreground">{totalPcs}</p>
                        </div>
                        <div className="bg-card border border-border rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Total Weight</p>
                            <p className="text-xl font-bold text-foreground">{totalWeight.toFixed(2)} kg</p>
                        </div>
                        <div className="bg-card border border-border rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Total Freight</p>
                            <p className="text-xl font-bold text-emerald-600">₹{totalFreight.toLocaleString()}</p>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading report data...
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Package className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-medium">No data found</p>
                            <p className="text-sm mt-1">Use the filters above and click SEARCH to load report data</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="px-3 py-3 text-left font-semibold text-foreground">S.N</th>
                                        <th className="px-3 py-3 text-left font-semibold text-foreground">HAWB No</th>
                                        <th className="px-3 py-3 text-left font-semibold text-foreground">HAWB Date</th>
                                        <th className="px-3 py-3 text-left font-semibold text-foreground">Customer</th>
                                        <th className="px-3 py-3 text-right font-semibold text-foreground">PCS</th>
                                        <th className="px-3 py-3 text-right font-semibold text-foreground">Weight</th>
                                        <th className="px-3 py-3 text-right font-semibold text-foreground">Freight (₹)</th>
                                        <th className="px-3 py-3 text-right font-semibold text-foreground">FSC (₹)</th>
                                        <th className="px-3 py-3 text-left font-semibold text-foreground">City</th>
                                        <th className="px-3 py-3 text-left font-semibold text-foreground">Facility</th>
                                        <th className="px-3 py-3 text-left font-semibold text-foreground">Delivery Date</th>
                                        <th className="px-3 py-3 text-left font-semibold text-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r, i) => (
                                        <tr key={r._id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                            <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                                            <td className="px-3 py-2.5 font-mono font-bold text-primary">{r.hawb}</td>
                                            <td className="px-3 py-2.5 text-muted-foreground">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                                            <td className="px-3 py-2.5">{r.shipper_id?.name || '—'}</td>
                                            <td className="px-3 py-2.5 text-right">{r.total_cartons}</td>
                                            <td className="px-3 py-2.5 text-right">{r.total_weight}</td>
                                            <td className="px-3 py-2.5 text-right font-medium">₹{(r.invoice_value || 0).toLocaleString()}</td>
                                            <td className="px-3 py-2.5 text-right text-muted-foreground">₹0</td>
                                            <td className="px-3 py-2.5">{r.destination_city}</td>
                                            <td className="px-3 py-2.5">{r.billing?.facility || r.origin_city || '—'}</td>
                                            <td className="px-3 py-2.5 text-muted-foreground">—</td>
                                            <td className="px-3 py-2.5">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-800'}`}>
                                                    {r.status?.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-muted/30 font-semibold border-t-2 border-border">
                                        <td colSpan={4} className="px-3 py-3">TOTALS ({rows.length} records)</td>
                                        <td className="px-3 py-3 text-right">{totalPcs}</td>
                                        <td className="px-3 py-3 text-right">{totalWeight.toFixed(2)}</td>
                                        <td className="px-3 py-3 text-right text-emerald-600">₹{totalFreight.toLocaleString()}</td>
                                        <td colSpan={5}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
