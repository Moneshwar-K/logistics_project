'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { apiService } from '@/lib/api';
import {
  Upload, X, CheckCircle2, AlertCircle, Loader2, Image,
  FileText, Camera, CreditCard, Search
} from 'lucide-react';

export default function PODUploadPage() {
  const [hawbNumber, setHawbNumber] = useState('');
  const [shipment, setShipment] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // File uploads
  const [podFile, setPodFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [kycFrontFile, setKycFrontFile] = useState<File | null>(null);
  const [kycBackFile, setKycBackFile] = useState<File | null>(null);

  // Previews
  const [podPreview, setPodPreview] = useState<string | null>(null);
  const [sigPreview, setSigPreview] = useState<string | null>(null);
  const [kycFrontPreview, setKycFrontPreview] = useState<string | null>(null);
  const [kycBackPreview, setKycBackPreview] = useState<string | null>(null);

  const handleFileSelect = (
    setter: (f: File | null) => void,
    previewSetter: (s: string | null) => void,
    file: File | null
  ) => {
    setter(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => previewSetter(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      previewSetter(null);
    }
  };

  const handleSearch = async () => {
    if (!hawbNumber.trim()) return;
    setSearching(true);
    setMessage(null);
    try {
      const response = await apiService.listShipments({ limit: 1 } as any);
      const data = response?.data || [];
      if (data.length > 0) {
        setShipment(data[0]);
      } else {
        setMessage({ type: 'error', text: 'HAWB not found' });
        setShipment(null);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Search failed' });
    } finally { setSearching(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipment) {
      setMessage({ type: 'error', text: 'Please search for a HAWB first' }); return;
    }
    if (!podFile && !signatureFile && !kycFrontFile && !kycBackFile) {
      setMessage({ type: 'error', text: 'Please select at least one file to upload' }); return;
    }

    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('shipment_id', shipment._id);
      formData.append('hawb_number', hawbNumber);
      if (podFile) formData.append('pod_image', podFile);
      if (signatureFile) formData.append('signature', signatureFile);
      if (kycFrontFile) formData.append('kyc_front', kycFrontFile);
      if (kycBackFile) formData.append('kyc_back', kycBackFile);

      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`${API_BASE}/pods`, {
        method: 'POST',
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      setMessage({ type: 'success', text: '✅ Documents uploaded successfully!' });
      // Reset files
      setPodFile(null); setSignatureFile(null); setKycFrontFile(null); setKycBackFile(null);
      setPodPreview(null); setSigPreview(null); setKycFrontPreview(null); setKycBackPreview(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Upload failed' });
    } finally { setUploading(false); }
  };

  const FileUploadCard = ({
    label, icon: Icon, file, preview,
    onFileChange, onClear,
  }: {
    label: string; icon: any; file: File | null; preview: string | null;
    onFileChange: (f: File | null) => void; onClear: () => void;
  }) => (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        </div>
        {file && (
          <button onClick={onClear} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {preview ? (
        <div className="relative">
          <img src={preview} alt={label} className="w-full h-40 object-cover rounded-lg border border-border" />
          <p className="text-xs text-muted-foreground mt-2 truncate">{file?.name}</p>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all">
          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="text-xs text-muted-foreground">Click to upload</span>
          <span className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, PDF (max 10MB)</span>
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0] || null;
              onFileChange(f);
            }}
          />
        </label>
      )}
    </div>
  );

  return (
    <MainLayout title="Upload Documents">
      <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">POD & Document Upload</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload Proof of Delivery, Signature, and KYC documents</p>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg border text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'}`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        {/* HAWB Search */}
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1 flex-1 max-w-md">
              <label className="text-xs font-medium text-muted-foreground">HAWB Number</label>
              <input value={hawbNumber} onChange={e => setHawbNumber(e.target.value)} placeholder="Enter HAWB number"
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm font-mono" />
            </div>
            <button onClick={handleSearch} disabled={searching} className="h-10 px-5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
            </button>
          </div>

          {shipment && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50 flex flex-wrap gap-6 text-sm">
              <div><span className="text-xs text-muted-foreground block">HAWB</span><span className="font-mono font-bold text-primary">{shipment.hawb}</span></div>
              <div><span className="text-xs text-muted-foreground block">Status</span><span className="capitalize">{shipment.status?.replace(/_/g, ' ')}</span></div>
              <div><span className="text-xs text-muted-foreground block">Origin</span><span>{shipment.origin_city || '—'}</span></div>
              <div><span className="text-xs text-muted-foreground block">Destination</span><span>{shipment.destination_city || '—'}</span></div>
              <div><span className="text-xs text-muted-foreground block">Weight</span><span>{shipment.total_weight} kg</span></div>
            </div>
          )}
        </div>

        {/* Upload Grid */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FileUploadCard
              label="Proof of Delivery (POD)"
              icon={FileText}
              file={podFile}
              preview={podPreview}
              onFileChange={f => handleFileSelect(setPodFile, setPodPreview, f)}
              onClear={() => { setPodFile(null); setPodPreview(null); }}
            />
            <FileUploadCard
              label="Signature"
              icon={Camera}
              file={signatureFile}
              preview={sigPreview}
              onFileChange={f => handleFileSelect(setSignatureFile, setSigPreview, f)}
              onClear={() => { setSignatureFile(null); setSigPreview(null); }}
            />
            <FileUploadCard
              label="KYC Document — Front"
              icon={CreditCard}
              file={kycFrontFile}
              preview={kycFrontPreview}
              onFileChange={f => handleFileSelect(setKycFrontFile, setKycFrontPreview, f)}
              onClear={() => { setKycFrontFile(null); setKycFrontPreview(null); }}
            />
            <FileUploadCard
              label="KYC Document — Back"
              icon={CreditCard}
              file={kycBackFile}
              preview={kycBackPreview}
              onFileChange={f => handleFileSelect(setKycBackFile, setKycBackPreview, f)}
              onClear={() => { setKycBackFile(null); setKycBackPreview(null); }}
            />
          </div>

          <button type="submit" disabled={uploading || !shipment} className="w-full h-12 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            Upload All Documents
          </button>
        </form>
      </div>
    </MainLayout>
  );
}
