'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Calculator, Search, Loader2, ArrowRight, ArrowRightLeft, Printer, Ruler } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const getAuthHeaders = (): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

interface RateResult {
    service_type: string;
    rate_per_kg: number;
    min_charge: number;
    fuel_surcharge_pct: number;
    ess_charge: number;
    fsc_charge: number;
    base_freight: number;
    fuel_amount: number;
    estimated_total: number;
}

interface ServiceType {
    _id: string;
    name: string;
    code: string;
    mode: string;
}

export default function RateCalculatorPage() {
    const [originZone, setOriginZone] = useState('');
    const [destZone, setDestZone] = useState('');
    const [weight, setWeight] = useState<number>(1);
    const [serviceTypeId, setServiceTypeId] = useState('');
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [compareMode, setCompareMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<RateResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    // Volumetric weight
    const [dimLength, setDimLength] = useState(0);
    const [dimWidth, setDimWidth] = useState(0);
    const [dimHeight, setDimHeight] = useState(0);
    const volWeight = dimLength > 0 && dimWidth > 0 && dimHeight > 0
        ? (dimLength * dimWidth * dimHeight) / 5000
        : 0;
    const chargeableWeight = Math.max(weight, volWeight);

    // Load service types from backend on mount
    useEffect(() => {
        (async () => {
            try {
                setLoadingServices(true);
                const res = await fetch(`${API_BASE}/service-types`, { headers: getAuthHeaders() });
                const json = await res.json();
                const list: ServiceType[] = json.data || [];
                setServiceTypes(list);
                if (list.length > 0) setServiceTypeId(list[0]._id);
            } catch {
                setError('Failed to load service types. Please refresh the page.');
            } finally {
                setLoadingServices(false);
            }
        })();
    }, []);

    const doLookup = async (stId: string, stName: string): Promise<RateResult | null> => {
        const res = await fetch(`${API_BASE}/rates/lookup`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                service_type_id: stId,
                origin_zone: originZone.toUpperCase().trim(),
                destination_zone: destZone.toUpperCase().trim(),
                weight: chargeableWeight,
            }),
        });

        if (!res.ok) return null;

        const data = await res.json();
        const rate = data?.data;
        if (!rate) return null;

        const ratePerKg = rate.rate_per_kg || 0;
        const minCharge = rate.min_charge || 0;
        const fuelPct = rate.fuel_surcharge_pct || 0;
        const ess = rate.ess_charge || 0;
        const fsc = rate.fsc_charge || 0;

        const baseFreight = Math.max(ratePerKg * chargeableWeight, minCharge);
        const fuelAmount = (baseFreight * fuelPct) / 100;
        const total = baseFreight + fuelAmount + ess + fsc;

        return {
            service_type: stName,
            rate_per_kg: ratePerKg,
            min_charge: minCharge,
            fuel_surcharge_pct: fuelPct,
            ess_charge: ess,
            fsc_charge: fsc,
            base_freight: baseFreight,
            fuel_amount: fuelAmount,
            estimated_total: total,
        };
    };

    const calculateRate = useCallback(async () => {
        if (!originZone || !destZone || chargeableWeight <= 0) {
            setError('Please fill Origin Zone, Destination Zone, and Weight');
            return;
        }
        if (!compareMode && !serviceTypeId) {
            setError('Please select a Service Type');
            return;
        }

        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const toCheck = compareMode
                ? serviceTypes
                : serviceTypes.filter(s => s._id === serviceTypeId);

            const allResults: RateResult[] = [];

            for (const svc of toCheck) {
                const result = await doLookup(svc._id, `${svc.name} (${svc.code})`);
                if (result) allResults.push(result);
            }

            if (allResults.length === 0) {
                setError(
                    `No rates found for ${originZone.toUpperCase()} → ${destZone.toUpperCase()} at ${chargeableWeight.toFixed(1)} kg. ` +
                    `Please check that a Rate Card exists with matching Origin Zone, Destination Zone, ` +
                    `and a weight slab that covers ${chargeableWeight.toFixed(1)} kg.`
                );
            }

            setResults(allResults);
        } catch (err: any) {
            setError(err.message || 'Failed to calculate rate');
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [originZone, destZone, weight, serviceTypeId, compareMode, chargeableWeight, serviceTypes]);

    const printQuote = () => {
        const html = `<html><head><title>Rate Quote</title><style>
body{font-family:Arial;padding:20px}
table{width:100%;border-collapse:collapse;margin-top:10px}
th,td{border:1px solid #ddd;padding:8px;text-align:left}
th{background:#f5f5f5}
.header{text-align:center;margin-bottom:15px}
</style></head><body>
<div class="header"><h2>Rate Quotation</h2><p>Date: ${new Date().toLocaleDateString('en-IN')}</p></div>
<p><strong>Route:</strong> ${originZone.toUpperCase()} → ${destZone.toUpperCase()}</p>
<p><strong>Actual Weight:</strong> ${weight} kg${volWeight > 0 ? ` | Volumetric: ${volWeight.toFixed(1)} kg` : ''} | <strong>Chargeable: ${chargeableWeight.toFixed(1)} kg</strong></p>
<table>
<thead><tr><th>Service</th><th>Rate/kg</th><th>Min Charge</th><th>Base Freight</th><th>Fuel Surcharge</th><th>ESS/FSC</th><th>Total (excl. GST)</th></tr></thead>
<tbody>${results.map(r => `<tr>
<td>${r.service_type}</td>
<td>₹${r.rate_per_kg}</td>
<td>₹${r.min_charge}</td>
<td>₹${r.base_freight.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
<td>₹${r.fuel_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${r.fuel_surcharge_pct}%)</td>
<td>₹${(r.ess_charge + r.fsc_charge).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
<td><strong>₹${r.estimated_total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong></td>
</tr>`).join('')}</tbody>
</table>
<p style="margin-top:20px;font-size:12px;color:#666">* Rates are subject to change. GST extra as applicable.</p>
</body></html>`;
        const w = window.open('', '_blank');
        if (w) { w.document.write(html); w.document.close(); w.print(); }
    };

    return (
        <MainLayout title="Rate Calculator">
            <div className="p-4 md:p-8 max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <Calculator className="w-7 h-7 text-primary" />
                        Rate Calculator
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Quick rate lookup by zone, weight, and service type</p>
                </div>

                {/* Input Panel */}
                <div className="bg-card border border-border rounded-xl p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* Origin Zone */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Origin Zone *</label>
                            <input
                                value={originZone}
                                onChange={e => setOriginZone(e.target.value)}
                                placeholder="e.g., CHENNAI"
                                className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 outline-none uppercase"
                            />
                        </div>
                        {/* Destination Zone */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Destination Zone *</label>
                            <input
                                value={destZone}
                                onChange={e => setDestZone(e.target.value)}
                                placeholder="e.g., DELHI"
                                className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 outline-none uppercase"
                            />
                        </div>
                        {/* Weight */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Weight (kg) *</label>
                            <input
                                type="number"
                                value={weight}
                                onChange={e => setWeight(parseFloat(e.target.value) || 0)}
                                min="0.1"
                                step="0.1"
                                className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                        </div>
                        {/* Service Type — loaded from DB */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Service Type</label>
                            <select
                                value={serviceTypeId}
                                onChange={e => setServiceTypeId(e.target.value)}
                                disabled={compareMode || loadingServices}
                                className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 outline-none disabled:opacity-50"
                            >
                                {loadingServices
                                    ? <option>Loading...</option>
                                    : serviceTypes.length === 0
                                        ? <option value="">No service types configured</option>
                                        : serviceTypes.map(s => (
                                            <option key={s._id} value={s._id}>
                                                {s.name} ({s.code})
                                            </option>
                                        ))
                                }
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={compareMode}
                                onChange={e => setCompareMode(e.target.checked)}
                                className="w-4 h-4 rounded border-border text-primary"
                            />
                            <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Compare all service types</span>
                        </label>
                        <button
                            onClick={calculateRate}
                            disabled={loading || loadingServices}
                            className="px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Calculate
                        </button>
                    </div>

                    {/* Volumetric Weight Calculator */}
                    <div className="mt-4 pt-4 border-t border-border">
                        <h3 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                            <Ruler className="w-3.5 h-3.5" /> VOLUMETRIC WEIGHT (Optional)
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-muted-foreground">L (cm)</label>
                                <input type="number" value={dimLength || ''} onChange={e => setDimLength(+e.target.value)} placeholder="0" className="w-20 h-8 px-2 text-sm rounded-md border border-border bg-background text-foreground" />
                            </div>
                            <span className="text-muted-foreground mt-4">×</span>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-muted-foreground">W (cm)</label>
                                <input type="number" value={dimWidth || ''} onChange={e => setDimWidth(+e.target.value)} placeholder="0" className="w-20 h-8 px-2 text-sm rounded-md border border-border bg-background text-foreground" />
                            </div>
                            <span className="text-muted-foreground mt-4">×</span>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-muted-foreground">H (cm)</label>
                                <input type="number" value={dimHeight || ''} onChange={e => setDimHeight(+e.target.value)} placeholder="0" className="w-20 h-8 px-2 text-sm rounded-md border border-border bg-background text-foreground" />
                            </div>
                            <span className="text-muted-foreground mt-4">÷ 5000 =</span>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-muted-foreground">Vol. Wt</label>
                                <span className="h-8 flex items-center px-2 font-bold text-sm text-primary">
                                    {volWeight > 0 ? `${volWeight.toFixed(1)} kg` : '—'}
                                </span>
                            </div>
                            {volWeight > 0 && (
                                <div className="ml-2 mt-4 text-xs text-muted-foreground">
                                    Chargeable: <span className="font-bold text-foreground">{chargeableWeight.toFixed(1)} kg</span>
                                    {volWeight > weight && <span className="text-amber-500 ml-1">(vol. wt used)</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* Results */}
                {results.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            Rate Results
                            <span className="text-sm font-normal text-muted-foreground">
                                ({originZone.toUpperCase()} <ArrowRight className="w-3 h-3 inline" /> {destZone.toUpperCase()}, {chargeableWeight.toFixed(1)} kg chargeable)
                            </span>
                            <button onClick={printQuote} className="ml-auto px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted flex items-center gap-1">
                                <Printer className="w-3.5 h-3.5" /> Print Quote
                            </button>
                        </h2>

                        <div className={`grid ${compareMode ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-lg'} gap-4`}>
                            {results.map((r, i) => (
                                <div key={i} className="bg-card border border-border rounded-xl p-5 hover:shadow-lg transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-bold text-primary uppercase">{r.service_type}</span>
                                        <span className="text-2xl font-bold text-foreground">
                                            ₹{r.estimated_total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Rate/kg</span>
                                            <span className="font-medium">₹{r.rate_per_kg}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Base Freight ({chargeableWeight.toFixed(1)} kg)</span>
                                            <span className="font-medium">₹{r.base_freight.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Min Charge</span>
                                            <span>₹{r.min_charge}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Fuel Surcharge ({r.fuel_surcharge_pct}%)</span>
                                            <span className="font-medium">₹{r.fuel_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                        </div>
                                        {r.ess_charge > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">ESS Charge</span>
                                                <span className="font-medium">₹{r.ess_charge}</span>
                                            </div>
                                        )}
                                        {r.fsc_charge > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">FSC Charge</span>
                                                <span className="font-medium">₹{r.fsc_charge}</span>
                                            </div>
                                        )}
                                        <hr className="border-border" />
                                        <div className="flex justify-between font-bold text-base">
                                            <span>Total (excl. GST)</span>
                                            <span className="text-emerald-600">₹{r.estimated_total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">* GST applicable as per government regulations. Final amount may vary.</p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
