'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiService } from '@/lib/api';
import { Download, ArrowLeft, FileText, DollarSign, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import type { Invoice } from '@/types/logistics';

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (params.id) {
            fetchInvoice(params.id as string);
        }
    }, [params.id]);

    const fetchInvoice = async (id: string) => {
        setLoading(true);
        setError('');
        try {
            const result = await apiService.getInvoice(id);
            setInvoice(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch invoice');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!invoice) return;
        try {
            // This would call API to download PDF
            alert('Download functionality will trigger PDF download from backend');
        } catch (err) {
            alert('Failed to download invoice');
        }
    };

    if (loading) {
        return (
            <MainLayout title="Invoice Details">
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-muted-foreground">Loading invoice...</p>
                </div>
            </MainLayout>
        );
    }

    if (error || !invoice) {
        return (
            <MainLayout title="Invoice Details">
                <Card className="p-8 text-center border-destructive bg-destructive/10">
                    <p className="text-destructive">{error || 'Invoice not found'}</p>
                    <Button onClick={() => router.push('/invoices/list')} className="mt-4">
                        Back to List
                    </Button>
                </Card>
            </MainLayout>
        );
    }

    return (
        <MainLayout title={`Invoice - ${invoice.invoice_number}`}>
            <div className="p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/invoices/list')}
                            className="border-border"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">{invoice.invoice_number}</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Generated: {new Date(invoice.created_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90">
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                        </Button>
                    </div>
                </div>

                {/* Status Banner */}
                <Card className={`p-4 ${invoice.payment_status === 'paid'
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20'
                        : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Payment Status</p>
                            <p className="text-2xl font-bold mt-1" style={{
                                color: invoice.payment_status === 'paid' ? '#16a34a' : '#ca8a04'
                            }}>
                                {invoice.payment_status.toUpperCase()}
                            </p>
                        </div>
                        <DollarSign className="w-12 h-12" style={{
                            color: invoice.payment_status === 'paid' ? '#16a34a' : '#ca8a04'
                        }} />
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Invoice Details */}
                    <Card className="p-6 border-border">
                        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Invoice Information
                        </h2>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Invoice Number</p>
                                    <p className="font-mono font-semibold text-foreground">{invoice.invoice_number}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Currency</p>
                                    <p className="font-semibold text-foreground">{invoice.currency}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Subtotal</p>
                                    <p className="font-semibold text-foreground">
                                        {invoice.currency} {invoice.subtotal.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Tax ({invoice.tax_percentage}%)</p>
                                    <p className="font-semibold text-foreground">
                                        {invoice.currency} {invoice.tax_amount.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="pt-3 border-t border-border">
                                <p className="text-sm text-muted-foreground">Total Amount</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {invoice.currency} {invoice.total_amount.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Dates */}
                    <Card className="p-6 border-border">
                        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Important Dates
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Invoice Date</p>
                                <p className="font-semibold text-foreground">
                                    {new Date(invoice.invoice_date).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Due Date</p>
                                <p className="font-semibold text-foreground">
                                    {new Date(invoice.due_date).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Days Until Due</p>
                                <p className={`font-semibold ${new Date(invoice.due_date) < new Date()
                                        ? 'text-red-600'
                                        : 'text-green-600'
                                    }`}>
                                    {Math.ceil((new Date(invoice.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Billed Party */}
                    <Card className="p-6 border-border">
                        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Billed Party
                        </h2>
                        {invoice.billed_party && (
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm text-muted-foreground">Name</p>
                                    <p className="font-semibold text-foreground">{invoice.billed_party.name}</p>
                                </div>
                                {invoice.billed_party.email && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p className="text-foreground">{invoice.billed_party.email}</p>
                                    </div>
                                )}
                                {invoice.billed_party.phone && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Phone</p>
                                        <p className="text-foreground">{invoice.billed_party.phone}</p>
                                    </div>
                                )}
                                {invoice.billed_party.gst_number && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">GST Number</p>
                                        <p className="font-mono text-foreground">{invoice.billed_party.gst_number}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Shipment Link */}
                    <Card className="p-6 border-border">
                        <h2 className="text-lg font-bold text-foreground mb-4">Related Shipment</h2>
                        {invoice.shipment && (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">HAWB</p>
                                    <Link href={`/shipments/${invoice.shipment_id}`}>
                                        <p className="font-mono font-bold text-primary hover:underline cursor-pointer">
                                            {invoice.shipment.hawb}
                                        </p>
                                    </Link>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Route</p>
                                    <p className="text-foreground">
                                        {invoice.shipment.origin_city} → {invoice.shipment.destination_city}
                                    </p>
                                </div>
                                <Link href={`/shipments/${invoice.shipment_id}`}>
                                    <Button variant="outline" className="w-full border-border mt-2">
                                        View Shipment Details
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Notes */}
                {invoice.notes && (
                    <Card className="p-6 border-border">
                        <h2 className="text-lg font-bold text-foreground mb-4">Notes</h2>
                        <p className="text-foreground whitespace-pre-wrap">{invoice.notes}</p>
                    </Card>
                )}
            </div>
        </MainLayout>
    );
}
