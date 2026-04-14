import type { Shipment, ShipmentStatus, Invoice } from '@/types/logistics';

/**
 * Comprehensive utilities for logistics operations
 * Handles shipment pricing, status transitions, and business logic
 */

// Status transition rules
const STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'on_hold'],
  in_transit: ['in_port', 'ready_for_delivery', 'exception'],
  in_port: ['customs_clearance', 'on_hold'],
  customs_clearance: ['ready_for_delivery', 'exception'],
  ready_for_delivery: ['out_for_delivery', 'on_hold'],
  out_for_delivery: ['delivered', 'exception'],
  delivered: [],
  on_hold: ['in_transit', 'pending', 'exception'],
  exception: ['in_transit', 'on_hold', 'pending'],
  cancelled: [],
};

/**
 * Validate if a status transition is allowed
 */
export function isValidStatusTransition(
  currentStatus: ShipmentStatus,
  nextStatus: ShipmentStatus
): boolean {
  return STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus) || false;
}

/**
 * Get allowed next statuses for current shipment status
 */
export function getAllowedNextStatuses(currentStatus: ShipmentStatus): ShipmentStatus[] {
  return STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Calculate shipping charges based on weight and distance
 */
export interface ShippingCharges {
  baseCharge: number;
  weightCharge: number;
  distanceCharge: number;
  serviceCharge: number;
  subtotal: number;
  tax: number;
  total: number;
}

export function calculateShippingCharges(
  weight: number,
  distance: number = 100,
  serviceType: 'air' | 'sea' | 'road' = 'air',
  taxPercentage: number = 18
): ShippingCharges {
  // Base charge varies by service type
  const baseChargeMap = {
    air: 500,
    sea: 300,
    road: 200,
  };

  const baseCharge = baseChargeMap[serviceType];
  const weightCharge = weight * 5; // ₹5 per kg
  const distanceCharge = Math.ceil(distance / 100) * 100; // ₹100 per 100km
  const serviceCharge = Math.ceil((baseCharge + weightCharge + distanceCharge) * 0.1); // 10% service charge

  const subtotal = baseCharge + weightCharge + distanceCharge + serviceCharge;
  const tax = Math.round(subtotal * (taxPercentage / 100));
  const total = subtotal + tax;

  return {
    baseCharge,
    weightCharge,
    distanceCharge,
    serviceCharge,
    subtotal,
    tax,
    total,
  };
}

/**
 * Format shipment status for display with color coding
 */
export interface StatusDisplay {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const STATUS_DISPLAY_MAP: Record<ShipmentStatus, StatusDisplay> = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: '⏳',
  },
  picked_up: {
    label: 'Picked Up',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: '📦',
  },
  in_transit: {
    label: 'In Transit',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: '🚚',
  },
  in_port: {
    label: 'In Port',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    icon: '⛴️',
  },
  customs_clearance: {
    label: 'Customs Clearance',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: '📋',
  },
  ready_for_delivery: {
    label: 'Ready for Delivery',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: '✅',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: '🚗',
  },
  delivered: {
    label: 'Delivered',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: '✔️',
  },
  on_hold: {
    label: 'On Hold',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: '⛔',
  },
  exception: {
    label: 'Exception',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: '⚠️',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: '❌',
  },
};

/**
 * Get status display information
 */
export function getStatusDisplay(status: ShipmentStatus): StatusDisplay {
  return STATUS_DISPLAY_MAP[status] || STATUS_DISPLAY_MAP.pending;
}

/**
 * Check if shipment is in final state
 */
export function isShipmentComplete(status: ShipmentStatus): boolean {
  return ['delivered', 'cancelled'].includes(status);
}

/**
 * Check if shipment requires attention
 */
export function requiresAttention(status: ShipmentStatus): boolean {
  return ['exception', 'on_hold'].includes(status);
}

/**
 * Calculate days in transit
 */
export function calculateDaysInTransit(createdAt: string, updatedAt?: string): number {
  const start = new Date(createdAt).getTime();
  const end = updatedAt ? new Date(updatedAt).getTime() : new Date().getTime();
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  const currencySymbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toLocaleString()}`;
}

/**
 * Generate reference number
 */
export function generateReferenceNumber(prefix: string = 'REF'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Check if invoice is overdue
 */
export function isInvoiceOverdue(invoice: Invoice): boolean {
  if (invoice.payment_status === 'paid') return false;
  const dueDate = new Date(invoice.due_date).getTime();
  return dueDate < new Date().getTime();
}

/**
 * Calculate invoice aging days
 */
export function getInvoiceAgingDays(invoice: Invoice): number {
  const today = new Date().getTime();
  const invoiceDate = new Date(invoice.invoice_date).getTime();
  return Math.ceil((today - invoiceDate) / (1000 * 60 * 60 * 24));
}

/**
 * Get payment status color
 */
export function getPaymentStatusColor(
  status: 'pending' | 'paid' | 'overdue' | 'partial'
): string {
  const colors: Record<string, string> = {
    pending: 'text-yellow-700',
    paid: 'text-green-700',
    overdue: 'text-red-700',
    partial: 'text-orange-700',
  };
  return colors[status] || 'text-gray-700';
}

/**
 * Validate GSTR for GST Identification Number
 */
export function isValidGSTIN(gstin: string): boolean {
  // GSTIN format: 27AABCT1234H1Z0 (15 characters)
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
}
