'use client';

import { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { apiService } from '@/lib/api';
import { printInvoice } from '@/lib/print';

interface Invoice {
    _id: string;
    invoice_number: string;
    shipment_id: any;
    amount: number;
    tax_amount: number;
    total_amount: number;
    status: string;
    due_date: string;
    created_at: string;
}

export default function InvoicesListPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');

    const fetchInvoices = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const filters: any = {};
            if (statusFilter) filters.status = statusFilter;

            const response = await apiService.listInvoices(filters);
            setInvoices(response?.data || []);
        } catch (err: any) {
            console.error('Failed to load invoices:', err);
            setError(err.message || 'Failed to load invoices');
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'paid': 'bg-green-100 text-green-700',
            'pending': 'bg-amber-100 text-amber-700',
            'overdue': 'bg-red-100 text-red-700',
            'cancelled': 'bg-gray-100 text-gray-600',
            'draft': 'bg-blue-100 text-blue-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-600';
    };

    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const pendingAmount = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    return (
        <MainLayout title="All Invoices">
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">All Invoices</h1>
                    <p className="text-gray-500 text-sm mt-1">Complete list of all invoices</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Total Value</p>
                        <p className="text-2xl font-bold mt-1">₹{totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Paid</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">₹{paidAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Pending</p>
                        <p className="text-2xl font-bold text-amber-600 mt-1">₹{pendingAmount.toLocaleString()}</p>
                    </div>
                </div>

                {/* Filter */}
                <div className="flex gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                    >
                        <option value="">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                        ⚠️ {error}
                    </div>
                )}

                {/* Invoices List */}
                {loading ? (
                    <div className="bg-white rounded-xl border border-gray-200">
                        <div className="animate-pulse p-6 space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-12 bg-gray-100 rounded"></div>
                            ))}
                        </div>
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <p className="text-4xl mb-3">🧾</p>
                        <h3 className="text-lg font-semibold text-gray-800">No Invoices</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {statusFilter ? 'No invoices match the selected filter.' : 'No invoices have been created yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice #</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">HAWB</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Tax</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Due Date</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoices.map((inv) => (
                                    <tr key={inv._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-blue-600">{inv.invoice_number}</td>
                                        <td className="px-4 py-3 text-gray-600">{inv.shipment_id?.hawb || '—'}</td>
                                        <td className="px-4 py-3 text-gray-600">₹{(inv.amount || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-gray-600">₹{(inv.tax_amount || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 font-medium">₹{(inv.total_amount || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>
                                                {inv.status?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => printInvoice(inv._id, true)}
                                                    className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-md font-medium transition-colors"
                                                    title="Print Invoice"
                                                >
                                                    🖨️ Print
                                                </button>
                                                <button
                                                    onClick={() => printInvoice(inv._id, false)}
                                                    className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md font-medium transition-colors"
                                                    title="Download PDF"
                                                >
                                                    📥
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
