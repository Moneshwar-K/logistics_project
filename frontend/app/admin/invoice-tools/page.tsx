'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { FileText, Printer, Settings, Save } from 'lucide-react';

export default function InvoiceToolsPage() {
    const [activeTab, setActiveTab] = useState<'bill-sequence' | 'print-settings'>('bill-sequence');
    const [billSequence, setBillSequence] = useState({
        prefix: 'INV',
        current_number: 1001,
        separator: '-'
    });
    const [printSettings, setPrintSettings] = useState({
        show_header: true,
        show_footer: true,
        copies: 3,
        paper_size: 'A4'
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
        alert('Settings saved successfully (Simulation)');
    };

    return (
        <MainLayout title="Invoice Tools">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Invoice Tools</h1>
                    <p className="text-sm text-muted-foreground mt-1">Configure invoice numbering and print preferences.</p>
                </div>

                <div className="flex gap-4 border-b border-border">
                    <button
                        onClick={() => setActiveTab('bill-sequence')}
                        className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'bill-sequence' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Bill Sequence</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('print-settings')}
                        className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'print-settings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        <span className="flex items-center gap-2"><Printer className="w-4 h-4" /> Print Settings</span>
                    </button>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    {activeTab === 'bill-sequence' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Bill Number Configuration</h3>
                                <p className="text-sm text-muted-foreground mb-4">Set the starting number and format for generated invoices.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-1 block">Prefix</label>
                                    <input
                                        type="text"
                                        value={billSequence.prefix}
                                        onChange={(e) => setBillSequence({ ...billSequence, prefix: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-1 block">Separator</label>
                                    <select
                                        value={billSequence.separator}
                                        onChange={(e) => setBillSequence({ ...billSequence, separator: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                                    >
                                        <option value="-">-</option>
                                        <option value="/">/</option>
                                        <option value="">(None)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-1 block">Start Number</label>
                                    <input
                                        type="number"
                                        value={billSequence.current_number}
                                        onChange={(e) => setBillSequence({ ...billSequence, current_number: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-muted/50 rounded-lg">
                                <span className="text-xs font-medium text-muted-foreground block mb-1">Preview</span>
                                <span className="text-xl font-mono font-bold text-foreground">
                                    {billSequence.prefix}{billSequence.separator}{billSequence.current_number}
                                </span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'print-settings' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Print Preferences</h3>
                                <p className="text-sm text-muted-foreground mb-4">Customize how invoices look when printed.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                                    <label className="text-sm font-medium text-foreground">Show Letterhead / Header</label>
                                    <input
                                        type="checkbox"
                                        checked={printSettings.show_header}
                                        onChange={(e) => setPrintSettings({ ...printSettings, show_header: e.target.checked })}
                                        className="w-5 h-5 accent-primary"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                                    <label className="text-sm font-medium text-foreground">Show Footer / Terms</label>
                                    <input
                                        type="checkbox"
                                        checked={printSettings.show_footer}
                                        onChange={(e) => setPrintSettings({ ...printSettings, show_footer: e.target.checked })}
                                        className="w-5 h-5 accent-primary"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-foreground mb-1 block">Default Copies</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="5"
                                            value={printSettings.copies}
                                            onChange={(e) => setPrintSettings({ ...printSettings, copies: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-foreground mb-1 block">Paper Size</label>
                                        <select
                                            value={printSettings.paper_size}
                                            onChange={(e) => setPrintSettings({ ...printSettings, paper_size: e.target.value })}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        >
                                            <option value="A4">A4</option>
                                            <option value="A5">A5</option>
                                            <option value="Letter">Letter</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end pt-4 border-t border-border">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
