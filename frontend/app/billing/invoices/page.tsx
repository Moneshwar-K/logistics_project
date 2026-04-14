'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { apiService } from '@/lib/api';
import {
  Search, Eye, Printer, FileText, Loader2, ChevronLeft, ChevronRight,
  Plus, Calendar, Download, Filter
} from 'lucide-react';

interface Invoice {
  _id: string;
  invoice_number: string;
  shipment_id: any;
  amount: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount?: number;
  balance_amount?: number;
  status: string;
  due_date: string;
  created_at: string;
  paid_at?: string;
}

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  draft: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function BillingInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = { page, limit: 25 };
      if (statusFilter) filters.status = statusFilter;

      const response = await apiService.listInvoices(filters);
      const data = response?.data || [];
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load invoices:', err);
      setError(err.message || 'Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Client-side filtering
  const filteredInvoices = invoices.filter((inv) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!(inv.invoice_number?.toLowerCase().includes(q) || inv.shipment_id?.hawb?.toLowerCase().includes(q))) return false;
    }
    if (dateFrom && new Date(inv.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(inv.created_at) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const paidAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
  const pendingAmount = filteredInvoices.reduce((sum, inv) => sum + ((inv.balance_amount || (inv.total_amount - (inv.paid_amount || 0))) || 0), 0);

  const handlePrintInvoice = (id: string) => {
    apiService.downloadInvoicePDF(id).catch(err => alert('Print failed: ' + err.message));
  };

  const exportCSV = () => {
    const headers = ['Invoice #', 'HAWB', 'Amount', 'Tax', 'Total', 'Status', 'Due Date', 'Created'];
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number, inv.shipment_id?.hawb || '', inv.subtotal || inv.amount, inv.tax_amount, inv.total_amount, inv.status,
      inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '',
      new Date(inv.created_at).toLocaleDateString('en-IN'),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  return (
    <MainLayout title="Invoices">
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage billing and invoices</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="px-4 py-2 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 flex items-center gap-2">
              <Download className="w-4 h-4" /> Export
            </button>
            <Link href="/billing/invoice-generation" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Invoice
            </Link>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Total Invoices</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{filteredInvoices.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold mt-1 text-foreground">₹{totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">₹{paidAmount.toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">₹{pendingAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search invoice # or HAWB..."
                className="w-full h-9 pl-10 pr-3 rounded-md border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">⚠️ {error}</div>
        )}

        {/* Table */}
        {loading ? (
          <div className="bg-card border border-border rounded-xl p-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-semibold text-foreground">No Invoices Found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || statusFilter ? 'Try adjusting your filters.' : 'Create your first invoice to get started.'}
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Invoice #</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">HAWB</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Amount (₹)</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Tax (₹)</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Total (₹)</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Due Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Created</th>
                    <th className="px-4 py-3 text-center font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map(inv => (
                    <tr key={inv._id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary">{inv.invoice_number}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{inv.shipment_id?.hawb || '—'}</td>
                      <td className="px-4 py-3 text-right">₹{(inv.subtotal || inv.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">₹{(inv.tax_amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium">₹{(inv.total_amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(inv.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/billing/invoices/${inv._id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md" title="View">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handlePrintInvoice(inv._id)} className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-md" title="Print PDF">
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 font-semibold border-t-2 border-border">
                    <td colSpan={4} className="px-4 py-3">TOTALS ({filteredInvoices.length} invoices)</td>
                    <td className="px-4 py-3 text-right">₹{totalAmount.toLocaleString()}</td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
