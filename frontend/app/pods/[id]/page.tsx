'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiService } from '@/lib/api';
import { Download, ArrowLeft, FileCheck, Calendar, User, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import type { POD } from '@/types/logistics';

export default function PODDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [pod, setPod] = useState<POD | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (params.id) {
            fetchPOD(params.id as string);
        }
    }, [params.id]);

    const fetchPOD = async (id: string) => {
        setLoading(true);
        setError('');
        try {
            const result = await apiService.getPOD(id);
            setPod(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch POD');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!pod) return;
        // This would trigger PDF download from backend
        alert('Download POD PDF functionality');
    };

    if (loading) {
        return (
            <MainLayout title="POD Details">
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-muted-foreground">Loading POD...</p>
                </div>
            </MainLayout>
        );
    }

    if (error || !pod) {
        return (
            <MainLayout title="POD Details">
                <Card className="p-8 text-center border-destructive bg-destructive/10">
                    <p className="text-destructive">{error || 'POD not found'}</p>
                    <Button onClick={() => router.push('/pods/list')} className="mt-4">
                        Back to List
                    </Button>
                </Card>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="Proof of Delivery">
            <div className="p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/pods/list')}
                            className="border-border"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Proof of Delivery</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Shipment: {pod.shipment?.hawb || 'N/A'}
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90">
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                    </Button>
                </div>

                {/* Success Banner */}
                <Card className="p-4 bg-green-50 border-green-200 dark:bg-green-900/20">
                    <div className="flex items-center gap-3">
                        <FileCheck className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="font-semibold text-foreground">Delivery Confirmed</p>
                            <p className="text-sm text-muted-foreground">
                                Package was successfully delivered on {new Date(pod.delivery_date).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Delivery Information */}
                    <Card className="p-6 border-border">
                        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Delivery Information
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Delivery Date & Time</p>
                                <p className="font-semibold text-foreground">
                                    {new Date(pod.delivery_date).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Delivery Location</p>
                                <p className="font-semibold text-foreground">{pod.delivery_location || 'N/A'}</p>
                            </div>
                            {pod.remarks && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Remarks</p>
                                    <p className="text-foreground">{pod.remarks}</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Receiver Information */}
                    <Card className="p-6 border-border">
                        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Receiver Information
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Receiver Name</p>
                                <p className="font-semibold text-foreground">{pod.receiver_name}</p>
                            </div>
                            {pod.receiver_contact && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Contact Number</p>
                                    <p className="font-semibold text-foreground">{pod.receiver_contact}</p>
                                </div>
                            )}
                            {pod.receiver_id_type && pod.receiver_id_number && (
                                <div>
                                    <p className="text-sm text-muted-foreground">ID Verification</p>
                                    <p className="text-foreground">
                                        {pod.receiver_id_type}: {pod.receiver_id_number}
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Signature */}
                    {pod.signature_url && (
                        <Card className="p-6 border-border lg:col-span-2">
                            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <ImageIcon className="w-5 h-5" />
                                Receiver Signature
                            </h2>
                            <div className="border border-border rounded-lg p-4 bg-muted/20">
                                <img
                                    src={pod.signature_url}
                                    alt="Receiver Signature"
                                    className="max-h-32 mx-auto"
                                />
                            </div>
                        </Card>
                    )}

                    {/* Photo Proof */}
                    {pod.photo_url && (
                        <Card className="p-6 border-border lg:col-span-2">
                            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <ImageIcon className="w-5 h-5" />
                                Photo Proof
                            </h2>
                            <div className="border border-border rounded-lg overflow-hidden">
                                <img
                                    src={pod.photo_url}
                                    alt="Delivery Photo"
                                    className="w-full max-h-96 object-contain"
                                />
                            </div>
                        </Card>
                    )}

                    {/* Related Shipment */}
                    <Card className="p-6 border-border lg:col-span-2">
                        <h2 className="text-lg font-bold text-foreground mb-4">Related Shipment</h2>
                        {pod.shipment && (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">HAWB</p>
                                    <p className="font-mono font-bold text-xl text-primary">{pod.shipment.hawb}</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {pod.shipment.origin_city} → {pod.shipment.destination_city}
                                    </p>
                                </div>
                                <Link href={`/shipments/${pod.shipment_id}`}>
                                    <Button variant="outline" className="border-border">
                                        View Shipment Details
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
