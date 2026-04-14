'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { apiService } from '@/lib/api';
import {
  Search, Loader2, CheckSquare, Square, Calendar, Clock, RefreshCw,
  ArrowRight, History, RotateCcw, Package
} from 'lucide-react';

type ShipmentStatus = 'pending' | 'picked_up' | 'in_transit' | 'in_port' | 'customs_clearance' |
  'ready_for_delivery' | 'out_for_delivery' | 'delivered' | 'on_hold' | 'cancelled' | 'exception';

const shipmentStatuses: { value: ShipmentStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Booked', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'picked_up', label: 'Dispatched', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'in_transit', label: 'Hub Received', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'duty_billed', label: 'Duty Billed', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400' },
  { value: 'cancelled', label: 'RTO / Returned', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'exception', label: 'Exception', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' },
];

interface HawbItem {
  _id: string;
  hawb: string;
  total_weight: number;
  total_cartons: number;
  status: string;
  created_at: string;
  destination_city: string;
}

interface HistoryEntry {
  id: string;
  date: string;
  status: string;
  hawbStatus: string;
  hawb: string;
}

export default function StatusUpdatePage() {
  const [shipments, setShipments] = useState<HawbItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [hawbSearch, setHawbSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newStatus, setNewStatus] = useState<ShipmentStatus>('picked_up');
  const [operationDate, setOperationDate] = useState(new Date().toISOString().split('T')[0] + 'T' + new Date().toTimeString().slice(0, 5));
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSearchByDate = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const filters: any = { limit: 200, date_from: searchDate, date_to: searchDate };
      const response = await apiService.listShipments(filters);
      let data = (response?.data || []) as any[];
      if (!Array.isArray(data)) data = [];
      setShipments(data);
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Search failed:', err);
      setShipments([]);
    } finally { setLoading(false); }
  }, [searchDate]);

  const handleHawbSearch = async () => {
    if (!hawbSearch.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await apiService.listShipments({ hawb: hawbSearch.trim(), limit: 1 });
      let data = (response?.data || []) as any[];
      if (data.length > 0) {
        setShipments(data);
        setSelectedIds(new Set([data[0]._id]));
        setMessage({ type: 'success', text: `Found HAWB: ${data[0].hawb}` });
      } else {
        setMessage({ type: 'error', text: 'HAWB not found' });
      }
    } catch (err) {
      console.error('HAWB Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredShipments = hawbSearch && !loading
    ? shipments.filter(s => (s.hawb || '').toLowerCase().includes(hawbSearch.toLowerCase()))
    : shipments;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredShipments.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredShipments.map(s => s._id)));
  };

  const handleUpdateStatus = async () => {
    if (selectedIds.size === 0) {
      setMessage({ type: 'error', text: 'Select at least one HAWB' }); return;
    }
    setUpdating(true);
    setMessage(null);
    try {
      const selectedIdsArray = Array.from(selectedIds);
      const results = await Promise.allSettled(
        selectedIdsArray.map(id => apiService.updateShipment(id, { status: newStatus }))
      );

      const successfulIds: string[] = [];
      const failures: string[] = [];

      results.forEach((res, index) => {
        if (res.status === 'fulfilled') {
          successfulIds.push(selectedIdsArray[index]);
        } else {
          failures.push(res.reason?.message || 'Update failed');
        }
      });

      if (successfulIds.length > 0) {
        // Add to history
        const statusLabel = shipmentStatuses.find(s => s.value === newStatus)?.label || newStatus;
        const selectedHawbs = shipments.filter(s => successfulIds.includes(s._id));
        const newEntries: HistoryEntry[] = selectedHawbs.map(s => ({
          id: Date.now().toString() + s._id,
          date: operationDate.replace('T', ' '),
          status: statusLabel,
          hawbStatus: newStatus,
          hawb: s.hawb,
        }));
        setHistory(prev => [...newEntries, ...prev]);

        // Update local state ONLY for successful ones
        setShipments(prev => prev.map(s =>
          successfulIds.includes(s._id) ? { ...s, status: newStatus } : s
        ));
        
        const successText = `✅ Status updated for ${successfulIds.length} HAWB(s).`;
        const failureText = failures.length > 0 ? ` ⚠️ ${failures.length} failed (Invalid transition).` : '';
        setMessage({ 
          type: failures.length > 0 && successfulIds.length === 0 ? 'error' : 'success', 
          text: successText + failureText 
        });
      } else if (failures.length > 0) {
        setMessage({ type: 'error', text: `❌ Failed to update: ${failures[0]}` });
      }

      setSelectedIds(new Set());
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Update process failed' });
    } finally { setUpdating(false); }
  };

  const getStatusBadge = (status: string) => {
    const s = shipmentStatuses.find(x => x.value === status);
    return s ? s : { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <MainLayout title="Operation Status Update">
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Operation Status Update</h1>
          <p className="text-sm text-muted-foreground mt-1">Search HAWBs by date and update operation status in bulk</p>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'}`}>
            {message.text}
          </div>
        )}

        {/* Search by Date */}
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Search By Date</label>
              <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
            </div>
            <button onClick={handleSearchByDate} className="h-9 px-5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2">
              <Search className="w-4 h-4" /> SEARCH BY DATE
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT: HAWB Table */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground uppercase">HAWB List ({filteredShipments.length})</h3>
              <div className="flex items-center gap-1">
                <input 
                  value={hawbSearch} 
                  onChange={e => setHawbSearch(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleHawbSearch()}
                  placeholder="Enter HAWB No..." 
                  className="h-8 px-3 w-44 rounded-md border border-border bg-background text-foreground text-sm" 
                />
                <button 
                  onClick={handleHawbSearch}
                  className="p-1.5 rounded-md bg-muted hover:bg-muted font-medium text-xs border border-border flex items-center gap-1"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Searching...</div>
            ) : filteredShipments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Package className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium">No HAWBs found</p>
                <p className="text-sm mt-1">Select a date and click "SEARCH BY DATE"</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/50">
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-center w-10">
                        <button onClick={toggleAll}>{selectedIds.size === filteredShipments.length ? <CheckSquare className="w-4 h-4 text-primary mx-auto" /> : <Square className="w-4 h-4 mx-auto" />}</button>
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">S.No</th>
                      <th className="px-3 py-2 text-left font-semibold">HAWB No</th>
                      <th className="px-3 py-2 text-right font-semibold">Weight</th>
                      <th className="px-3 py-2 text-right font-semibold">PCS</th>
                      <th className="px-3 py-2 text-left font-semibold">Destination</th>
                      <th className="px-3 py-2 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShipments.map((s, i) => {
                      const badge = getStatusBadge(s.status);
                      return (
                        <tr key={s._id} onClick={() => toggleSelect(s._id)} className={`border-b border-border/50 cursor-pointer transition-colors ${selectedIds.has(s._id) ? 'bg-primary/10' : 'hover:bg-muted/30'}`}>
                          <td className="px-3 py-2 text-center">{selectedIds.has(s._id) ? <CheckSquare className="w-4 h-4 text-primary mx-auto" /> : <Square className="w-4 h-4 text-muted-foreground mx-auto" />}</td>
                          <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-2 font-mono font-bold text-primary">{s.hawb}</td>
                          <td className="px-3 py-2 text-right">{s.total_weight} kg</td>
                          <td className="px-3 py-2 text-right">{s.total_cartons}</td>
                          <td className="px-3 py-2">{s.destination_city || '—'}</td>
                          <td className="px-3 py-2"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>{badge.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Update Controls */}
            {filteredShipments.length > 0 && (
              <div className="px-4 py-3 bg-muted/30 border-t border-border">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Operation Status</label>
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value as ShipmentStatus)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm min-w-[180px]">
                      {shipmentStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Operation Date & Time</label>
                    <input type="datetime-local" value={operationDate} onChange={e => setOperationDate(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                  </div>
                  <button onClick={handleUpdateStatus} disabled={updating || selectedIds.size === 0} className="h-9 px-5 text-sm font-medium bg-emerald-500 text-white rounded-md hover:bg-emerald-600 flex items-center gap-2 disabled:opacity-50">
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    Update Status ({selectedIds.size})
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: History */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Update History</h3>
              </div>
              {history.length > 0 && <button onClick={() => setHistory([])} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>}
            </div>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Clock className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">No updates performed yet</p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/50">
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left font-semibold">Operation Date</th>
                      <th className="px-3 py-2 text-left font-semibold">Operation Status</th>
                      <th className="px-3 py-2 text-left font-semibold">HAWB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(h => {
                      const badge = getStatusBadge(h.hawbStatus);
                      return (
                        <tr key={h.id} className="border-b border-border/50">
                          <td className="px-3 py-2 text-muted-foreground">{h.date}</td>
                          <td className="px-3 py-2"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>{h.status}</span></td>
                          <td className="px-3 py-2 font-mono">{h.hawb}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
