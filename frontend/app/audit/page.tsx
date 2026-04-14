'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiService } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';
import { Check, AlertCircle, Clock, TrendingUp, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import type { HAWBAudit, AuditDashboard } from '@/types/logistics';

export default function AuditDashboardPage() {
  const [dashboard, setDashboard] = useState<AuditDashboard | null>(null);
  const [audits, setAudits] = useState<HAWBAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [dashboardData, auditsData] = await Promise.all([
          apiService.getAuditDashboard(),
          apiService.listHAWBAudits({ page: 1, limit: 50 }),
        ]);
        setDashboard(dashboardData);
        setAudits(auditsData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch audit data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredAudits = audits.filter((audit) => {
    const matchesSearch = audit.hawb.toUpperCase().includes(searchTerm.toUpperCase());
    const matchesStatus = filterStatus === 'all' || audit.audit_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const kpiCards = [
    {
      title: 'Total HAWBs',
      value: dashboard?.total_hawbs || 0,
      subtext: 'All shipments',
      icon: <TrendingUp className="w-6 h-6 text-blue-600" />,
      color: 'bg-blue-50 border-blue-200',
    },
    {
      title: 'Pending Audits',
      value: dashboard?.pending_audits || 0,
      subtext: 'Awaiting verification',
      icon: <Clock className="w-6 h-6 text-yellow-600" />,
      color: 'bg-yellow-50 border-yellow-200',
    },
    {
      title: 'Audited Today',
      value: dashboard?.audited_today || 0,
      subtext: 'Completed today',
      icon: <Check className="w-6 h-6 text-green-600" />,
      color: 'bg-green-50 border-green-200',
    },
    {
      title: 'Discrepancies',
      value: dashboard?.discrepancies || 0,
      subtext: 'Issues found',
      icon: <AlertCircle className="w-6 h-6 text-red-600" />,
      color: 'bg-red-50 border-red-200',
    },
  ];

  return (
    <MainLayout title="HAWB Audit Dashboard">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <Card key={card.title} className={`border ${card.color} p-6`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{card.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.subtext}</p>
                </div>
                {card.icon}
              </div>
            </Card>
          ))}
        </div>

        {/* Balance Amount */}
        {dashboard && (
          <Card className="border-blue-200 bg-blue-50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Balance Amount</p>
                <p className="text-4xl font-bold text-foreground mt-2">
                  ₹{(dashboard.balance_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600">{dashboard.discrepancies}</p>
                <p className="text-xs text-muted-foreground">Pending discrepancies</p>
              </div>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="border-destructive bg-destructive/10 border-destructive/50 p-4 text-destructive">
            {error}
          </Card>
        )}

        {/* Search and Filter */}
        <Card className="border-border p-6">
          <div className="flex gap-3 mb-4">
            <Input
              type="text"
              placeholder="Search by HAWB number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
              className="flex-1 bg-input border-border text-foreground"
            />
            <Button className="bg-primary hover:bg-primary/90">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'discrepancy_found', label: 'Discrepancy' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  filterStatus === filter.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/20 text-foreground hover:bg-secondary/40'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Action Button */}
        <Link href="/shipments/booking/manual">
          <Button className="w-full h-12 bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Create New HAWB for Audit
          </Button>
        </Link>

        {/* HAWBs Table */}
        <Card className="border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    HAWB
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Cartons
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Verified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Weight Variance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Audit Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      Loading audits...
                    </td>
                  </tr>
                ) : filteredAudits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      No audits found
                    </td>
                  </tr>
                ) : (
                  filteredAudits.map((audit) => (
                    <tr
                      key={audit.id}
                      className="hover:bg-secondary/20 transition-colors border-b border-border last:border-b-0"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-cyan-500">{audit.hawb}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex">
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              audit.audit_status === 'completed'
                                ? 'bg-green-500/20 text-green-500'
                                : audit.audit_status === 'discrepancy_found'
                                  ? 'bg-red-500/20 text-red-500'
                                  : 'bg-amber-500/20 text-amber-500'
                            }`}
                          >
                            {audit.audit_status.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {audit.total_cartons}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {audit.cartons_verified} / {audit.total_cartons}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        <span className={audit.weight_variance > 0 ? 'text-red-500' : 'text-green-500'}>
                          {audit.weight_variance > 0 ? '+' : ''}{audit.weight_variance} kg
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(audit.audit_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <Button size="sm" variant="ghost" className="text-cyan-500 hover:text-cyan-400">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Activity */}
        {dashboard && (dashboard.recent_activity?.length ?? 0) > 0 && (
          <Card className="border-border p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Recent Audit Activity</h3>
            <div className="space-y-3">
              {dashboard.recent_activity.slice(0, 5).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 pb-3 border-b border-border last:border-b-0 last:pb-0"
                >
                  <div className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{(activity as any).hawb || 'Shipment'}</span> status updated to{' '}
                      <span className="font-semibold capitalize">{activity.new_status.replace(/_/g, ' ')}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
