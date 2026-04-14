/**
 * Formatting utilities for consistent data presentation across the platform
 */

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date, format: 'short' | 'long' | 'time' | 'full' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const options: Record<string, any> = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
    full: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  };

  return d.toLocaleDateString('en-IN', options[format]);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return formatDate(d, 'short');
}

/**
 * Format currency with proper locale and symbol
 */
export function formatCurrency(
  amount: number,
  currency: 'INR' | 'USD' | 'EUR' | 'GBP' = 'INR',
  decimals: number = 2
): string {
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  const symbol = symbols[currency] || currency;
  const formatted = amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `${symbol}${formatted}`;
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format: +91-XXXXX-XXXXX or +1-XXX-XXX-XXXX
  if (cleaned.startsWith('91')) {
    return `+91-${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return `+1-${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
}

/**
 * Format GSTIN for display
 */
export function formatGSTIN(gstin: string): string {
  // Format: XX XXXXX XXXX XX X X
  if (gstin.length !== 15) return gstin;
  return `${gstin.slice(0, 2)} ${gstin.slice(2, 7)} ${gstin.slice(7, 11)} ${gstin.slice(11, 13)} ${gstin.slice(13, 14)} ${gstin.slice(14)}`;
}

/**
 * Format HAWB/AWB for display
 */
export function formatHAWB(hawb: string): string {
  // Uppercase and ensure proper format
  return hawb.toUpperCase().trim();
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format weight with proper unit
 */
export function formatWeight(kg: number, unit: 'kg' | 'lbs' | 'ton' = 'kg'): string {
  const unitMap: Record<string, string> = {
    kg: 'kg',
    lbs: 'lbs',
    ton: 'ton',
  };

  if (unit === 'lbs') {
    return `${(kg * 2.20462).toFixed(2)} ${unitMap[unit]}`;
  }
  if (unit === 'ton') {
    return `${(kg / 1000).toFixed(2)} ${unitMap[unit]}`;
  }

  return `${kg.toFixed(2)} ${unitMap[unit]}`;
}

/**
 * Format distance with proper unit
 */
export function formatDistance(km: number, unit: 'km' | 'miles' = 'km'): string {
  if (unit === 'miles') {
    return `${(km * 0.621371).toFixed(2)} miles`;
  }
  return `${km.toFixed(2)} km`;
}

/**
 * Format address components into single line
 */
export function formatAddress(city: string, state: string, postal: string, country: string): string {
  const parts = [city, state, postal, country].filter(Boolean);
  return parts.join(', ');
}

/**
 * Format shipment reference for display
 */
export function formatReference(reference: string): string {
  return reference.toUpperCase().replace(/\s+/g, '-');
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format heading for list (capitalize each word)
 */
export function formatHeading(text: string): string {
  return text
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format status text for display
 */
export function formatStatusText(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Format invoice number for consistency
 */
export function formatInvoiceNumber(invoiceId: string): string {
  // INV-2024-XXXXX format
  return invoiceId.toUpperCase();
}

/**
 * Format EWay Bill number
 */
export function formatEWayBillNumber(billNumber: string): string {
  // 15-digit number with spacing: 40 1001234567 890
  if (billNumber.length === 15) {
    return `${billNumber.slice(0, 2)} ${billNumber.slice(2, 8)} ${billNumber.slice(8)}`;
  }
  return billNumber;
}

/**
 * Format time duration
 */
export function formatDuration(hours: number): string {
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days > 0) {
    return `${days}d ${remainingHours}h`;
  }
  return `${remainingHours}h`;
}

/**
 * Format KPI value (with shorthand for large numbers)
 */
export function formatKPI(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Format JSON for display
 */
export function formatJSON(obj: any, pretty: boolean = true): string {
  if (pretty) {
    return JSON.stringify(obj, null, 2);
  }
  return JSON.stringify(obj);
}
