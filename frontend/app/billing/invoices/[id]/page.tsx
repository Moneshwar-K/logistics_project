'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { FileText, Download, Mail, CreditCard, ArrowLeft, Printer, Share2, MoreVertical, Edit2, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiService } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

export default function InvoiceDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);

    // Payment Modal
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    const getHeaders = () => { const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; return { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }; };

    useEffect(() => {
        if (id) fetchInvoice();
    }, [id]);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/invoices/${id}`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to load invoice');
            const json = await res.json();
            setInvoice(json.data || json); // Adapter for raw vs envelope
        } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    };

    const handleDownload = async () => {
        try {
            setProcessing(true);
            await apiService.downloadInvoicePDF(id as string);
        } catch (e: any) {
            alert('Download failed: ' + e.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleEmail = async () => {
        if (!confirm('Send invoice via email to registered customer?')) return;
        try {
            setProcessing(true);
            const res = await fetch(`${API_BASE}/invoices/${id}/send-email`, { method: 'POST', headers: getHeaders() });
            if (!res.ok) throw new Error('Email failed');
            alert('Email sent successfully');
        } catch (e: any) { alert(e.message); } finally { setProcessing(false); }
    };

    const handleRecordPayment = async () => {
        if (!paymentAmount) return;
        try {
            setProcessing(true);
            const res = await fetch(`${API_BASE}/invoices/${id}/payments`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    amount: Number(paymentAmount),
                    payment_method: paymentMethod,
                    payment_date: paymentDate
                })
            });

            if (!res.ok) throw new Error('Payment recording failed');

            setShowPaymentModal(false);
            fetchInvoice(); // Reload
            setPaymentAmount('');
        } catch (e: any) { alert(e.message); } finally { setProcessing(false); }
    };

    if (loading) return <MainLayout><div className="flex h-screen items-center justify-center">Loading invoice details...</div></MainLayout>;
    if (!invoice) return <MainLayout><div className="p-8 text-center text-destructive">Invoice not found</div></MainLayout>;

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'paid': return 'bg-green-100 text-green-700';
            case 'partial': return 'bg-yellow-100 text-yellow-700';
            case 'overdue': return 'bg-red-100 text-red-700';
            default: return 'bg-blue-100 text-blue-700';
        }
    };

    return (
        <MainLayout title={`Invoice ${invoice.invoice_number}`}>
            <div className="max-w-5xl mx-auto p-6 space-y-6">

                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <button onClick={() => router.back()} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Invoices
                    </button>
                    <div className="flex items-center gap-2">
                        <button onClick={handleEmail} disabled={processing} className="inline-flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm hover:bg-muted font-medium">
                            <Mail className="w-4 h-4" /> Email
                        </button>
                        <button onClick={handleDownload} disabled={processing} className="inline-flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm hover:bg-muted font-medium">
                            <Download className="w-4 h-4" /> Download PDF
                        </button>
                        {invoice.payment_status !== 'paid' && (
                            <button onClick={() => setShowPaymentModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 font-medium">
                                <CreditCard className="w-4 h-4" /> Record Payment
                            </button>
                        )}
                    </div>
                </div>

                {/* Status Banner */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-foreground">{invoice.invoice_number}</h1>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusColor(invoice.payment_status)}`}>
                                    {invoice.payment_status}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Issued on <span className="font-medium text-foreground">{new Date(invoice.invoice_date).toLocaleDateString()}</span> • Due on <span className="font-medium text-foreground">{new Date(invoice.due_date).toLocaleDateString()}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                            <div className="text-3xl font-bold font-mono">
                                {invoice.currency} {invoice.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            {invoice.paid_amount > 0 && (
                                <p className="text-sm text-green-600 mt-1 font-medium">
                                    Paid: {invoice.currency} {invoice.paid_amount.toLocaleString()} (Bal: {invoice.currency} {invoice.balance_amount.toLocaleString()})
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Bill To & Ship To */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border rounded-xl p-6">
                            <div>
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Billed To</h3>
                                <div className="text-sm space-y-1">
                                    <p className="font-semibold text-base">{invoice.billed_party_id?.name || 'Unknown Party'}</p>
                                    <p>{invoice.billed_party_id?.address}</p>
                                    <p>{invoice.billed_party_id?.city}, {invoice.billed_party_id?.state} {invoice.billed_party_id?.postal_code}</p>
                                    <p>GSTIN: {invoice.billed_party_id?.gst_number || '—'}</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Shipment Details</h3>
                                <div className="text-sm space-y-2">
                                    <div className="flex justify-between border-b border-border/50 pb-2">
                                        <span className="text-muted-foreground">Term:</span>
                                        <span className="font-medium">{invoice.shipment_id?.hawb}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-border/50 pb-2">
                                        <span className="text-muted-foreground">Reference:</span>
                                        <span className="font-medium">{invoice.shipment_id?.reference_number || '—'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-border/50 pb-2">
                                        <span className="text-muted-foreground">Origin:</span>
                                        <span>{invoice.shipment_id?.origin_city}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-border/50 pb-2">
                                        <span className="text-muted-foreground">Destination:</span>
                                        <span>{invoice.shipment_id?.destination_city}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Weight:</span>
                                        <span>{invoice.shipment_id?.total_weight} kg</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-border">
                                <h3 className="font-semibold">Invoice Items</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/30">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Description</th>
                                            <th className="px-6 py-3 text-left font-medium text-muted-foreground">HSN/SAC</th>
                                            <th className="px-6 py-3 text-right font-medium text-muted-foreground">Qty</th>
                                            <th className="px-6 py-3 text-right font-medium text-muted-foreground">Rate</th>
                                            <th className="px-6 py-3 text-right font-medium text-muted-foreground">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {invoice.charges?.map((item: any) => (
                                            <tr key={item._id}>
                                                <td className="px-6 py-3 font-medium">{item.description}</td>
                                                <td className="px-6 py-3 text-muted-foreground">{item.hsn_code || '996511'}</td>
                                                <td className="px-6 py-3 text-right">{item.quantity}</td>
                                                <td className="px-6 py-3 text-right">{item.unit_price.toLocaleString()}</td>
                                                <td className="px-6 py-3 text-right font-medium">{item.amount.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-muted/10 font-medium">
                                        <tr>
                                            <td colSpan={4} className="px-6 py-3 text-right text-muted-foreground">Subtotal</td>
                                            <td className="px-6 py-3 text-right">{invoice.subtotal.toLocaleString()}</td>
                                        </tr>
                                        {(invoice.igst > 0) ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-3 text-right text-muted-foreground">IGST (18%)</td>
                                                <td className="px-6 py-3 text-right">{invoice.igst.toLocaleString()}</td>
                                            </tr>
                                        ) : (
                                            <>
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-3 text-right text-muted-foreground">CGST (9%)</td>
                                                    <td className="px-6 py-3 text-right">{invoice.cgst.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-3 text-right text-muted-foreground">SGST (9%)</td>
                                                    <td className="px-6 py-3 text-right">{invoice.sgst.toLocaleString()}</td>
                                                </tr>
                                            </>
                                        )}
                                        <tr className="text-base border-t border-border">
                                            <td colSpan={4} className="px-6 py-4 text-right font-bold">Total</td>
                                            <td className="px-6 py-4 text-right font-bold">{invoice.currency} {invoice.total_amount.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Timeline/Payment */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="font-semibold mb-4">Payment History</h3>
                            <div className="space-y-4">
                                {invoice.payment_history?.length > 0 ? (
                                    invoice.payment_history.map((p: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium">{new Date(p.date).toLocaleDateString()}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{p.method}</p>
                                            </div>
                                            <span className="font-mono">{invoice.currency} {p.amount.toLocaleString()}</span>
                                        </div>
                                    ))
                                ) : (
                                    invoice.paid_amount > 0 ? (
                                        <div className="flex justify-between items-center text-sm">
                                            <div>
                                                <p className="font-medium">{new Date(invoice.last_payment_date || invoice.updated_at).toLocaleDateString()}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{invoice.payment_method}</p>
                                            </div>
                                            <span className="font-mono">{invoice.currency} {invoice.paid_amount.toLocaleString()}</span>
                                        </div>
                                    ) : <p className="text-sm text-muted-foreground italic">No payments recorded</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-muted/20 border border-border rounded-xl p-6">
                            <h3 className="font-semibold mb-2 text-sm">Notes</h3>
                            <p className="text-sm text-muted-foreground">{invoice.notes || 'No notes added.'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-2xl p-6">
                        <h3 className="font-bold text-lg mb-4">Record Payment</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">Amount</label>
                                <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg" placeholder="0.00" autoFocus />
                                <p className="text-xs text-muted-foreground mt-1">Balance: {invoice.balance_amount}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">Payment Method</label>
                                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg">
                                    <option value="bank_transfer">Bank Transfer / NEFT</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI / Online</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">Date</label>
                                <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                            <button onClick={handleRecordPayment} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Confirm Payment</button>
                        </div>
                    </div>
                </div>
            )}

        </MainLayout>
    );
}
