/**
 * Logistics & Import-Export ERP Data Types
 * All types are designed for database integration with REST API
 */

// Authentication
export interface User {
  id: string;
  email: string;
  password_hash?: string;
  name: string;
  role: 'admin' | 'operations' | 'customer' | 'driver' | 'finance';
  branch_id: string;
  status: 'active' | 'inactive';
  phone?: string;
  vehicle_number?: string; // For drivers
  license_number?: string; // For drivers
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refresh_token?: string;
  expires_at: string;
}

// Shipment Core
export type ShipmentStatus =
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'in_port'
  | 'customs_clearance'
  | 'ready_for_delivery'
  | 'out_for_delivery'
  | 'delivered'
  | 'on_hold'
  | 'cancelled'
  | 'exception';

export interface IECBranch {
  branch_code: string;
  branch_name: string;
  address: string;
}

export interface Party {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  postal_code?: string;
  country: string;
  party_type: 'client' | 'agent' | 'vendor' | 'consignee';
  gst_number?: string;
  pan_number?: string;
  aadhaar_number?: string;
  iec_code?: string;
  iec_branches?: IECBranch[];
  credit_limit?: number;
  credit_used?: number;
  payment_terms?: 'prepaid' | 'credit' | 'cod' | 'tbb';
  contact_person?: string;
  alternate_phone?: string;
  status?: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface Shipment {
  id: string;
  hawb: string; // House Airway Bill
  awb?: string; // Master Airway Bill
  shipper_id: string;
  shipper: Party;
  consignee_id: string;
  consignee: Party;
  origin_city: string;
  origin_country: string;
  destination_city: string;
  destination_country: string;
  service_type: 'air' | 'sea' | 'land' | 'parcel';
  shipment_type: 'document' | 'parcel' | 'cargo';
  total_cartons: number;
  total_weight: number; // in kg
  total_weight_cbm?: number; // cubic meters
  invoice_value: number;
  invoice_currency: string;
  status: ShipmentStatus;
  current_location?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  mode: 'air' | 'sea' | 'land';
  carrier?: string;
  reference_number?: string;
  created_at: string;
  updated_at: string;
  branch_id: string;
  created_by_id: string;
}

// Tracking
export interface TrackingEvent {
  id: string;
  shipment_id: string;
  status: ShipmentStatus;
  location: string;
  city: string;
  country: string;
  timestamp: string;
  scanned_by: string;
  remarks?: string;
  condition?: 'intact' | 'damaged' | 'partial_damage';
  proof_of_delivery_url?: string;
  created_at: string;
}

export interface TrackingResponse {
  shipment: Shipment;
  current_status: TrackingEvent;
  tracking_history: TrackingEvent[];
  documents: Document[];
  transit_summary: {
    total_cartons: number;
    total_weight: number;
    first_scan_date: string;
    last_scan_date: string;
  };
}

// Documents
export type DocumentType =
  | 'awb'
  | 'hawb'
  | 'invoice'
  | 'packing_list'
  | 'pod'
  | 'kyc'
  | 'signature'
  | 'customs_declaration'
  | 'insurance_certificate'
  | 'bill_of_lading';

export interface Document {
  id: string;
  shipment_id: string;
  document_type: DocumentType;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  uploaded_by_id: string;
  created_at: string;
}

// Operations Status Update
export interface OperationStatusUpdate {
  id: string;
  shipment_id: string;
  previous_status: ShipmentStatus;
  new_status: ShipmentStatus;
  update_date: string;
  remarks?: string;
  updated_by_id: string;
  created_at: string;
  branch_id: string;
}

// Proof of Delivery (POD)
export interface POD {
  id: string;
  shipment_id: string;
  receiver_name: string;
  receiver_contact: string;
  receiver_address: string;
  delivery_date: string;
  delivery_time: string;
  acceptance_checklist: {
    package_intact: boolean;
    seals_intact: boolean;
    no_damage: boolean;
    weight_verified: boolean;
    cartons_verified: boolean;
  };
  signature_url: string;
  company_stamp_url?: string;
  remarks?: string;
  created_at: string;
  created_by_id: string;
  branch_id: string;
}

// POD Upload
export interface PODUpload {
  id: string;
  shipment_id: string;
  pod_file_url: string;
  signature_file_url?: string;
  kyc_front_url?: string;
  kyc_back_url?: string;
  uploaded_at: string;
  uploaded_by_id: string;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
}

// Audit
export interface HAWBAudit {
  id: string;
  hawb: string;
  shipment_id: string;
  audit_status: 'pending' | 'in_progress' | 'completed' | 'discrepancy_found';
  audit_date: string;
  audited_by_id: string;
  total_cartons: number;
  cartons_verified: number;
  weight_variance: number; // kg
  remarks?: string;
  discrepancies: string[];
  balance_amount: number;
  created_at: string;
  updated_at: string;
  branch_id: string;
}

export interface AuditDashboard {
  total_hawbs: number;
  pending_audits: number;
  audited_today: number;
  discrepancies: number;
  balance_amount: number;
  recent_activity: OperationStatusUpdate[];
}

// Charges & Billing
export interface Charge {
  id: string;
  shipment_id: string;
  charge_type: string; // 'fuel_surcharge', 'handling', 'documentation', etc.
  amount: number;
  currency: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  shipment_ids: string[];
  shipper_id: string;
  consignee_id: string;
  total_amount: number;
  currency: string;
  tax_amount: number;
  grand_total: number;
  invoice_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  created_at: string;
  created_by_id: string;
  branch_id: string;
}

// Branch
export interface Branch {
  id: string;
  name: string;
  code: string;
  branch_type?: 'origin' | 'destination' | 'hub' | 'warehouse';
  address: string;
  city: string;
  state?: string;
  pincode?: string;
  country: string;
  zone?: string;
  gst_number?: string;
  contact_email: string;
  contact_phone: string;
  manager_name?: string;
  manager_phone?: string;
  bank_details?: {
    bank_name: string;
    account_number: string;
    ifsc_code: string;
    account_holder: string;
    branch: string;
  };
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
}

// Employee
export interface Employee {
  id: string;
  _id?: string;
  employee_code: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  branch_id: string | { _id: string; name: string; code: string };
  date_of_joining: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  aadhaar_number?: string;
  pan_number?: string;
  bank_details?: {
    bank_name: string;
    account_number: string;
    ifsc_code: string;
  };
  salary?: number;
  user_id?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

// Service Type
export interface ServiceType {
  id: string;
  _id?: string;
  code: string;
  name: string;
  description?: string;
  mode: 'air' | 'sea' | 'land' | 'rail';
  is_express: boolean;
  transit_days: number;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

// Organization
export interface Organization {
  id: string;
  _id?: string;
  name: string;
  tagline?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  gstin?: string;
  pan?: string;
  cin?: string;
  email?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  proprietor_name?: string;
  bank_details?: {
    bank_name: string;
    account_number: string;
    ifsc_code: string;
    branch: string;
  };
  terms_and_conditions?: string;
  created_at?: string;
  updated_at?: string;
}

// API Request/Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  timestamp: string;
}

// Form Data Types
export interface BookingFormData {
  shipper: Party;
  consignee: Party;
  origin_city: string;
  origin_country: string;
  destination_city: string;
  destination_country: string;
  service_type: 'air' | 'sea' | 'land' | 'parcel';
  shipment_type: 'document' | 'parcel' | 'cargo';
  total_cartons: number;
  total_weight: number;
  invoice_value: number;
  invoice_currency: string;
  mode: 'air' | 'sea' | 'land';
  carrier?: string;
  reference_number?: string;
  documents?: File[];
}

export interface StatusUpdateFormData {
  hawb: string;
  new_status: ShipmentStatus;
  update_date: string;
  remarks?: string;
}

export interface PODFormData {
  shipment_id: string;
  receiver_name: string;
  receiver_contact: string;
  receiver_address: string;
  delivery_date: string;
  delivery_time: string;
  acceptance_checklist: {
    package_intact: boolean;
    seals_intact: boolean;
    no_damage: boolean;
    weight_verified: boolean;
    cartons_verified: boolean;
  };
  signature_url: string;
  company_stamp_url?: string;
  remarks?: string;
}

export interface QuickTrackingQuery {
  hawb?: string;
  awb?: string;
  reference_number?: string;
}

// Filter Types
export interface ShipmentFilters {
  date_from?: string;
  date_to?: string;
  status?: ShipmentStatus;
  hawb?: string;
  shipper_name?: string;
  origin_city?: string;
  destination_city?: string;
  service_type?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'status' | 'weight' | 'hawb';
  sort_order?: 'asc' | 'desc';
}

// Invoice & Billing
export interface Invoice {
  id: string;
  invoice_number: string;
  shipment_id: string;
  shipment: Shipment;
  billed_party_id: string;
  billed_party: Party;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  payment_status: 'pending' | 'paid' | 'overdue' | 'partial';
  payment_date?: string;
  payment_method?: 'bank_transfer' | 'cheque' | 'credit_card' | 'cash';
  notes?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceFormData {
  shipment_id: string;
  billed_party_id: string;
  invoice_date: string;
  due_date: string;
  custom_charges?: { description: string; amount: number }[];
  tax_percentage?: number;
}

// E-Way Bill
export type EWayBillStatus = 'generated' | 'in_transit' | 'delivered' | 'expired' | 'cancelled';

export interface EWayBill {
  id: string;
  eway_bill_number: string;
  shipment_id: string;
  shipment: Shipment;
  consignor_gstin: string;
  consignee_gstin: string;
  total_invoice_value: number;
  vehicle_number: string;
  transporter_id?: string;
  status: EWayBillStatus;
  generated_date: string;
  valid_from: string;
  valid_till: string;
  cancelled_date?: string;
  cancelled_reason?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface EWayBillFormData {
  shipment_id: string;
  consignor_gstin: string;
  consignee_gstin: string;
  vehicle_number: string;
  transporter_id?: string;
  valid_till_days?: number; // Default: 1 (single trip) or more
}

// Driver Assignment
export interface DriverAssignment {
  id: string;
  driver_id: string;
  driver: User;
  shipment_id: string;
  shipment: Shipment;
  assigned_date: string;
  assigned_by_id: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'exception';
  current_location?: string;
  eta?: string;
  completed_date?: string;
  notes?: string;
}

// Utility Types
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
