'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { apiService } from '@/lib/api';
import { printInvoice, printPOD } from '@/lib/print';
import {
    Save, Printer, Plus, FileText, Package, Search, X, Loader2, RefreshCw,
    ChevronDown, ChevronUp, Trash2, Edit2, DollarSign, Upload
} from 'lucide-react';

// ── Types ──
interface PartyDetails {
    name: string;
    address: string;
    mobile1: string;
    mobile1_code: string;
    telephone: string;
    city: string;
    post_box: string;
    email: string;
    id_type: string;
    customer_id: string;
    contact_person: string;
    // Consignee extras
    mobile2?: string;
    mobile2_code?: string;
    state?: string;
    pincode?: string;
    district?: string;
    taluk?: string;
    post_office?: string;
    iec_no?: string;
}

interface CartonItem {
    id: string;
    carton_no: number;
    weight: number;
}

interface DimensionItem {
    id: string;
    length: number;
    width: number;
    height: number;
    pcs: number;
    weight: number;
}

interface InvoiceItem {
    id: string;
    invoice_no: string;
    value: number;
    currency: string;
}

interface ChargeItem {
    id: string;
    name: string;
    type: string;
    amount: number;
}

interface AmountDetails {
    freight: number;
    document_charges: number;
    pickup_charges: number;
    other_charges: number;
    igst: number;
    cgst: number;
    sgst: number;
}

// ── Shared UI Helpers (Defined outside to prevent re-mount focus loss) ──
const InputField = ({ label, value, onChange, required, type = 'text', placeholder, className = '', disabled = false }: any) => (
    <div className={`flex flex-col gap-1 ${className}`}>
        <label className="text-xs font-medium text-muted-foreground">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none disabled:opacity-50 disabled:bg-muted"
        />
    </div>
);

const SelectField = ({ label, value, onChange, options, required, className = '' }: any) => (
    <div className={`flex flex-col gap-1 ${className}`}>
        <label className="text-xs font-medium text-muted-foreground">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
        >
            <option value="">SELECT</option>
            {options.map((opt: any) => (
                <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                    {typeof opt === 'string' ? opt : opt.label}
                </option>
            ))}
        </select>
    </div>
);

const TextareaField = ({ label, value, onChange, required, rows = 2, className = '' }: any) => (
    <div className={`flex flex-col gap-1 ${className}`}>
        <label className="text-xs font-medium text-muted-foreground">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className="px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-y"
        />
    </div>
);

const emptyShipper: PartyDetails = {
    name: '', address: '', mobile1: '', mobile1_code: '91', telephone: '',
    city: '', post_box: '', email: '', id_type: '', customer_id: '', contact_person: '',
};

const emptyConsignee: PartyDetails = {
    name: '', address: '', mobile1: '', mobile1_code: '91', telephone: '',
    city: '', post_box: '', email: '', id_type: '', customer_id: '', contact_person: '',
    mobile2: '', mobile2_code: '91', state: '', pincode: '', district: '',
    taluk: '', post_office: '', iec_no: '',
};

const emptyAmounts: AmountDetails = {
    freight: 0, document_charges: 0, pickup_charges: 0, other_charges: 0,
    igst: 0, cgst: 0, sgst: 0,
};

const ID_TYPES = ['', 'GSTIN', 'GSTIN (NORMAL)', 'AADHAAR NUMBER', 'PAN', 'PASSPORT', 'VOTER ID'];
const SERVICE_TYPES = ['AIR FREIGHT', 'SEA FREIGHT', 'SURFACE', 'TRAIN', 'PARCEL', 'EXPRESS'];
const SHIPMENT_TYPES = ['NON DOCUMENTS', 'DOCUMENTS', 'BUNDLE', 'CARTON', 'PALLET'];
const ORDER_TYPES = ['PICKUP', 'DROP', 'DOOR DELIVERY'];
const PAYMENT_MODES = ['CREDIT', 'CASH', 'PREPAID', 'TO PAY', 'COD'];
const INDIAN_STATES = [
    'ANDHRA PRADESH', 'ARUNACHAL PRADESH', 'ASSAM', 'BIHAR', 'CHHATTISGARH',
    'GOA', 'GUJARAT', 'HARYANA', 'HIMACHAL PRADESH', 'JHARKHAND', 'KARNATAKA',
    'KERALA', 'MADHYA PRADESH', 'MAHARASHTRA', 'MANIPUR', 'MEGHALAYA', 'MIZORAM',
    'NAGALAND', 'ODISHA', 'PUNJAB', 'RAJASTHAN', 'SIKKIM', 'TAMIL NADU',
    'TELANGANA', 'TRIPURA', 'UTTAR PRADESH', 'UTTARAKHAND', 'WEST BENGAL',
    'DELHI', 'CHANDIGARH', 'JAMMU AND KASHMIR', 'LADAKH',
];

export default function HawbBookingPage() {
    // ── General Info ──
    const [hawbMode, setHawbMode] = useState<'manual' | 'auto'>('auto');
    const [hawbNo, setHawbNo] = useState('');
    const [referenceNo, setReferenceNo] = useState('');
    const [originCountry, setOriginCountry] = useState('INDIA');
    const [originBranch, setOriginBranch] = useState('');
    const [desCountry, setDesCountry] = useState('INDIA');
    const [deliveryLocation, setDeliveryLocation] = useState('');
    const [clientName, setClientName] = useState('');
    const [dutyBillTo, setDutyBillTo] = useState('');
    const [orderType, setOrderType] = useState('PICKUP');
    const [paymentMode, setPaymentMode] = useState('CREDIT');
    const [serviceType, setServiceType] = useState('AIR FREIGHT');
    const [shipmentType, setShipmentType] = useState('NON DOCUMENTS');
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
    const [facility, setFacility] = useState('');
    const [packingType, setPackingType] = useState('');

    // ── Party Details ──
    const [shipper, setShipper] = useState<PartyDetails>({ ...emptyShipper });
    const [consignee, setConsignee] = useState<PartyDetails>({ ...emptyConsignee });

    // ── Shipment Details ──
    const [totalPcs, setTotalPcs] = useState<number>(0);
    const [totalWeight, setTotalWeight] = useState<number>(0);
    const [noOfInvoice, setNoOfInvoice] = useState<number>(1);
    const [forwardingDetails, setForwardingDetails] = useState('');
    const [remarks, setRemarks] = useState('');
    const [holdStatus, setHoldStatus] = useState<'hold' | 'unhold'>('unhold');
    const [descripOfGoods, setDescripOfGoods] = useState('');
    const [ewayBillNo, setEwayBillNo] = useState('');
    const [receivedAmount, setReceivedAmount] = useState<number>(0);

    // ── Computed Values ──
    const [actualWeight, setActualWeight] = useState(0);
    const [volumetricWeight, setVolumetricWeight] = useState(0);
    const [invoiceValue, setInvoiceValue] = useState(0);

    // ── Carton, Dimension, Invoice data ──
    const [cartons, setCartons] = useState<CartonItem[]>([]);
    const [dimensions, setDimensions] = useState<DimensionItem[]>([]);
    const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
    const [charges, setCharges] = useState<ChargeItem[]>([
        { id: '1', name: 'FOV', type: '', amount: 0 },
        { id: '2', name: 'AWB', type: '', amount: 0 },
    ]);
    const [amounts, setAmounts] = useState<AmountDetails>({ ...emptyAmounts });

    // ── Lookups ──
    const [branches, setBranches] = useState<any[]>([]);
    const [allParties, setAllParties] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);

    // ── Modal States ──
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [savedHawbId, setSavedHawbId] = useState<string | null>(null);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // ── Carton Modal Form ──
    const [cartonMode, setCartonMode] = useState<'single' | 'multiple'>('single');
    const [cartonNo, setCartonNo] = useState<number>(0);
    const [cartonWeight, setCartonWeight] = useState<number>(0);

    // ── Dimension Modal Form ──
    const [dimLength, setDimLength] = useState<number>(0);
    const [dimWidth, setDimWidth] = useState<number>(0);
    const [dimHeight, setDimHeight] = useState<number>(0);
    const [dimPcs, setDimPcs] = useState<number>(0);
    const [volFactor, setVolFactor] = useState<number>(5000);

    // ── Invoice Modal Form ──
    const [invNo, setInvNo] = useState('');
    const [invValue, setInvValue] = useState<number>(0);
    const [invCurrency, setInvCurrency] = useState('INR');

    // ── Quick Billing: Party search state ──
    const [shipperSearchResults, setShipperSearchResults] = useState<any[]>([]);
    const [consigneeSearchResults, setConsigneeSearchResults] = useState<any[]>([]);
    const [showShipperDropdown, setShowShipperDropdown] = useState(false);
    const [showConsigneeDropdown, setShowConsigneeDropdown] = useState(false);
    const [searchingShipper, setSearchingShipper] = useState(false);
    const [searchingConsignee, setSearchingConsignee] = useState(false);
    const shipperSearchTimer = useRef<NodeJS.Timeout | null>(null);
    const consigneeSearchTimer = useRef<NodeJS.Timeout | null>(null);
    const shipperDropdownRef = useRef<HTMLDivElement>(null);
    const consigneeDropdownRef = useRef<HTMLDivElement>(null);

    // Load lookups
    useEffect(() => {
        const loadLookups = async () => {
            try {
                const [branchData, shipperData, allPartyData] = await Promise.all([
                    apiService.getBranches(),
                    apiService.listParties({ role: 'shipper', limit: 200 }),
                    apiService.listParties({ limit: 500 }),
                ]);
                setBranches(Array.isArray(branchData) ? branchData : []);
                const cData = shipperData?.data || shipperData || [];
                setClients(Array.isArray(cData) ? cData : []);
                const aData = allPartyData?.data || allPartyData || [];
                setAllParties(Array.isArray(aData) ? aData : []);
            } catch (err) {
                console.error('Failed to load lookups', err);
            }
        };
        loadLookups();
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (shipperDropdownRef.current && !shipperDropdownRef.current.contains(e.target as Node)) {
                setShowShipperDropdown(false);
            }
            if (consigneeDropdownRef.current && !consigneeDropdownRef.current.contains(e.target as Node)) {
                setShowConsigneeDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ── Quick Billing: Search parties with debounce ──
    const searchParties = useCallback((query: string, role: 'shipper' | 'consignee') => {
        const timerRef = role === 'shipper' ? shipperSearchTimer : consigneeSearchTimer;
        const setResults = role === 'shipper' ? setShipperSearchResults : setConsigneeSearchResults;
        const setShow = role === 'shipper' ? setShowShipperDropdown : setShowConsigneeDropdown;
        const setSearching = role === 'shipper' ? setSearchingShipper : setSearchingConsignee;

        if (timerRef.current) clearTimeout(timerRef.current);

        if (!query || query.length < 2) {
            setResults([]);
            setShow(false);
            return;
        }

        setSearching(true);
        timerRef.current = setTimeout(async () => {
            try {
                // Search in already-loaded parties first (fast)
                const q = query.toLowerCase();
                const localResults = allParties.filter(p =>
                    (p.name?.toLowerCase().includes(q)) ||
                    (p.contact_phone?.includes(query)) ||
                    (p.gstin?.toLowerCase().includes(q)) ||
                    (p.contact_email?.toLowerCase().includes(q))
                ).slice(0, 10);

                if (localResults.length > 0) {
                    setResults(localResults);
                    setShow(true);
                    setSearching(false);
                    return;
                }

                // Fallback: search via API
                const response = await apiService.listParties({ search: query, limit: 10 });
                const data = response?.data || [];
                setResults(Array.isArray(data) ? data : []);
                setShow(data.length > 0);
            } catch (err) {
                console.error('Party search failed:', err);
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 300); // 300ms debounce
    }, [allParties]);

    // ── Quick Billing: Auto-fill party details ──
    const fillShipperFromParty = useCallback((party: any) => {
        setShipper({
            name: party.name || '',
            address: party.address || '',
            mobile1: (party.contact_phone || '').replace(/^\+?91/, ''),
            mobile1_code: '91',
            telephone: party.telephone || party.alt_phone || '',
            city: party.city || '',
            post_box: party.post_box || '',
            email: party.contact_email || party.email || '',
            id_type: party.gstin ? 'GSTIN' : (party.aadhaar ? 'AADHAAR NUMBER' : ''),
            customer_id: party.gstin || party.aadhaar || party.pan || '',
            contact_person: party.contact_person || party.name || '',
        });
        setShowShipperDropdown(false);
        setSaveMessage({ type: 'success', text: `✨ Shipper auto-filled: ${party.name}` });
        setTimeout(() => setSaveMessage(null), 3000);
    }, []);

    const fillConsigneeFromParty = useCallback((party: any) => {
        setConsignee({
            name: party.name || '',
            address: party.address || '',
            mobile1: (party.contact_phone || '').replace(/^\+?91/, ''),
            mobile1_code: '91',
            telephone: party.telephone || party.alt_phone || '',
            city: party.city || '',
            post_box: party.post_box || '',
            email: party.contact_email || party.email || '',
            id_type: party.gstin ? 'GSTIN (NORMAL)' : (party.aadhaar ? 'AADHAAR NUMBER' : ''),
            customer_id: party.gstin || party.aadhaar || party.pan || '',
            contact_person: party.contact_person || party.name || '',
            mobile2: party.mobile2 || '',
            mobile2_code: '91',
            state: party.state || '',
            pincode: party.pincode || '',
            district: party.district || party.city || '',
            taluk: party.taluk || '',
            post_office: party.post_office || '',
            iec_no: party.iec_no || '',
        });
        setShowConsigneeDropdown(false);
        setSaveMessage({ type: 'success', text: `✨ Consignee auto-filled: ${party.name}` });
        setTimeout(() => setSaveMessage(null), 3000);
    }, []);

    // ── Quick Billing: Auto-fill from Client Name selection ──
    const handleClientNameChange = useCallback((selectedClient: string) => {
        setClientName(selectedClient);
        setDutyBillTo(selectedClient); // Also set Duty Bill To

        // Find the party and auto-fill shipper
        const party = allParties.find(p => p.name === selectedClient || p._id === selectedClient);
        if (party) {
            fillShipperFromParty(party);
        }
    }, [allParties, fillShipperFromParty]);

    // Recalculate weights
    useEffect(() => {
        setActualWeight(totalWeight);
    }, [totalWeight]);

    useEffect(() => {
        const vol = dimensions.reduce((sum, d) => sum + d.weight, 0);
        setVolumetricWeight(parseFloat(vol.toFixed(2)));
    }, [dimensions]);

    useEffect(() => {
        const total = invoices.reduce((sum, inv) => sum + inv.value, 0);
        setInvoiceValue(total);
    }, [invoices]);

    // ── Handlers ──
    const addCarton = () => {
        if (cartonNo <= 0) return;
        setCartons(prev => [...prev, {
            id: Date.now().toString(),
            carton_no: cartonNo,
            weight: cartonWeight,
        }]);
        setCartonNo(0);
        setCartonWeight(0);
    };

    const removeCarton = (id: string) => setCartons(prev => prev.filter(c => c.id !== id));

    const addDimension = () => {
        if (dimLength <= 0 || dimWidth <= 0 || dimHeight <= 0) return;
        const weight = (dimLength * dimWidth * dimHeight * (dimPcs || 1)) / volFactor;
        setDimensions(prev => [...prev, {
            id: Date.now().toString(),
            length: dimLength,
            width: dimWidth,
            height: dimHeight,
            pcs: dimPcs || 1,
            weight: parseFloat(weight.toFixed(2)),
        }]);
        setDimLength(0); setDimWidth(0); setDimHeight(0); setDimPcs(0);
    };

    const removeDimension = (id: string) => setDimensions(prev => prev.filter(d => d.id !== id));

    const addInvoice = () => {
        if (!invNo) return;
        setInvoices(prev => [...prev, {
            id: Date.now().toString(),
            invoice_no: invNo,
            value: invValue,
            currency: invCurrency,
        }]);
        setInvNo(''); setInvValue(0);
    };

    const removeInvoice = (id: string) => setInvoices(prev => prev.filter(i => i.id !== id));

    const addCharge = () => {
        setCharges(prev => [...prev, { id: Date.now().toString(), name: '', type: '', amount: 0 }]);
    };

    const removeCharge = (id: string) => setCharges(prev => prev.filter(c => c.id !== id));

    const updateCharge = (id: string, field: keyof ChargeItem, value: string | number) => {
        setCharges(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const resetForm = () => {
        setHawbNo(''); setReferenceNo('');
        setShipper({ ...emptyShipper }); setConsignee({ ...emptyConsignee });
        setTotalPcs(0); setTotalWeight(0); setNoOfInvoice(1);
        setForwardingDetails(''); setRemarks(''); setHoldStatus('unhold');
        setDescripOfGoods(''); setEwayBillNo(''); setReceivedAmount(0);
        setCartons([]); setDimensions([]); setInvoices([]);
        setCharges([
            { id: '1', name: 'FOV', type: '', amount: 0 },
            { id: '2', name: 'AWB', type: '', amount: 0 },
        ]);
        setAmounts({ ...emptyAmounts });
        setSavedHawbId(null);
        setSaveMessage(null);
    };

    const handleSave = async () => {
        // Validate required fields
        if (!shipper.name || !consignee.name || !totalPcs || !totalWeight || !descripOfGoods) {
            setSaveMessage({ type: 'error', text: 'Please fill all required fields (Shipper Name, Consignee Name, Pcs, Weight, Description of Goods)' });
            return;
        }
        if (!originBranch) {
            setSaveMessage({ type: 'error', text: '⚠️ Please select Origin Branch from the top section before saving' });
            return;
        }

        setSaving(true);
        setSaveMessage(null);
        try {
            // Build shipment payload matching backend Shipment model
            // Find branch name label for origin_city from the loaded branches
            const selectedBranch = branches.find((b: any) => (b._id || b.id) === originBranch);
            const originCityLabel = selectedBranch?.city || selectedBranch?.name || shipper.city || 'Unknown';

            const payload: any = {
                hawb: hawbMode === 'manual' ? hawbNo : undefined,
                reference_number: referenceNo,
                origin_city: originCityLabel,
                origin_country: originCountry,
                destination_city: deliveryLocation || consignee.district || consignee.city,
                destination_country: desCountry,
                service_type: (() => {
                    const st = serviceType.toLowerCase();
                    if (st.includes('air')) return 'air';
                    if (st.includes('sea')) return 'sea';
                    if (st.includes('surface')) return 'surface';
                    if (st.includes('train')) return 'train';
                    if (st.includes('parcel')) return 'parcel';
                    if (st.includes('express')) return 'express';
                    return 'surface';
                })(),
                shipment_type: shipmentType.toLowerCase().includes('doc') ? 'document' : shipmentType.toLowerCase().includes('parcel') ? 'parcel' : 'cargo',
                total_cartons: totalPcs,
                total_weight: totalWeight,
                total_weight_cbm: volumetricWeight,
                package_type: packingType || shipmentType,
                goods_description: descripOfGoods,
                invoice_value: invoiceValue,
                invoice_currency: 'INR',
                mode: (() => {
                    const st = serviceType.toLowerCase();
                    if (st.includes('air')) return 'air';
                    if (st.includes('sea')) return 'sea';
                    if (st.includes('surface')) return 'surface';
                    if (st.includes('train')) return 'train';
                    if (st.includes('parcel')) return 'parcel';
                    if (st.includes('express')) return 'express';
                    return 'surface';
                })(),
                branch_id: originBranch,  // MongoDB ObjectId of selected branch
                status: holdStatus === 'hold' ? 'on_hold' : 'pending',
                // Shipper data
                shipper: {
                    name: shipper.name,
                    role: 'shipper',
                    address: shipper.address,
                    contact_person: shipper.contact_person || shipper.name,
                    contact_phone: `+${shipper.mobile1_code}${shipper.mobile1}`,
                    contact_email: shipper.email,
                    city: shipper.city,
                    gstin: shipper.id_type === 'GSTIN' ? shipper.customer_id : undefined,
                },
                // Consignee data
                consignee: {
                    name: consignee.name,
                    role: 'consignee',
                    address: consignee.address,
                    contact_person: consignee.contact_person || consignee.name,
                    contact_phone: `+${consignee.mobile1_code}${consignee.mobile1}`,
                    contact_email: consignee.email,
                    city: consignee.district || consignee.city,
                    state: consignee.state,
                    pincode: consignee.pincode,
                    gstin: consignee.id_type?.includes('GSTIN') ? consignee.customer_id : undefined,
                },
                // Extra billing data
                billing: {
                    payment_mode: paymentMode,
                    order_type: orderType,
                    client_name: clientName,
                    duty_bill_to: dutyBillTo,
                    facility: facility,
                    booking_date: bookingDate,
                    forwarding_details: forwardingDetails,
                    remarks: remarks,
                    eway_bill_no: ewayBillNo,
                    received_amount: receivedAmount,
                    no_of_invoice: noOfInvoice,
                    cartons: cartons,
                    dimensions: dimensions,
                    invoices: invoices,
                    charges: charges.filter(c => c.amount > 0),
                    amounts: amounts,
                },
            };

            const result = await apiService.createShipment(payload);
            const newId = result?._id || (result as any)?.data?._id || (result as any)?.id;
            setSavedHawbId(newId);
            // Set HAWB number from response
            const newHawb = (result as any)?.hawb || (result as any)?.data?.hawb;
            if (newHawb) setHawbNo(newHawb);
            setSaveMessage({ type: 'success', text: `HAWB saved successfully! ${newHawb ? `HAWB No: ${newHawb}` : ''}` });
        } catch (err: any) {
            console.error('Save failed:', err);
            setSaveMessage({ type: 'error', text: err.message || 'Failed to save HAWB details' });
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        setActiveModal('print');
    };

    const Badge = ({ value, color = 'bg-emerald-500' }: { value: string | number; color?: string }) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white ${color}`}>
            {value}
        </span>
    );

    return (
        <MainLayout title="HAWB Booking">
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">HAWB Details</h1>
                        <p className="text-sm text-muted-foreground mt-1">Create and manage HAWB booking entries</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {hawbNo && (
                            <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-2">
                                <span className="text-xs text-muted-foreground">HAWB No:</span>
                                <span className="ml-2 font-bold text-primary text-lg">{hawbNo}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Save Message */}
                {saveMessage && (
                    <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${saveMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'}`}>
                        {saveMessage.text}
                    </div>
                )}

                {/* ═══════ Section A: General Info ═══════ */}
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio" name="hawb_mode" checked={hawbMode === 'manual'}
                                    onChange={() => setHawbMode('manual')}
                                    className="w-4 h-4 text-primary"
                                />
                                <span className="text-sm font-medium">Manual HAWB</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio" name="hawb_mode" checked={hawbMode === 'auto'}
                                    onChange={() => setHawbMode('auto')}
                                    className="w-4 h-4 text-primary"
                                />
                                <span className="text-sm font-medium">Auto HAWB</span>
                            </label>
                        </div>
                        {hawbMode === 'manual' && (
                            <InputField label="HAWB No" value={hawbNo} onChange={setHawbNo} required className="w-48" />
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        <InputField label="Reference No" value={referenceNo} onChange={setReferenceNo} />
                        <SelectField label="Origin Country" value={originCountry} onChange={setOriginCountry} options={['INDIA']} required />
                        <SelectField
                            label="Origin Branch" value={originBranch} onChange={setOriginBranch} required
                            options={branches.map(b => ({ value: b._id || b.id, label: b.name }))}
                        />
                        <SelectField label="Des Country" value={desCountry} onChange={setDesCountry} options={['INDIA']} required />
                        <InputField label="Delivery Location" value={deliveryLocation} onChange={setDeliveryLocation} required />
                        <SelectField
                            label="Client Name" value={clientName} onChange={handleClientNameChange} required
                            options={clients.map(c => ({ value: c.name || c._id, label: c.name }))}
                        />
                        <SelectField
                            label="Duty Bill To" value={dutyBillTo} onChange={setDutyBillTo}
                            options={clients.map(c => ({ value: c.name || c._id, label: c.name }))}
                        />
                        <SelectField label="Order Type" value={orderType} onChange={setOrderType} options={ORDER_TYPES} />
                        <SelectField label="Payment Mode" value={paymentMode} onChange={setPaymentMode} options={PAYMENT_MODES} required />
                        <SelectField label="Service Type" value={serviceType} onChange={setServiceType} options={SERVICE_TYPES} required />
                        <SelectField label="Shipment Type" value={shipmentType} onChange={setShipmentType} options={SHIPMENT_TYPES} required />
                        <InputField label="Booking Date" value={bookingDate} onChange={setBookingDate} type="date" required />
                        <SelectField
                            label="Facility" value={facility} onChange={setFacility} required
                            options={branches.map(b => ({ value: b.name || b._id, label: b.name }))}
                        />
                        <InputField label="Packing Type" value={packingType} onChange={setPackingType} />
                    </div>
                </div>

                {/* ═══════ Section B & C: Shipper & Consignee ═══════ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    {/* Shipper */}
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-foreground">Shipper Details</h3>
                            <div className="flex gap-2">
                                <button onClick={() => setShipper({ ...emptyShipper })} className="px-3 py-1 text-xs font-medium bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors">NEW</button>
                                <button className="px-3 py-1 text-xs font-medium bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors">IEC Branch Details <span className="ml-1 bg-red-500 text-white rounded-full px-1.5 text-[10px]">0</span></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2 relative" ref={shipperDropdownRef}>
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1 flex flex-col gap-1">
                                        <label className="text-xs font-medium text-muted-foreground">Shipper Name<span className="text-red-500 ml-0.5">*</span></label>
                                        <div className="relative">
                                            <input
                                                type="text" value={shipper.name}
                                                onChange={(e) => { setShipper(p => ({ ...p, name: e.target.value })); searchParties(e.target.value, 'shipper'); }}
                                                onFocus={() => { if (shipper.name.length >= 2) searchParties(shipper.name, 'shipper'); }}
                                                placeholder="Type company name, GSTIN, or phone to auto-fill..."
                                                className="w-full h-9 px-3 pr-8 rounded-md border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                                            />
                                            {searchingShipper && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                                        </div>
                                    </div>
                                    <button onClick={() => { if (shipper.name) searchParties(shipper.name, 'shipper'); }} className="h-9 w-9 flex items-center justify-center bg-primary/10 text-primary rounded-md hover:bg-primary/20"><Search className="w-4 h-4" /></button>
                                </div>
                                {/* Quick-fill dropdown */}
                                {showShipperDropdown && shipperSearchResults.length > 0 && (
                                    <div className="absolute z-40 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto">
                                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-border flex items-center gap-2">
                                            <span className="text-amber-500">⚡</span> Quick Fill — Click to auto-fill all details
                                        </div>
                                        {shipperSearchResults.map((party: any) => (
                                            <button
                                                key={party._id || party.id || party.name}
                                                onClick={() => fillShipperFromParty(party)}
                                                className="w-full text-left px-3 py-2.5 hover:bg-primary/10 transition-colors border-b border-border/30 last:border-0"
                                            >
                                                <div className="font-medium text-sm text-foreground">{party.name}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5 flex gap-3">
                                                    {party.contact_phone && <span>📞 {party.contact_phone}</span>}
                                                    {party.gstin && <span>🏢 {party.gstin}</span>}
                                                    {party.city && <span>📍 {party.city}</span>}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <TextareaField label="Address" value={shipper.address} onChange={(v: string) => setShipper(p => ({ ...p, address: v }))} required className="md:col-span-2" />
                            <div className="flex gap-2 items-end">
                                <InputField label="Mobile 1" value={shipper.mobile1} onChange={(v: string) => setShipper(p => ({ ...p, mobile1: v }))} required className="flex-1" />
                                <button className="h-9 w-9 flex items-center justify-center bg-primary/10 text-primary rounded-md hover:bg-primary/20"><Search className="w-4 h-4" /></button>
                            </div>
                            <InputField label="TelePhone" value={shipper.telephone} onChange={(v: string) => setShipper(p => ({ ...p, telephone: v }))} />
                            <InputField label="City" value={shipper.city} onChange={(v: string) => setShipper(p => ({ ...p, city: v }))} required />
                            <InputField label="Post Box NO" value={shipper.post_box} onChange={(v: string) => setShipper(p => ({ ...p, post_box: v }))} />
                            <InputField label="Email" value={shipper.email} onChange={(v: string) => setShipper(p => ({ ...p, email: v }))} />
                            <SelectField label="ID Type" value={shipper.id_type} onChange={(v: string) => setShipper(p => ({ ...p, id_type: v }))} options={ID_TYPES} />
                            <div className="flex gap-2 items-end">
                                <InputField label="CUSTOMER ID" value={shipper.customer_id} onChange={(v: string) => setShipper(p => ({ ...p, customer_id: v }))} className="flex-1" placeholder={shipper.id_type || 'CUSTOMER ID'} />
                                <button className="h-9 w-9 flex items-center justify-center bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200"><Search className="w-4 h-4" /></button>
                            </div>
                            <InputField label="Ship Contact Person" value={shipper.contact_person} onChange={(v: string) => setShipper(p => ({ ...p, contact_person: v }))} className="md:col-span-2" />
                        </div>
                    </div>

                    {/* Consignee */}
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-foreground">Consignee Details</h3>
                            <div className="flex gap-2">
                                <button onClick={() => setConsignee({ ...emptyConsignee })} className="px-3 py-1 text-xs font-medium bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors">NEW</button>
                                <button className="px-3 py-1 text-xs font-medium bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors">IEC Branch Details <span className="ml-1 bg-red-500 text-white rounded-full px-1.5 text-[10px]">0</span></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2 relative" ref={consigneeDropdownRef}>
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1 flex flex-col gap-1">
                                        <label className="text-xs font-medium text-muted-foreground">Consignee Name<span className="text-red-500 ml-0.5">*</span></label>
                                        <div className="relative">
                                            <input
                                                type="text" value={consignee.name}
                                                onChange={(e) => { setConsignee(p => ({ ...p, name: e.target.value })); searchParties(e.target.value, 'consignee'); }}
                                                onFocus={() => { if (consignee.name.length >= 2) searchParties(consignee.name, 'consignee'); }}
                                                placeholder="Type company name, GSTIN, or phone to auto-fill..."
                                                className="w-full h-9 px-3 pr-8 rounded-md border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                                            />
                                            {searchingConsignee && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                                        </div>
                                    </div>
                                    <button onClick={() => { if (consignee.name) searchParties(consignee.name, 'consignee'); }} className="h-9 w-9 flex items-center justify-center bg-primary/10 text-primary rounded-md hover:bg-primary/20"><Search className="w-4 h-4" /></button>
                                </div>
                                {/* Quick-fill dropdown */}
                                {showConsigneeDropdown && consigneeSearchResults.length > 0 && (
                                    <div className="absolute z-40 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto">
                                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-border flex items-center gap-2">
                                            <span className="text-amber-500">⚡</span> Quick Fill — Click to auto-fill all details
                                        </div>
                                        {consigneeSearchResults.map((party: any) => (
                                            <button
                                                key={party._id || party.id || party.name}
                                                onClick={() => fillConsigneeFromParty(party)}
                                                className="w-full text-left px-3 py-2.5 hover:bg-primary/10 transition-colors border-b border-border/30 last:border-0"
                                            >
                                                <div className="font-medium text-sm text-foreground">{party.name}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5 flex gap-3">
                                                    {party.contact_phone && <span>📞 {party.contact_phone}</span>}
                                                    {party.gstin && <span>🏢 {party.gstin}</span>}
                                                    {party.city && <span>📍 {party.city}</span>}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <TextareaField label="Address" value={consignee.address} onChange={(v: string) => setConsignee(p => ({ ...p, address: v }))} required className="md:col-span-2" />
                            <div className="flex gap-2 items-end">
                                <div className="flex gap-1 items-end flex-1">
                                    <InputField label="Mobile 1" value={consignee.mobile1_code} onChange={(v: string) => setConsignee(p => ({ ...p, mobile1_code: v }))} className="w-14" />
                                    <InputField label="" value={consignee.mobile1} onChange={(v: string) => setConsignee(p => ({ ...p, mobile1: v }))} required className="flex-1" />
                                </div>
                                <button className="h-9 w-9 flex items-center justify-center bg-primary/10 text-primary rounded-md hover:bg-primary/20"><Search className="w-4 h-4" /></button>
                            </div>
                            <div className="flex gap-1 items-end">
                                <InputField label="Mobile2" value={consignee.mobile2_code} onChange={(v: string) => setConsignee(p => ({ ...p, mobile2_code: v }))} className="w-14" />
                                <InputField label="" value={consignee.mobile2} onChange={(v: string) => setConsignee(p => ({ ...p, mobile2: v }))} className="flex-1" />
                            </div>
                            <SelectField label="State" value={consignee.state} onChange={(v: string) => setConsignee(p => ({ ...p, state: v }))} options={INDIAN_STATES} required />
                            <InputField label="Pincode" value={consignee.pincode} onChange={(v: string) => setConsignee(p => ({ ...p, pincode: v }))} />
                            <InputField label="City / District" value={consignee.district} onChange={(v: string) => setConsignee(p => ({ ...p, district: v }))} required />
                            <InputField label="Taluk" value={consignee.taluk} onChange={(v: string) => setConsignee(p => ({ ...p, taluk: v }))} />
                            <InputField label="Post Office" value={consignee.post_office} onChange={(v: string) => setConsignee(p => ({ ...p, post_office: v }))} />
                            <InputField label="E mail" value={consignee.email} onChange={(v: string) => setConsignee(p => ({ ...p, email: v }))} />
                            <SelectField label="ID Type" value={consignee.id_type} onChange={(v: string) => setConsignee(p => ({ ...p, id_type: v }))} options={ID_TYPES} />
                            <div className="flex gap-2 items-end">
                                <InputField label="CUSTOMER ID" value={consignee.customer_id} onChange={(v: string) => setConsignee(p => ({ ...p, customer_id: v }))} className="flex-1" placeholder={consignee.id_type || 'CUSTOMER ID'} />
                                <button className="h-9 w-9 flex items-center justify-center bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200"><Search className="w-4 h-4" /></button>
                            </div>
                            <InputField label="Cons Contact Person" value={consignee.contact_person} onChange={(v: string) => setConsignee(p => ({ ...p, contact_person: v }))} />
                            <InputField label="IEC No" value={consignee.iec_no} onChange={(v: string) => setConsignee(p => ({ ...p, iec_no: v }))} />
                        </div>
                    </div>
                </div>

                {/* ═══════ Section D: Shipment Details ═══════ */}
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground">Shipment Details</h3>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">ACTUAL_WEIGHT: <Badge value={actualWeight} /></span>
                            <span className="text-muted-foreground">VOLUMETRIC_WEIGHT: <Badge value={volumetricWeight.toFixed(2)} /></span>
                            <span className="text-muted-foreground">INVOICE_VALUE: <Badge value={invoiceValue.toFixed(2)} /></span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Left column */}
                        <div className="space-y-3">
                            <div className="flex gap-2 items-end">
                                <InputField label="Total_Pcs" value={totalPcs} onChange={setTotalPcs} required type="number" className="flex-1" />
                                <button onClick={() => setActiveModal('carton')} className="h-9 px-4 text-xs font-medium bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors whitespace-nowrap">Carton Info</button>
                            </div>
                            <div className="flex gap-2 items-end">
                                <InputField label="Total_Weight" value={totalWeight} onChange={setTotalWeight} required type="number" className="flex-1" />
                                <button onClick={() => setActiveModal('dimension')} className="h-9 px-4 text-xs font-medium bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors whitespace-nowrap">Dimension</button>
                            </div>
                        </div>

                        {/* Center column */}
                        <div className="space-y-3">
                            <div className="flex gap-2 items-end">
                                <InputField label="No Of Invoice" value={noOfInvoice} onChange={setNoOfInvoice} required type="number" className="flex-1" />
                                <button onClick={() => setActiveModal('invoice')} className="h-9 px-4 text-xs font-medium bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors whitespace-nowrap">Invoice Details</button>
                            </div>
                            <InputField label="Forwarding Details" value={forwardingDetails} onChange={setForwardingDetails} />
                            <InputField label="Remarks" value={remarks} onChange={setRemarks} />
                            <div className="flex items-center gap-4 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="hold_status" checked={holdStatus === 'hold'} onChange={() => setHoldStatus('hold')} className="w-4 h-4" />
                                    <span className="text-sm">Hold</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="hold_status" checked={holdStatus === 'unhold'} onChange={() => setHoldStatus('unhold')} className="w-4 h-4" />
                                    <span className="text-sm flex items-center gap-1">✓ UnHold</span>
                                </label>
                            </div>
                        </div>

                        {/* Right column */}
                        <div className="space-y-3">
                            <TextareaField label="Descrip_of_Goods" value={descripOfGoods} onChange={setDescripOfGoods} required rows={3} />
                            <InputField label="E-Way Bill No" value={ewayBillNo} onChange={setEwayBillNo} />
                            <InputField label="Received_Amount" value={receivedAmount} onChange={setReceivedAmount} type="number" />
                        </div>
                    </div>
                </div>

                {/* ═══════ Action Buttons ═══════ */}
                <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center justify-center gap-3">
                    <button className="px-5 py-2.5 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors flex items-center gap-2 shadow-sm">
                        <Upload className="w-4 h-4" /> SHIPMENT DOCUMENT UPLOAD
                    </button>
                    <button onClick={handlePrint} className="px-5 py-2.5 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors flex items-center gap-2 shadow-sm">
                        <Printer className="w-4 h-4" /> PRINT
                    </button>
                    <button onClick={resetForm} className="px-5 py-2.5 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors flex items-center gap-2 shadow-sm">
                        <Plus className="w-4 h-4" /> NEW BILL
                    </button>
                    <button onClick={() => setActiveModal('charges')} className="px-5 py-2.5 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors flex items-center gap-2 shadow-sm">
                        <DollarSign className="w-4 h-4" /> ADD CHARGES
                    </button>
                    <button onClick={() => setActiveModal('amounts')} className="px-5 py-2.5 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors flex items-center gap-2 shadow-sm">
                        <FileText className="w-4 h-4" /> AMOUNT DETAILS
                    </button>
                    <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 text-sm font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {savedHawbId ? 'UPDATE HAWB Details' : 'SAVE HAWB Details'}
                    </button>
                </div>

                {/* ═══════════ MODALS ═══════════ */}

                {/* Carton Info Modal */}
                {activeModal === 'carton' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setActiveModal(null)}>
                        <div className="bg-card border border-border rounded-xl w-full max-w-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Carton Details</h3>
                                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="flex items-center gap-4 mb-4">
                                <label className="flex items-center gap-2"><input type="radio" checked={cartonMode === 'single'} onChange={() => setCartonMode('single')} /> <span className="text-sm">Single <span className="text-red-500">*</span></span></label>
                                <label className="flex items-center gap-2"><input type="radio" checked={cartonMode === 'multiple'} onChange={() => setCartonMode('multiple')} /> <span className="text-sm">Multiple <span className="text-red-500">*</span></span></label>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <InputField label="Carton No" value={cartonNo} onChange={setCartonNo} type="number" />
                                <InputField label="Carton Weight" value={cartonWeight} onChange={setCartonWeight} type="number" />
                            </div>
                            <div className="flex gap-2 mb-4">
                                <button onClick={addCarton} className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">Save</button>
                                <button onClick={() => { setCartonNo(0); setCartonWeight(0); }} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">Cancel</button>
                            </div>
                            {cartons.length > 0 && (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-cyan-500 text-white">
                                            <th className="p-2 text-left">Carton No</th>
                                            <th className="p-2 text-left">Carton Weight</th>
                                            <th className="p-2 text-left">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cartons.map(c => (
                                            <tr key={c.id} className="border-b border-border">
                                                <td className="p-2">{c.carton_no}</td>
                                                <td className="p-2">{c.weight}</td>
                                                <td className="p-2">
                                                    <button onClick={() => removeCarton(c.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* Dimension Modal */}
                {activeModal === 'dimension' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setActiveModal(null)}>
                        <div className="bg-card border border-border rounded-xl w-full max-w-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">ADD VOLUMETRIC WEIGHT DETAILS</h3>
                                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
                            </div>
                            {hawbNo && <p className="text-sm mb-3">HAWB NO: <Badge value={hawbNo} /></p>}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <InputField label="Length (cm)" value={dimLength} onChange={setDimLength} type="number" />
                                    <InputField label="Width (cm)" value={dimWidth} onChange={setDimWidth} type="number" />
                                    <InputField label="Height (cm)" value={dimHeight} onChange={setDimHeight} type="number" />
                                    <InputField label="Pcs" value={dimPcs} onChange={setDimPcs} type="number" />
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={addDimension} className="px-4 py-2 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">SAVE</button>
                                        <button onClick={() => { setDimLength(0); setDimWidth(0); setDimHeight(0); setDimPcs(0); }} className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600">CANCEL</button>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-muted-foreground">Volumetric Radio</span>
                                        <input type="number" value={volFactor} onChange={e => setVolFactor(parseFloat(e.target.value) || 5000)} className="w-20 h-8 px-2 text-sm border border-border rounded bg-background text-foreground" />
                                    </div>
                                    {dimensions.length > 0 && (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-cyan-500 text-white">
                                                    <th className="p-2">S.N</th>
                                                    <th className="p-2">Length</th>
                                                    <th className="p-2">Width</th>
                                                    <th className="p-2">Height</th>
                                                    <th className="p-2">Weight</th>
                                                    <th className="p-2"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dimensions.map((d, i) => (
                                                    <tr key={d.id} className="border-b border-border">
                                                        <td className="p-2">{i + 1}</td>
                                                        <td className="p-2">{d.length}</td>
                                                        <td className="p-2">{d.width}</td>
                                                        <td className="p-2">{d.height}</td>
                                                        <td className="p-2">{d.weight}</td>
                                                        <td className="p-2"><button onClick={() => removeDimension(d.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                    <div className="mt-3 text-sm">
                                        Total Volumetric Weight: <Badge value={volumetricWeight.toFixed(2)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Invoice Details Modal */}
                {activeModal === 'invoice' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setActiveModal(null)}>
                        <div className="bg-card border border-border rounded-xl w-full max-w-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Invoice Details</h3>
                                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <InputField label="Invoice No" value={invNo} onChange={setInvNo} />
                                <InputField label="Invoice Value" value={invValue} onChange={setInvValue} type="number" />
                                <SelectField label="Currency" value={invCurrency} onChange={setInvCurrency} options={['INR', 'USD', 'EUR', 'GBP', 'AED']} />
                            </div>
                            <div className="flex gap-2 mb-4">
                                <button onClick={addInvoice} className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">Save</button>
                                <button onClick={() => { setInvNo(''); setInvValue(0); }} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">Reset</button>
                            </div>
                            {invoices.length > 0 && (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-cyan-500 text-white">
                                            <th className="p-2 text-left">SI No</th>
                                            <th className="p-2 text-left">Invoice No</th>
                                            <th className="p-2 text-left">Invoice Value</th>
                                            <th className="p-2 text-left">Invoice Currency</th>
                                            <th className="p-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.map((inv, i) => (
                                            <tr key={inv.id} className="border-b border-border">
                                                <td className="p-2">{i + 1}</td>
                                                <td className="p-2">{inv.invoice_no}</td>
                                                <td className="p-2">{inv.value}</td>
                                                <td className="p-2">{inv.currency}</td>
                                                <td className="p-2"><button onClick={() => removeInvoice(inv.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* ADD CHARGES Modal */}
                {activeModal === 'charges' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setActiveModal(null)}>
                        <div className="bg-card border border-border rounded-xl w-full max-w-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">ADD CHARGES</h3>
                                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
                            </div>
                            {hawbNo && <div className="text-sm mb-3 text-right">Bill No: <span className="font-bold text-primary">{hawbNo}</span></div>}
                            <button onClick={addCharge} className="mb-4 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Add Extra Charges
                            </button>
                            <div className="space-y-3">
                                {charges.map(charge => (
                                    <div key={charge.id} className="grid grid-cols-4 gap-3 items-end">
                                        <InputField label="Charges Name" value={charge.name} onChange={(v: string) => updateCharge(charge.id, 'name', v)} required />
                                        <SelectField label="Type" value={charge.type} onChange={(v: string) => updateCharge(charge.id, 'type', v)} required options={['Flat', 'Percentage', 'Per KG', 'Per Piece']} />
                                        <InputField label="Charges Amount" value={charge.amount} onChange={(v: number) => updateCharge(charge.id, 'amount', v)} required type="number" />
                                        <button onClick={() => removeCharge(charge.id)} className="h-9 px-3 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-1">
                                            <span>- Remove Charge</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setActiveModal(null)} className="flex-1 py-2.5 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium">SAVE CHARGES DETAILS</button>
                                <button onClick={() => setCharges([{ id: '1', name: 'FOV', type: '', amount: 0 }, { id: '2', name: 'AWB', type: '', amount: 0 }])} className="flex-1 py-2.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium">REFRESH CHARGES DETAILS</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* AMOUNT DETAILS Modal */}
                {activeModal === 'amounts' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setActiveModal(null)}>
                        <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Amount Details</h3>
                                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-3">
                                <InputField label="Freight Amount" value={amounts.freight} onChange={(v: number) => setAmounts(p => ({ ...p, freight: v }))} type="number" />
                                <InputField label="Document Charges" value={amounts.document_charges} onChange={(v: number) => setAmounts(p => ({ ...p, document_charges: v }))} type="number" />
                                <InputField label="Pickup Charges" value={amounts.pickup_charges} onChange={(v: number) => setAmounts(p => ({ ...p, pickup_charges: v }))} type="number" />
                                <InputField label="Other Charges" value={amounts.other_charges} onChange={(v: number) => setAmounts(p => ({ ...p, other_charges: v }))} type="number" />
                                <hr className="border-border" />
                                <InputField label="IGST" value={amounts.igst} onChange={(v: number) => setAmounts(p => ({ ...p, igst: v }))} type="number" />
                                <InputField label="CGST" value={amounts.cgst} onChange={(v: number) => setAmounts(p => ({ ...p, cgst: v }))} type="number" />
                                <InputField label="SGST" value={amounts.sgst} onChange={(v: number) => setAmounts(p => ({ ...p, sgst: v }))} type="number" />
                            </div>
                            <button onClick={() => setActiveModal(null)} className="w-full mt-4 py-2.5 text-sm bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 font-medium">Save Amount Details</button>
                        </div>
                    </div>
                )}

                {/* PRINT Modal */}
                {activeModal === 'print' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setActiveModal(null)}>
                        <div className="bg-card border border-border rounded-xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold">Print Documents</h3>
                                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
                            </div>
                            {!savedHawbId ? (
                                <div className="text-center py-4">
                                    <p className="text-muted-foreground text-sm">Please save the HAWB first before printing.</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-3 justify-center">
                                    <button
                                        onClick={() => { printPOD(savedHawbId, true); setActiveModal(null); }}
                                        className="px-6 py-3 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 flex items-center gap-2"
                                    >
                                        <Printer className="w-4 h-4" /> POD
                                    </button>
                                    <button
                                        onClick={() => { printInvoice(savedHawbId, true); setActiveModal(null); }}
                                        className="px-6 py-3 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" /> Invoice
                                    </button>
                                    <button
                                        onClick={() => { printPOD(savedHawbId, false); }}
                                        className="px-6 py-3 text-sm font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                                    >
                                        📥 Download POD
                                    </button>
                                    <button
                                        onClick={() => { printInvoice(savedHawbId, false); }}
                                        className="px-6 py-3 text-sm font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                                    >
                                        📥 Download Invoice
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
