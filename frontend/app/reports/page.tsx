'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Package, DollarSign, AlertTriangle,
  CheckCircle, Download, BarChart3, ArrowUpRight, ArrowDownRight, Loader2, RefreshCw
} from 'lucide-react';
import { apiService } from '@/lib/api';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', picked_up: 'Picked Up', manifested: 'Manifested', dispatched: 'Dispatched',
  in_transit: 'In Transit', in_port: 'In Port', received_at_hub: 'At Hub', received_at_destination: 'At Destination',
  customs_clearance: 'Customs', ready_for_delivery: 'Ready', out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered', on_hold: 'On Hold', cancelled: 'Cancelled', exception: 'Exception',
  out_for_pickup: 'Out for Pickup',
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-bold">{typeof p.value === 'number' && p.name.toLowerCase().includes('revenue')
            ? `₹${p.value.toLocaleString()}` : p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);

  // Real data from APIs
  const [dashboardKPI, setDashboardKPI] = useState<any>(null);
  const [shipmentData, setShipmentData] = useState<any[]>([]);
  const [billingData, setBillingData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  const fetchAllReports = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, shipRes, billRes, perfRes] = await Promise.allSettled([
        apiService.getDashboard(),
        apiService.getShipmentReports(),
        apiService.getBillingReports(),
        apiService.getPerformanceReports(),
      ]);

      if (dashRes.status === 'fulfilled') setDashboardKPI(dashRes.value?.data || null);
      if (shipRes.status === 'fulfilled') setShipmentData(shipRes.value?.data || []);
      if (billRes.status === 'fulfilled') setBillingData(billRes.value?.data || []);
      if (perfRes.status === 'fulfilled') setPerformanceData(perfRes.value?.data || []);
    } catch (e) {
      console.error('Reports fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllReports(); }, [fetchAllReports]);

  // Derived KPI values
  const totalShipments = performanceData.reduce((sum, p) => sum + (p.count || 0), 0);
  const deliveredCount = performanceData.find(p => p.status === 'delivered')?.count || 0;
  const exceptionCount = performanceData.find(p => p.status === 'exception')?.count || 0;
  const onTimeRate = totalShipments > 0 ? ((deliveredCount / totalShipments) * 100).toFixed(1) : '0';

  const totalRevenue = billingData.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const totalInvoices = billingData.reduce((sum, b) => sum + (b.invoice_count || 0), 0);

  // Pie chart data from performance
  const statusPieData = performanceData
    .filter(p => p.count > 0)
    .map((p, i) => ({ name: STATUS_LABELS[p.status] || p.status, value: p.count, color: COLORS[i % COLORS.length] }));

  // Shipment chart data (by date)
  const shipmentChartData = shipmentData.map(s => ({
    date: s.date ? new Date(s.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '',
    shipments: s.count || 0,
    weight: Math.round(s.total_weight || 0),
    value: s.total_value || 0,
  })).reverse().slice(-14); // last 14 data points

  // Billing chart data (by date)
  const billingChartData = billingData.map(b => ({
    date: b.date ? new Date(b.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '',
    revenue: b.total_amount || 0,
    invoices: b.invoice_count || 0,
  })).reverse().slice(-14);

  const kpiCards = [
    { label: 'Total Shipments', value: totalShipments.toLocaleString(), icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Revenue', value: `₹${totalRevenue >= 100000 ? (totalRevenue / 100000).toFixed(2) + 'L' : totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Delivery Rate', value: `${onTimeRate}%`, icon: CheckCircle, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: 'Exceptions', value: exceptionCount.toLocaleString(), icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <MainLayout title="Reports & Analytics">
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" /> Reports & Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Live operational and financial performance data</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchAllReports} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-muted rounded-lg hover:bg-muted/80 text-foreground transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-muted rounded-lg hover:bg-muted/80 text-foreground transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="ml-3 text-muted-foreground">Loading reports...</span>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map(card => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
                      </div>
                      <div className={`p-2.5 rounded-xl ${card.bg}`}>
                        <Icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Dashboard KPIs */}
            {dashboardKPI && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Active Shipments', value: dashboardKPI.active_shipments || 0, color: 'text-blue-400' },
                  { label: 'Delivered Today', value: dashboardKPI.delivered_today || 0, color: 'text-green-400' },
                  { label: 'Pending Audits', value: dashboardKPI.pending_audits || 0, color: 'text-amber-400' },
                  { label: 'Exceptions', value: dashboardKPI.exceptions || 0, color: 'text-red-400' },
                ].map(item => (
                  <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className={`text-xl font-bold mt-1 ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Shipment Volume + Status Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Volume Area Chart */}
              <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Shipment Volume</h2>
                    <p className="text-xs text-muted-foreground">Bookings by date (live data)</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{totalInvoices} invoices total</span>
                </div>
                {shipmentChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={shipmentChartData}>
                      <defs>
                        <linearGradient id="shipGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.4} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="shipments" name="Shipments" stroke="#6366f1" fill="url(#shipGrad)" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No shipment data available</div>
                )}
              </div>

              {/* Pie Chart Status */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-foreground">Status Distribution</h2>
                  <p className="text-xs text-muted-foreground">Current shipment statuses (live)</p>
                </div>
                {statusPieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                          {statusPieData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any, name: string) => [v, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {statusPieData.map(s => (
                        <div key={s.name} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ background: s.color }} />
                            {s.name}
                          </span>
                          <span className="font-semibold text-foreground">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No data</div>
                )}
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Billing by Date</h2>
                  <p className="text-xs text-muted-foreground">Invoice amounts generated (live data)</p>
                </div>
                <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> ₹{totalRevenue.toLocaleString()} total
                </span>
              </div>
              {billingChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={billingChartData} barSize={36}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.4} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" name="Revenue" fill="url(#revGrad)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No billing data available</div>
              )}
            </div>

            {/* Performance Table */}
            {performanceData.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-foreground">Performance by Status</h2>
                  <p className="text-xs text-muted-foreground">Shipment counts by current status</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Count</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Avg Delivery (days)</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.map((p, i) => (
                        <tr key={p.status} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-3 font-semibold text-foreground capitalize">{STATUS_LABELS[p.status] || p.status}</td>
                          <td className="py-3 px-3 text-foreground">{p.count}</td>
                          <td className="py-3 px-3 text-muted-foreground">{p.avg_delivery_days ? p.avg_delivery_days.toFixed(1) : '—'}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-1.5 max-w-[80px]">
                                <div className="h-1.5 rounded-full" style={{ width: `${totalShipments > 0 ? (p.count / totalShipments) * 100 : 0}%`, background: COLORS[i % COLORS.length] }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{totalShipments > 0 ? Math.round((p.count / totalShipments) * 100) : 0}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
