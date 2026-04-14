'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { apiService } from '@/lib/api';
import { Send, CheckSquare, Square, Bell, Clock, Loader2 } from 'lucide-react';

interface NotificationRecord {
    id: string;
    name: string;
    details: string;
    clients: string[];
    date: string;
}

export default function NotificationsPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [records, setRecords] = useState<NotificationRecord[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form
    const [notifName, setNotifName] = useState('');
    const [notifDetails, setNotifDetails] = useState('');
    const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
    const [clientSearch, setClientSearch] = useState('');

    useEffect(() => {
        const loadClients = async () => {
            try {
                const data = await apiService.listParties({ limit: 200 });
                const cData = data?.data || data || [];
                setCustomers(Array.isArray(cData) ? cData : []);
            } catch (err) { console.error(err); }
        };
        loadClients();
    }, []);

    const toggleClient = (name: string) => {
        setSelectedClients(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name); else next.add(name);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedClients.size === filteredClients.length) setSelectedClients(new Set());
        else setSelectedClients(new Set(filteredClients.map(c => c.name)));
    };

    const filteredClients = clientSearch
        ? customers.filter(c => (c.name || '').toLowerCase().includes(clientSearch.toLowerCase()))
        : customers;

    const handleSend = () => {
        if (!notifName || !notifDetails || selectedClients.size === 0) {
            setMessage({ type: 'error', text: 'Please fill notification name, details, and select at least one client' });
            return;
        }
        const newRecord: NotificationRecord = {
            id: Date.now().toString(),
            name: notifName,
            details: notifDetails,
            clients: Array.from(selectedClients),
            date: new Date().toLocaleDateString('en-IN'),
        };
        setRecords(prev => [newRecord, ...prev]);
        setMessage({ type: 'success', text: `✅ Notification sent to ${selectedClients.size} client(s)` });
        setNotifName(''); setNotifDetails(''); setSelectedClients(new Set());
        setTimeout(() => setMessage(null), 4000);
    };

    return (
        <MainLayout title="Create Notification">
            <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Create Notification</h1>
                    <p className="text-sm text-muted-foreground mt-1">Broadcast notifications to clients</p>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* LEFT: Form + Client Selection */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-foreground">Notification Name</label>
                                    <input value={notifName} onChange={e => setNotifName(e.target.value)} placeholder="Enter notification title" className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-foreground">Notification Details</label>
                                    <textarea value={notifDetails} onChange={e => setNotifDetails(e.target.value)} rows={4} placeholder="Enter notification message..." className="px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm resize-y" />
                                </div>
                            </div>
                        </div>

                        {/* Client Selection Table */}
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                <h3 className="text-sm font-semibold text-foreground">Select Clients ({selectedClients.size} selected)</h3>
                                <input value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Search clients..." className="h-8 px-3 w-48 rounded-md border border-border bg-background text-foreground text-sm" />
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-muted/50">
                                        <tr className="border-b border-border">
                                            <th className="px-3 py-2 text-center w-10">
                                                <button onClick={toggleAll}>{selectedClients.size === filteredClients.length ? <CheckSquare className="w-4 h-4 text-primary mx-auto" /> : <Square className="w-4 h-4 mx-auto" />}</button>
                                            </th>
                                            <th className="px-3 py-2 text-left font-semibold">Client Name</th>
                                            <th className="px-3 py-2 text-left font-semibold">Client Code</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredClients.map(c => (
                                            <tr key={c._id || c.name} onClick={() => toggleClient(c.name)} className={`border-b border-border/50 cursor-pointer transition-colors ${selectedClients.has(c.name) ? 'bg-primary/10' : 'hover:bg-muted/30'}`}>
                                                <td className="px-3 py-2 text-center">{selectedClients.has(c.name) ? <CheckSquare className="w-4 h-4 text-primary mx-auto" /> : <Square className="w-4 h-4 text-muted-foreground mx-auto" />}</td>
                                                <td className="px-3 py-2 font-medium">{c.name}</td>
                                                <td className="px-3 py-2 font-mono text-muted-foreground">{c.code || c._id?.slice(-6) || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-4 py-3 bg-muted/30 border-t border-border">
                                <button onClick={handleSend} disabled={selectedClients.size === 0 || !notifName} className="h-10 px-6 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50">
                                    <Send className="w-4 h-4" /> Send Notification
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: History */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <h3 className="text-sm font-semibold text-foreground">Notification History</h3>
                        </div>
                        {records.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <Bell className="w-12 h-12 mb-4 opacity-20" />
                                <p className="text-sm">No notifications sent yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
                                {records.map(r => (
                                    <div key={r.id} className="px-4 py-3 hover:bg-muted/30">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-sm font-semibold text-foreground">{r.name}</h4>
                                            <span className="text-xs text-muted-foreground">{r.date}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{r.details}</p>
                                        <p className="text-xs text-primary">{r.clients.length} client(s)</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
