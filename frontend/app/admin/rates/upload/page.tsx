'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { apiService } from '@/lib/api';

export default function RateUploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [serviceType, setServiceType] = useState('air');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setStatus(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('service_type', serviceType);

        try {
            const res = await apiService.uploadRateSheet(formData);

            setStatus({ type: 'success', message: 'Rate sheet uploaded successfully.' });
            setFile(null);
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Failed to upload rate sheet' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <MainLayout title="Rate Management">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Bulk Rate Upload</h1>
                    <p className="text-sm text-muted-foreground mt-1">Upload Excel sheets to update rates for specific services and zones.</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">Service Type</label>
                            <select
                                value={serviceType}
                                onChange={(e) => setServiceType(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="air">Air Cargo</option>
                                <option value="surface">Surface Transport</option>
                                <option value="train">Train Cargo</option>
                                <option value="express">Express Delivery</option>
                            </select>
                        </div>

                        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/30 transition-colors">
                            <input
                                type="file"
                                id="rate-sheet-upload"
                                className="hidden"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="rate-sheet-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                <div className="p-3 bg-primary/10 rounded-full text-primary">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-medium text-foreground">
                                    {file ? file.name : 'Click to select or drag and drop Excel file'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Supports .xlsx, .xls, .csv
                                </span>
                            </label>
                        </div>

                        {status && (
                            <div className={`p-4 rounded-lg flex items-start gap-3 ${status.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                                {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                                <p className="text-sm">{status.message}</p>
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {uploading ? 'Uploading...' : 'Upload Rates'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        Recent Uploads
                    </h2>
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No recent uploads found.
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
