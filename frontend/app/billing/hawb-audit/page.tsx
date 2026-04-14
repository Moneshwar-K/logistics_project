'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { apiService } from '@/lib/api';
import {
    Search, Eye, Edit2, Printer, Loader2, ChevronLeft, ChevronRight,
    Filter, FileText, Package, RefreshCw, Download, CheckCircle2,
    X, AlertCircle, ClipboardCheck, AlertTriangle
} from 'lucide-react';

interface ShipmentRow {
    _id: string;
    hawb: string;
    reference_number?: string;
    origin_city: string;
    destination_city: string;
    service_type: string;
    shipment_type: string;
    total_cartons: number;
    total_weight: number;
    invoice_value: number;
    status: string;
    created_at: string;
    shipper_id?: any;
    consignee_id?: any;
}

interface AuditRecord {
    hawb: string;
    audit_status: string;
    cartons_verified: number;
    weight_variance: number;
    remarks?: string;
    balance_amount: number;
}

const STATUS_COLORS: Record<string, string> = {
    pending:    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    picked_up:  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    in_transit: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    delivered:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    on_hold:    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    cancelled:  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    manifested: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    dispatched: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
};

const AUDIT_STATUS_COLORS: Record<string, string> = {
    completed:          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    discrepancy_found:  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    in_progress:        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    pending:            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export default function HawbAuditPage() {
    const [shipments, setShipments] = useState<ShipmentRow[]>([]);
    const [auditMap, setAuditMap] = useState<Record<string, AuditRecord>>({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Audit modal state
    const [auditModalShipment, setAuditModalShipment] = useState<ShipmentRow | null>(null);
    const [auditForm, setAuditForm] = useState({
        cartons_verified: '',
        weight_variance: '0',
        remarks: '',
        balance_amount: '0',
        discrepancies: '',
    });
    const [auditSaving, setAuditSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchShipments = useCallback(async () => {
        setLoading(true);
        try {
            const filters: any = { page, limit: 20 };
            if (statusFilter) filters.status = statusFilter;
            if (searchQuery) filters.search = searchQuery;
            if (dateFrom) filters.date_from = dateFrom;
            if (dateTo) filters.date_to = dateTo;

            const response = await apiService.listShipments(filters);
            const data = response?.data || [];
            const shipmentList = Array.isArray(data) ? data : [];
            setShipments(shipmentList);
            setTotalPages(response?.totalPages || response?.pagination?.totalPages || 1);
            setTotalCount(response?.total || response?.pagination?.total || shipmentList.length);

            // Fetch audit records for all loaded HAWBs
            if (shipmentList.length > 0) {
                fetchAuditStatuses(shipmentList.map((s: ShipmentRow) => s.hawb));
            }
        } catch (err) {
            console.error('Failed to load shipments:', err);
            setShipments([]);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, searchQuery, dateFrom, dateTo]);

    const fetchAuditStatuses = async (hawbs: string[]) => {
        // Fetch audit list and build a map
        try {
            const response = await apiService.listHAWBAudits({ limit: 100 });
            const audits: AuditRecord[] = response?.data || [];
            const map: Record<string, AuditRecord> = {};
            audits.forEach((a: AuditRecord) => { map[a.hawb] = a; });
            setAuditMap(map);
        } catch {
            // Silently fail — audit statuses are optional display
        }
    };

    useEffect(() => {
        fetchShipments();
    }, [fetchShipments]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchShipments();
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const handlePrintHawb = (hawb: string) => {
        window.open(`/billing/hawb-booking?hawb=${hawb}&print=true`, '_blank');
    };

    const openAuditModal = (shipment: ShipmentRow) => {
        setAuditModalShipment(shipment);
        setAuditForm({
            cartons_verified: String(shipment.total_cartons),
            weight_variance: '0',
            remarks: '',
            balance_amount: '0',
            discrepancies: '',
        });
    };

    const closeAuditModal = () => {
        setAuditModalShipment(null);
    };

    const handleAuditSubmit = async () => {
        if (!auditModalShipment) return;
        setAuditSaving(true);
        try {
            const payload = {
                total_cartons: auditModalShipment.total_cartons,
                cartons_verified: Number(auditForm.cartons_verified),
                weight_variance: Number(auditForm.weight_variance),
                remarks: auditForm.remarks || undefined,
                balance_amount: Number(auditForm.balance_amount),
                discrepancies: auditForm.discrepancies
                    ? auditForm.discrepancies.split(',').map(s => s.trim()).filter(Boolean)
                    : [],
            };
            await apiService.createAudit(auditModalShipment.hawb, payload as any);
            showToast(`HAWB ${auditModalShipment.hawb} audited successfully ✅`, 'success');
            closeAuditModal();
            // Refresh audit statuses
            fetchAuditStatuses(shipments.map(s => s.hawb));
        } catch (err: any) {
            showToast(err?.message || 'Failed to submit audit', 'error');
        } finally {
            setAuditSaving(false);
        }
    };

    const exportToCSV = () => {
        const headers = ['HAWB No', 'Ref No', 'Client', 'Origin', 'Destination', 'Service', 'PCS', 'Weight', 'Value', 'Date', 'Status', 'Audit Status'];
        const rows = shipments.map(s => [
            s.hawb, s.reference_number || '', s.shipper_id?.name || '', s.origin_city, s.destination_city,
            s.service_type, s.total_cartons, s.total_weight, s.invoice_value || 0,
            formatDate(s.created_at), s.status, auditMap[s.hawb]?.audit_status || 'Not Audited'
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hawb_audit_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const totalWeight = shipments.reduce((s, r) => s + (r.total_weight || 0), 0);
    const totalPcs = shipments.reduce((s, r) => s + (r.total_cartons || 0), 0);
    const totalValue = shipments.reduce((s, r) => s + (r.invoice_value || 0), 0);
    const auditedCount = shipments.filter(s => auditMap[s.hawb]?.audit_status === 'completed').length;
    const discrepancyCount = shipments.filter(s => auditMap[s.hawb]?.audit_status === 'discrepancy_found').length;
    const pendingAuditCount = shipments.filter(s => !auditMap[s.hawb]).length;

    return (
        <MainLayout title="HAWB Audit">
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">

                {/* Toast Notification */}
                {toast && (
                    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top-2
                        ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {toast.type === 'success'
                            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                        {toast.message}
                    </div>
                )}

                {/* Audit Modal */}
                {auditModalShipment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5 border-b border-border">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <ClipboardCheck className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-foreground text-lg">Audit HAWB</h2>
                                        <p className="text-xs text-muted-foreground font-mono">{auditModalShipment.hawb}</p>
                                    </div>
                                </div>
                                <button onClick={closeAuditModal} className="p-2 hover:bg-muted rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            {/* Shipment Summary */}
                            <div className="mx-5 mt-4 p-3 bg-muted/40 rounded-lg text-sm grid grid-cols-2 gap-2">
                                <div><span className="text-muted-foreground">Origin:</span> <span className="font-medium">{auditModalShipment.origin_city}</span></div>
                                <div><span className="text-muted-foreground">Destination:</span> <span className="font-medium">{auditModalShipment.destination_city}</span></div>
                                <div><span className="text-muted-foreground">Pieces:</span> <span className="font-medium">{auditModalShipment.total_cartons} pcs</span></div>
                                <div><span className="text-muted-foreground">Weight:</span> <span className="font-medium">{auditModalShipment.total_weight} kg</span></div>
                            </div>

                            {/* Audit Form */}
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground block mb-1">
                                            Cartons Verified <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={auditModalShipment.total_cartons + 10}
                                            value={auditForm.cartons_verified}
                                            onChange={e => setAuditForm(f => ({ ...f, cartons_verified: e.target.value }))}
                                            className="w-full h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                            placeholder="e.g. 3"
                                        />
                                        {auditForm.cartons_verified && Number(auditForm.cartons_verified) !== auditModalShipment.total_cartons && (
                                            <p className="text-xs text-orange-500 mt-1">⚠️ Mismatch with booked {auditModalShipment.total_cartons} pcs</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground block mb-1">
                                            Weight Variance (kg)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={auditForm.weight_variance}
                                            onChange={e => setAuditForm(f => ({ ...f, weight_variance: e.target.value }))}
                                            className="w-full h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                            placeholder="0.0"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">0 = No variance</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                                        Balance Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={auditForm.balance_amount}
                                        onChange={e => setAuditForm(f => ({ ...f, balance_amount: e.target.value }))}
                                        className="w-full h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                                        Discrepancies (comma-separated, leave blank if none)
                                    </label>
                                    <input
                                        type="text"
                                        value={auditForm.discrepancies}
                                        onChange={e => setAuditForm(f => ({ ...f, discrepancies: e.target.value }))}
                                        className="w-full h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                        placeholder="e.g. Missing label, Damaged box"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                                        Remarks
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={auditForm.remarks}
                                        onChange={e => setAuditForm(f => ({ ...f, remarks: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                                        placeholder="Any additional notes..."
                                    />
                                </div>

                                {/* Audit outcome preview */}
                                {auditForm.cartons_verified && (
                                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                                        Number(auditForm.cartons_verified) === auditModalShipment.total_cartons &&
                                        Math.abs(Number(auditForm.weight_variance)) <= 0.1 &&
                                        !auditForm.discrepancies
                                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                            : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                                    }`}>
                                        {Number(auditForm.cartons_verified) === auditModalShipment.total_cartons &&
                                         Math.abs(Number(auditForm.weight_variance)) <= 0.1 &&
                                         !auditForm.discrepancies
                                            ? <><CheckCircle2 className="w-4 h-4" /> Audit will be marked as <strong>Completed</strong></>
                                            : <><AlertTriangle className="w-4 h-4" /> Audit will be marked as <strong>Discrepancy Found</strong></>
                                        }
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex gap-3 p-5 pt-0">
                                <button
                                    onClick={closeAuditModal}
                                    className="flex-1 h-10 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAuditSubmit}
                                    disabled={auditSaving || !auditForm.cartons_verified}
                                    className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {auditSaving
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                        : <><ClipboardCheck className="w-4 h-4" /> Save Audit</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">HAWB Audit</h1>
                        <p className="text-sm text-muted-foreground mt-1">Verify and audit HAWB shipment records</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/billing/hawb-booking" className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2">
                            <Package className="w-4 h-4" /> New HAWB
                        </Link>
                        <button onClick={exportToCSV} disabled={shipments.length === 0} className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <button onClick={fetchShipments} className="px-4 py-2 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </button>
                    </div>
                </div>

                {/* Audit Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-card border border-border rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">Total Shipments</p>
                        <p className="text-2xl font-bold text-foreground">{totalCount}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
                        <p className="text-xs text-green-600 dark:text-green-400">Audited ✅</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{auditedCount}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                        <p className="text-xs text-red-600 dark:text-red-400">Discrepancies ⚠️</p>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">{discrepancyCount}</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3">
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">Pending Audit</p>
                        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{pendingAuditCount}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                    <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Search HAWB / Client</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search by HAWB number, client name..."
                                    className="w-full h-9 pl-10 pr-3 rounded-md border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="picked_up">Picked Up</option>
                                <option value="in_transit">In Transit</option>
                                <option value="delivered">Delivered</option>
                                <option value="on_hold">On Hold</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">From Date</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">To Date</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                        </div>
                        <button type="submit" className="h-9 px-4 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2">
                            <Filter className="w-4 h-4" /> Search
                        </button>
                    </form>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span>Total: <span className="font-semibold text-foreground">{totalCount}</span></span>
                    <span className="mx-2">|</span>
                    <span>Page {page} of {totalPages}</span>
                    <span className="mx-2">|</span>
                    <span className="text-primary font-medium">💡 Click "Audit" button to verify a shipment</span>
                </div>

                {/* Table */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading HAWB records...
                        </div>
                    ) : shipments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Package className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-lg font-medium">No HAWB records found</p>
                            <p className="text-sm mt-1">Try adjusting your search filters or create a new HAWB booking</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="px-4 py-3 text-left font-semibold text-foreground">HAWB No</th>
                                        <th className="px-4 py-3 text-left font-semibold text-foreground">Client/Shipper</th>
                                        <th className="px-4 py-3 text-left font-semibold text-foreground">Origin → Dest</th>
                                        <th className="px-4 py-3 text-left font-semibold text-foreground">Service</th>
                                        <th className="px-4 py-3 text-left font-semibold text-foreground">Pcs</th>
                                        <th className="px-4 py-3 text-left font-semibold text-foreground">Weight</th>
                                        <th className="px-4 py-3 text-left font-semibold text-foreground">Value (₹)</th>
                                        <th className="px-4 py-3 text-left font-semibold text-foreground">Date</th>
                                        <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                                        <th className="px-4 py-3 text-left font-semibold text-foreground">Audit Status</th>
                                        <th className="px-4 py-3 text-center font-semibold text-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shipments.map(s => {
                                        const audit = auditMap[s.hawb];
                                        const isAudited = !!audit;
                                        return (
                                            <tr key={s._id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-mono font-bold text-primary">{s.hawb}</td>
                                                <td className="px-4 py-3">{s.shipper_id?.name || s.shipper_id || '—'}</td>
                                                <td className="px-4 py-3 text-muted-foreground text-xs">
                                                    {s.origin_city} <span className="text-foreground">→</span> {s.destination_city}
                                                </td>
                                                <td className="px-4 py-3 uppercase text-xs">{s.service_type}</td>
                                                <td className="px-4 py-3">{s.total_cartons}</td>
                                                <td className="px-4 py-3">{s.total_weight} kg</td>
                                                <td className="px-4 py-3">₹{(s.invoice_value || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{formatDate(s.created_at)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-800'}`}>
                                                        {s.status?.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isAudited ? (
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${AUDIT_STATUS_COLORS[audit.audit_status] || 'bg-gray-100 text-gray-800'}`}>
                                                            {audit.audit_status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                                                            {audit.audit_status === 'discrepancy_found' && <AlertTriangle className="w-3 h-3" />}
                                                            {audit.audit_status.replace(/_/g, ' ')}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">Not audited</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {!isAudited ? (
                                                            <button
                                                                onClick={() => openAuditModal(s)}
                                                                className="px-2.5 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-1 font-medium"
                                                                title="Audit this HAWB"
                                                            >
                                                                <ClipboardCheck className="w-3 h-3" /> Audit
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1 px-2">
                                                                <CheckCircle2 className="w-3 h-3" /> Done
                                                            </span>
                                                        )}
                                                        <Link href={`/billing/hawb-booking?hawb=${s.hawb}&mode=view`} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md" title="View">
                                                            <Eye className="w-4 h-4" />
                                                        </Link>
                                                        <Link href={`/billing/hawb-booking?hawb=${s.hawb}&mode=edit`} className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-md" title="Edit">
                                                            <Edit2 className="w-4 h-4" />
                                                        </Link>
                                                        <button onClick={() => handlePrintHawb(s.hawb)} className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-md" title="Print">
                                                            <Printer className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {shipments.length > 0 && (
                                    <tfoot>
                                        <tr className="bg-muted/30 font-semibold border-t-2 border-border">
                                            <td colSpan={4} className="px-4 py-3">TOTALS ({shipments.length} records)</td>
                                            <td className="px-4 py-3">{totalPcs}</td>
                                            <td className="px-4 py-3">{totalWeight.toFixed(1)} kg</td>
                                            <td className="px-4 py-3 text-emerald-600">₹{totalValue.toLocaleString()}</td>
                                            <td colSpan={4} className="px-4 py-3"></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
                            <span className="text-sm text-muted-foreground">
                                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, totalCount)} of {totalCount} records
                            </span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    className="p-2 rounded-md border border-border hover:bg-muted disabled:opacity-50">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                                    if (pageNum > totalPages) return null;
                                    return (
                                        <button key={pageNum} onClick={() => setPage(pageNum)}
                                            className={`px-3 py-1 rounded-md text-sm ${pageNum === page ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted'}`}>
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                    className="p-2 rounded-md border border-border hover:bg-muted disabled:opacity-50">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
