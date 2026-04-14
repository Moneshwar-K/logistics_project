'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3, DollarSign, TrendingUp, Calendar, Loader2, Download,
  FileText, Filter, RefreshCw, FileSpreadsheet
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

interface InvoiceRow {
  _id: string;
  invoice_number: string;
  hawb?: string;
  client_name?: string;
  total_amount: number;
  paid_amount?: number;
  balance_amount?: number;
  status: string;
  created_at: string;
  shipment_id?: any;
}

interface BillingMetrics {
  total_revenue: number;
  total_invoices: number;
  paid_amount: number;
  pending_amount: number;
  average_invoice_value: number;
}

type ReportTab = 'consolidated' | 'invoices' | 'monthly' | 'monthly_gst';

export default function BillingReportsPage() {
  const [metrics, setMetrics] = useState<BillingMetrics | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [dateRange, setDateRange] = useState('month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReportTab>('consolidated');

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      let fromDate = new Date();

      if (dateFrom) {
        fromDate = new Date(dateFrom);
      } else {
        switch (dateRange) {
          case 'week': fromDate.setDate(now.getDate() - 7); break;
          case 'month': fromDate.setMonth(now.getMonth() - 1); break;
          case 'quarter': fromDate.setMonth(now.getMonth() - 3); break;
          case 'year': fromDate.setFullYear(now.getFullYear() - 1); break;
        }
      }

      const params = new URLSearchParams({
        date_from: fromDate.toISOString().split('T')[0],
        date_to: dateTo || now.toISOString().split('T')[0],
        limit: '1000',
      });

      const res = await fetch(`${API_BASE}/invoices?${params}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch data');

      const json = await res.json();
      const invoiceList: InvoiceRow[] = json.data || [];
      setInvoices(invoiceList);

      // Aggregate metrics
      const total_revenue = invoiceList.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const paid_amount = invoiceList.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
      const pending_amount = invoiceList.reduce((sum, inv) => sum + ((inv.balance_amount || (inv.total_amount - (inv.paid_amount || 0))) || 0), 0);
      const total_invoices = invoiceList.length;
      const average_invoice_value = total_invoices > 0 ? total_revenue / total_invoices : 0;

      setMetrics({ total_revenue, total_invoices, paid_amount, pending_amount, average_invoice_value });
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setMetrics({ total_revenue: 0, total_invoices: 0, paid_amount: 0, pending_amount: 0, average_invoice_value: 0 });
    } finally {
      setLoading(false);
    }
  }, [dateRange, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredInvoices = clientFilter
    ? invoices.filter(inv => (inv.client_name || inv.shipment_id?.shipper_id?.name || '').toLowerCase().includes(clientFilter.toLowerCase()))
    : invoices;

  // Monthly grouping
  const monthlyData = filteredInvoices.reduce((acc, inv) => {
    const month = new Date(inv.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
    if (!acc[month]) acc[month] = { count: 0, total: 0, paid: 0, pending: 0 };
    acc[month].count++;
    acc[month].total += inv.total_amount || 0;
    acc[month].paid += inv.paid_amount || 0;
    acc[month].pending += (inv.balance_amount || (inv.total_amount - (inv.paid_amount || 0))) || 0;
    return acc;
  }, {} as Record<string, { count: number; total: number; paid: number; pending: number }>);

  // Export to CSV
  const exportToExcel = () => {
    const headers = ['Invoice No', 'HAWB', 'Client', 'Amount (₹)', 'Paid (₹)', 'Balance (₹)', 'Status', 'Date'];
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number || '',
      inv.hawb || inv.shipment_id?.hawb || '',
      inv.client_name || inv.shipment_id?.shipper_id?.name || '',
      inv.total_amount || 0,
      inv.paid_amount || 0,
      inv.balance_amount || (inv.total_amount - (inv.paid_amount || 0)) || 0,
      inv.status || '',
      new Date(inv.created_at).toLocaleDateString('en-IN'),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpiCards = metrics ? [
    { title: 'Total Revenue', value: `₹${metrics.total_revenue.toLocaleString()}`, icon: <DollarSign className="w-6 h-6 text-emerald-600" />, bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' },
    { title: 'Total Invoices', value: metrics.total_invoices.toString(), icon: <FileText className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' },
    { title: 'Paid Amount', value: `₹${metrics.paid_amount.toLocaleString()}`, icon: <TrendingUp className="w-6 h-6 text-green-600" />, bg: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' },
    { title: 'Pending', value: `₹${metrics.pending_amount.toLocaleString()}`, icon: <DollarSign className="w-6 h-6 text-amber-600" />, bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' },
    { title: 'Avg Invoice', value: `₹${metrics.average_invoice_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: <BarChart3 className="w-6 h-6 text-purple-600" />, bg: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800' },
  ] : [];

  const tabs: { id: ReportTab; label: string }[] = [
    { id: 'consolidated', label: 'Consolidated Report' },
    { id: 'invoices', label: 'Invoice Bills' },
    { id: 'monthly', label: 'Monthly Summary' },
    { id: 'monthly_gst', label: 'Monthly GST Report' },
  ];

  return (
    <MainLayout title="Billing Reports">
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Billing Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">Financial analytics and billing overview</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportToExcel} className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Export to Excel
            </button>
            <button onClick={fetchData} className="px-4 py-2 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6 bg-card border-border">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Quick Range</label>
              <select value={dateRange} onChange={e => { setDateRange(e.target.value); setDateFrom(''); setDateTo(''); }} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
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
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Client Filter</label>
              <input value={clientFilter} onChange={e => setClientFilter(e.target.value)} placeholder="Filter by client name..." className="w-full h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading reports...</div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {kpiCards.map((card, i) => (
                <Card key={i} className={`p-4 border ${card.bg}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{card.title}</p>
                      <p className="text-xl font-bold text-foreground">{card.value}</p>
                    </div>
                    {card.icon}
                  </div>
                </Card>
              ))}
            </div>

            {/* Report Tabs */}
            <div className="border-b border-border mb-4">
              <div className="flex gap-0">
                {tabs.map(tab => (
                  <button
                    key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Consolidated Report */}
            {activeTab === 'consolidated' && (
              <Card className="border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-4 py-3 text-left font-semibold">#</th>
                        <th className="px-4 py-3 text-left font-semibold">Invoice No</th>
                        <th className="px-4 py-3 text-left font-semibold">HAWB</th>
                        <th className="px-4 py-3 text-left font-semibold">Client</th>
                        <th className="px-4 py-3 text-right font-semibold">Amount (₹)</th>
                        <th className="px-4 py-3 text-right font-semibold">Paid (₹)</th>
                        <th className="px-4 py-3 text-right font-semibold">Balance (₹)</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                        <th className="px-4 py-3 text-left font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.length === 0 ? (
                        <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No invoice data found for the selected period</td></tr>
                      ) : (
                        filteredInvoices.map((inv, i) => (
                          <tr key={inv._id} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                            <td className="px-4 py-2.5 font-medium">{inv.invoice_number || '—'}</td>
                            <td className="px-4 py-2.5 font-mono text-primary">{inv.hawb || inv.shipment_id?.hawb || '—'}</td>
                            <td className="px-4 py-2.5">{inv.client_name || inv.shipment_id?.shipper_id?.name || '—'}</td>
                            <td className="px-4 py-2.5 text-right font-medium">₹{(inv.total_amount || 0).toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right text-green-600">₹{(inv.paid_amount || 0).toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right text-amber-600">₹{((inv.balance_amount || (inv.total_amount - (inv.paid_amount || 0))) || 0).toLocaleString()}</td>
                            <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : inv.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{inv.status}</span></td>
                            <td className="px-4 py-2.5 text-muted-foreground">{new Date(inv.created_at).toLocaleDateString('en-IN')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {filteredInvoices.length > 0 && (
                      <tfoot>
                        <tr className="bg-muted/30 font-semibold border-t-2 border-border">
                          <td colSpan={4} className="px-4 py-3">TOTALS</td>
                          <td className="px-4 py-3 text-right">₹{filteredInvoices.reduce((s, inv) => s + (inv.total_amount || 0), 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-green-600">₹{filteredInvoices.reduce((s, inv) => s + (inv.paid_amount || 0), 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-amber-600">₹{filteredInvoices.reduce((s, inv) => s + ((inv.balance_amount || (inv.total_amount - (inv.paid_amount || 0))) || 0), 0).toLocaleString()}</td>
                          <td colSpan={2} className="px-4 py-3"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </Card>
            )}

            {/* Invoice Bills Tab */}
            {activeTab === 'invoices' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Invoice Status Overview</h3>
                  <div className="space-y-4">
                    {metrics && [
                      { status: 'Paid', amount: metrics.paid_amount, color: 'bg-green-500', pct: metrics.total_revenue > 0 ? (metrics.paid_amount / metrics.total_revenue) * 100 : 0 },
                      { status: 'Pending', amount: metrics.pending_amount, color: 'bg-amber-500', pct: metrics.total_revenue > 0 ? (metrics.pending_amount / metrics.total_revenue) * 100 : 0 },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{item.status}</span>
                          <span className="text-muted-foreground">₹{item.amount.toLocaleString()} ({item.pct.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                          <div className={`${item.color} h-3 rounded-full transition-all duration-700`} style={{ width: `${Math.min(item.pct, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className="p-6 border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Top Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Total Invoices Generated</span>
                      <span className="font-bold">{metrics?.total_invoices || 0}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Average Invoice Value</span>
                      <span className="font-bold">₹{(metrics?.average_invoice_value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Total Revenue</span>
                      <span className="font-bold text-emerald-600">₹{(metrics?.total_revenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Outstanding Balance</span>
                      <span className="font-bold text-amber-600">₹{(metrics?.pending_amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Monthly Summary Tab */}
            {activeTab === 'monthly' && (
              <Card className="border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-4 py-3 text-left font-semibold">Month</th>
                        <th className="px-4 py-3 text-right font-semibold">Invoices</th>
                        <th className="px-4 py-3 text-right font-semibold">Total (₹)</th>
                        <th className="px-4 py-3 text-right font-semibold">Paid (₹)</th>
                        <th className="px-4 py-3 text-right font-semibold">Pending (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(monthlyData).length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No data for the selected period</td></tr>
                      ) : (
                        Object.entries(monthlyData).map(([month, data]) => (
                          <tr key={month} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="px-4 py-3 font-medium">{month}</td>
                            <td className="px-4 py-3 text-right">{data.count}</td>
                            <td className="px-4 py-3 text-right font-medium">₹{data.total.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-green-600">₹{data.paid.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-amber-600">₹{data.pending.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Monthly GST Report Tab */}
            {activeTab === 'monthly_gst' && (
              <Card className="border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-3 py-3 text-left font-semibold">DATE</th>
                        <th className="px-3 py-3 text-left font-semibold">GSTIN NO</th>
                        <th className="px-3 py-3 text-left font-semibold">INVOICE NO</th>
                        <th className="px-3 py-3 text-left font-semibold">CUSTOMER NAME</th>
                        <th className="px-3 py-3 text-right font-semibold">BASIC AMOUNT</th>
                        <th className="px-3 py-3 text-right font-semibold">CGST</th>
                        <th className="px-3 py-3 text-right font-semibold">SGST</th>
                        <th className="px-3 py-3 text-right font-semibold">IGST</th>
                        <th className="px-3 py-3 text-right font-semibold">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.length === 0 ? (
                        <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No data for the selected period</td></tr>
                      ) : (
                        filteredInvoices.map((inv, i) => {
                          const basicAmount = inv.total_amount || 0;
                          const cgst = Math.round(basicAmount * 0.09);
                          const sgst = Math.round(basicAmount * 0.09);
                          const igst = Math.round(basicAmount * 0.18);
                          const total = basicAmount + cgst + sgst;
                          return (
                            <tr key={inv._id} className="border-b border-border/50 hover:bg-muted/20">
                              <td className="px-3 py-2.5 text-muted-foreground">{new Date(inv.created_at).toLocaleDateString('en-IN')}</td>
                              <td className="px-3 py-2.5 font-mono text-xs">{(inv as any).gstin || '—'}</td>
                              <td className="px-3 py-2.5 font-medium">{inv.invoice_number || '—'}</td>
                              <td className="px-3 py-2.5">{inv.client_name || inv.shipment_id?.shipper_id?.name || '—'}</td>
                              <td className="px-3 py-2.5 text-right font-medium">₹{basicAmount.toLocaleString()}</td>
                              <td className="px-3 py-2.5 text-right">₹{cgst.toLocaleString()}</td>
                              <td className="px-3 py-2.5 text-right">₹{sgst.toLocaleString()}</td>
                              <td className="px-3 py-2.5 text-right">₹{igst.toLocaleString()}</td>
                              <td className="px-3 py-2.5 text-right font-bold">₹{total.toLocaleString()}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {filteredInvoices.length > 0 && (
                      <tfoot>
                        <tr className="bg-muted/30 font-semibold border-t-2 border-border">
                          <td colSpan={4} className="px-3 py-3">TOTALS ({filteredInvoices.length} records)</td>
                          <td className="px-3 py-3 text-right">₹{filteredInvoices.reduce((s, inv) => s + (inv.total_amount || 0), 0).toLocaleString()}</td>
                          <td className="px-3 py-3 text-right">₹{filteredInvoices.reduce((s, inv) => s + Math.round((inv.total_amount || 0) * 0.09), 0).toLocaleString()}</td>
                          <td className="px-3 py-3 text-right">₹{filteredInvoices.reduce((s, inv) => s + Math.round((inv.total_amount || 0) * 0.09), 0).toLocaleString()}</td>
                          <td className="px-3 py-3 text-right">₹{filteredInvoices.reduce((s, inv) => s + Math.round((inv.total_amount || 0) * 0.18), 0).toLocaleString()}</td>
                          <td className="px-3 py-3 text-right text-emerald-600">₹{filteredInvoices.reduce((s, inv) => s + (inv.total_amount || 0) + Math.round((inv.total_amount || 0) * 0.18), 0).toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
