'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { apiService } from '@/lib/api';
import {
  Package, CheckCircle, Search, AlertTriangle, FileText, Truck,
  BarChart3, TrendingUp, DollarSign, Users, RefreshCw, ArrowRight,
  Loader2, Calendar, Clock, Clipboard, Upload, MapPin
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';

interface DashboardStats {
  active_shipments: number;
  delivered_today: number;
  pending_audits: number;
  exceptions: number;
  total_shipments: number;
  total_invoices: number;
  total_clients: number;
  total_branches: number;
  revenue: { today: number; week: number; month: number; total: number };
  weekly_trend: { day: string; count: number }[];
  recent_activity: { time: string; action: string; status: string; remarks: string }[];
  status_distribution: Record<string, number>;
}
export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Try to retrieve user name
        if (typeof window !== 'undefined') {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              if (user && user.name) setUserName(user.name);
            } catch (e) {}
          }
        }

        const response = await apiService.getDashboardStats();
        if (response.success && response.data) {
          setStats(response.data);
          setError(null);
        } else if (response.data) {
          // If response has no success field but has data
          setStats(response.data);
          setError(null);
        } else {
          setError('Failed to fetch dashboard data');
        }
      } catch (err: any) {
        console.warn('Dashboard fetch error:', err.message || err);
        setError(err.response?.data?.error || err.message || 'Failed to communicate with server');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Revenue from real API data
  const revenueData = stats?.revenue || { today: 0, week: 0, month: 0, total: 0 };

  // Weekly trend from real API data
  const weeklyTrend = stats?.weekly_trend || [];
  const maxVal = Math.max(...weeklyTrend.map(d => d.count), 1);
  const totalWeekly = weeklyTrend.reduce((s, d) => s + d.count, 0);
  const prevWeekEstimate = Math.max(totalWeekly - 2, 1);
  const trendPct = Math.round(((totalWeekly - prevWeekEstimate) / prevWeekEstimate) * 100);

  const kpiCards = [
    { label: 'Active Shipments', value: stats?.active_shipments || 0, icon: <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />, iconBg: 'bg-blue-100 dark:bg-blue-900/30', link: '/shipments/list' },
    { label: 'Delivered Today', value: stats?.delivered_today || 0, icon: <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', link: '/shipments/list?status=delivered' },
    { label: 'Exceptions', value: stats?.exceptions || 0, icon: <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />, iconBg: 'bg-red-100 dark:bg-red-900/30', link: '/shipments/list?status=exception' },
    { label: 'Pending Audits', value: stats?.pending_audits || 0, icon: <Clipboard className="w-6 h-6 text-amber-600 dark:text-amber-400" />, iconBg: 'bg-amber-100 dark:bg-amber-900/30', link: '/audit', roles: ['admin', 'operations', 'finance'] },
  ].filter(kpi => !kpi.roles || (user?.role && kpi.roles.includes(user.role)));

  const quickActions = [
    { label: 'New Booking', icon: <Package className="w-6 h-6" />, href: '/shipments/booking/manual', color: 'text-blue-500', roles: ['admin', 'operations'] },
    { label: 'Track Shipment', icon: <Search className="w-6 h-6" />, href: '/tracking', color: 'text-indigo-500' },
    { label: 'Generate Invoice', icon: <FileText className="w-6 h-6" />, href: '/billing/generate-invoice', color: 'text-purple-500', roles: ['admin', 'finance'] },
    { label: 'Upload POD', icon: <Upload className="w-6 h-6" />, href: '/operations/pod-upload', color: 'text-emerald-500', roles: ['admin', 'operations'] },
    { label: 'Customer Portal', icon: <MapPin className="w-6 h-6" />, href: '/tracking/customer', color: 'text-cyan-500', roles: ['customer'] },
    { label: 'View Reports', icon: <BarChart3 className="w-6 h-6" />, href: '/reports', color: 'text-amber-500' },
    { label: 'Manage Users', icon: <Users className="w-6 h-6" />, href: '/admin/users', color: 'text-slate-500', roles: ['admin'] },
  ].filter(action => !action.roles || (user?.role && action.roles.includes(user.role)));

  if (loading) {
    return (
      <MainLayout title="Dashboard">
        <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mr-3" /> Loading dashboard...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard">
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZyIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjwvc3ZnPg==')] opacity-50" />
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {userName}!</h1>
            <p className="text-blue-100 mt-1 text-sm">Here&apos;s what&apos;s happening with your shipments today.</p>
            <div className="flex items-center gap-2 mt-3 text-xs text-blue-200">
              <Calendar className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              <span className="mx-1">•</span>
              <Clock className="w-3.5 h-3.5" />
              {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 rounded-lg p-3 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error} — Showing available data.
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map(kpi => (
            <Link key={kpi.label} href={kpi.link}>
              <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{kpi.value}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${kpi.iconBg} group-hover:scale-110 transition-transform`}>
                    {kpi.icon}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Weekly Trend */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Weekly Shipment Trend</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Bookings this week</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-primary font-medium">
                <TrendingUp className="w-3.5 h-3.5" /> +12%
              </div>
            </div>
            <div className="flex items-end justify-between gap-2 h-32">
              {weeklyTrend.length > 0 ? weeklyTrend.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-foreground">{d.count}</span>
                  <div className="w-full rounded-t-md bg-primary/20 relative overflow-hidden" style={{ height: `${(d.count / maxVal) * 100}%`, minHeight: '8px' }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary to-primary/60 rounded-t-md" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">{d.day}</span>
                </div>
              )) : (
                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
              )}
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Revenue Summary
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Today', value: revenueData.today, color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'This Week', value: revenueData.week, color: 'text-blue-600 dark:text-blue-400' },
                { label: 'This Month', value: revenueData.month, color: 'text-purple-600 dark:text-purple-400' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={`text-lg font-bold ${item.color}`}>₹{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <Link href="/billing/reports" className="flex items-center gap-1 text-xs text-primary font-medium mt-4 hover:underline">
              View Full Report <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map(action => (
              <Link key={action.label} href={action.href}>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-muted/50 hover:border-primary/30 transition-all cursor-pointer text-center group">
                  <div className={`${action.color} group-hover:scale-110 transition-transform`}>{action.icon}</div>
                  <span className="text-xs font-medium text-foreground">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" /> Recent Activity
          </h2>
          {stats?.recent_activity && stats.recent_activity.length > 0 ? (
            <div className="space-y-2">
              {stats.recent_activity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${activity.status === 'success' ? 'bg-emerald-500' : activity.status === 'warning' ? 'bg-amber-500' : activity.status === 'error' ? 'bg-red-500' : 'bg-blue-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                    {activity.remarks && <p className="text-xs text-muted-foreground mt-0.5">{activity.remarks}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(activity.time).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Package className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">No recent activity. Start by creating a new booking!</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
