/**
 * Global Constants for Logistics ERP Platform
 */

// Service Types
export const SERVICE_TYPES = {
  air: 'Air',
  sea: 'Sea',
  road: 'Road',
  rail: 'Rail',
} as const;

export const SHIPMENT_TYPES = {
  parcel: 'Parcel',
  cargo: 'Cargo',
  document: 'Document',
  hazmat: 'Hazardous Material',
  fragile: 'Fragile',
  perishable: 'Perishable',
} as const;

// Delivery Modes
export const DELIVERY_MODES = {
  door_to_door: 'Door to Door',
  warehouse: 'Warehouse',
  port: 'Port',
  airport: 'Airport',
  customs: 'Customs',
} as const;

// User Roles
export const USER_ROLES = {
  admin: 'Admin',
  operations: 'Operations',
  customer: 'Customer',
  driver: 'Driver',
  finance: 'Finance',
} as const;

// Tax Rates
export const TAX_RATES = {
  standard: 18, // GST 18%
  reduced: 5, // GST 5%
  zero: 0, // GST 0%
} as const;

// Status Colors (for light theme)
export const STATUS_COLORS = {
  delivered: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
  },
  in_transit: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
  },
  pending: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
  },
  on_hold: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
  },
  exception: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
  },
  paid: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
  },
  pending_payment: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
  },
  overdue: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
  },
} as const;

// Distance Units
export const DISTANCE_UNITS = {
  km: 'Kilometers',
  miles: 'Miles',
} as const;

// Weight Units
export const WEIGHT_UNITS = {
  kg: 'Kilograms',
  lbs: 'Pounds',
  ton: 'Tons',
} as const;

// Default Pagination
export const DEFAULT_PAGINATION = {
  limit: 50,
  page: 1,
  offset: 0,
} as const;

// Document Types
export const DOCUMENT_TYPES = {
  awb: 'Air Waybill',
  pod: 'Proof of Delivery',
  kyc: 'Know Your Customer',
  invoice: 'Invoice',
  packing_list: 'Packing List',
  customs_declaration: 'Customs Declaration',
  insurance: 'Insurance',
  other: 'Other',
} as const;

// E-Way Bill Validity (in days)
export const EWAY_BILL_VALIDITY = {
  single_trip: 1,
  inter_state: 10,
  intra_state: 1,
} as const;

// API Response Status
export const API_STATUS = {
  success: 'success',
  error: 'error',
  processing: 'processing',
  pending: 'pending',
} as const;

// Common Error Messages
export const ERROR_MESSAGES = {
  unauthorized: 'You are not authorized to perform this action',
  forbidden: 'Access forbidden',
  not_found: 'Resource not found',
  validation_error: 'Please check your input and try again',
  network_error: 'Network error. Please check your connection',
  server_error: 'Server error. Please try again later',
  invalid_email: 'Please enter a valid email address',
  invalid_phone: 'Please enter a valid phone number',
  invalid_gstin: 'Please enter a valid GSTIN',
  weak_password: 'Password must be at least 8 characters',
  password_mismatch: 'Passwords do not match',
  invalid_hawb: 'Please enter a valid HAWB number',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  created: 'Created successfully',
  updated: 'Updated successfully',
  deleted: 'Deleted successfully',
  shipped: 'Shipment created successfully',
  invoice_generated: 'Invoice generated successfully',
  eway_bill_generated: 'E-Way Bill generated successfully',
  payment_processed: 'Payment processed successfully',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  email_regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone_regex: /^[\d\s\-\+\(\)]+$/,
  gstin_regex: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  hawb_regex: /^[A-Z0-9]{3,20}$/,
  password_min_length: 8,
  phone_min_length: 10,
} as const;

// Default Charge Calculations
export const DEFAULT_CHARGES = {
  base_air: 500,
  base_sea: 300,
  base_road: 200,
  weight_multiplier: 5, // ₹ per kg
  distance_multiplier: 1, // ₹ per km
  service_charge_percentage: 10,
} as const;

// Menu Navigation Items
export const MAIN_MENU_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Shipments', href: '/shipments' },
  { label: 'Billing', href: '/billing' },
  { label: 'E-Way Bills', href: '/eway-bills' },
  { label: 'Tracking', href: '/tracking' },
  { label: 'Operations', href: '/operations' },
  { label: 'Driver Portal', href: '/driver' },
  { label: 'Reports', href: '/reports' },
  { label: 'Admin', href: '/admin/users' },
] as const;

// API Endpoints (relative to base URL)
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  shipments: {
    list: '/shipments',
    create: '/shipments',
    get: (id: string) => `/shipments/${id}`,
    update: (id: string) => `/shipments/${id}`,
  },
  invoices: {
    list: '/invoices',
    create: '/invoices',
    get: (id: string) => `/invoices/${id}`,
  },
  eway_bills: {
    list: '/eway-bills',
    create: '/eway-bills',
    get: (id: string) => `/eway-bills/${id}`,
  },
  tracking: {
    get: (shipmentId: string) => `/shipments/${shipmentId}/tracking`,
  },
} as const;

// Date Format Options
export const DATE_FORMATS = {
  short: 'MMM DD, YYYY',
  long: 'MMMM DD, YYYY',
  time: 'HH:mm:ss',
  datetime: 'MMM DD, YYYY HH:mm',
  iso: 'YYYY-MM-DD',
} as const;

// Cache Duration (in seconds)
export const CACHE_DURATION = {
  short: 5 * 60, // 5 minutes
  medium: 15 * 60, // 15 minutes
  long: 60 * 60, // 1 hour
  very_long: 24 * 60 * 60, // 24 hours
} as const;
