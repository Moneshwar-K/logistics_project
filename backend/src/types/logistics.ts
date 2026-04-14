/**
 * TypeScript types matching frontend types/logistics.ts
 * These types are used throughout the backend
 */

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

export type UserRole = 'admin' | 'operations' | 'customer' | 'driver' | 'finance';

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

export type EWayBillStatus = 'generated' | 'in_transit' | 'delivered' | 'expired' | 'cancelled';

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  name: string;
  role: UserRole;
  branch_id: string;
  status: 'active' | 'inactive';
  phone?: string;
  vehicle_number?: string;
  license_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  contact_email: string;
  contact_phone: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Party {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  gst_number?: string;
  aadhaar_number?: string;
  pan_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Shipment {
  id: string;
  hawb: string;
  awb?: string;
  shipper_id: string;
  consignee_id: string;
  origin_city: string;
  origin_country: string;
  destination_city: string;
  destination_country: string;
  service_type: 'air' | 'sea' | 'surface' | 'train' | 'parcel' | 'express';
  shipment_type: 'document' | 'parcel' | 'cargo';
  total_cartons: number;
  total_weight: number;
  total_weight_cbm?: number;
  invoice_value: number;
  invoice_currency: string;
  status: ShipmentStatus;
  current_location?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  mode: 'air' | 'sea' | 'surface' | 'train' | 'parcel' | 'express';
  carrier?: string;
  reference_number?: string;
  created_at: string;
  updated_at: string;
  branch_id: string;
  created_by_id: string;
}

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

export interface Invoice {
  id: string;
  invoice_number: string;
  shipment_id: string;
  billed_party_id: string;
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

export interface EWayBill {
  id: string;
  eway_bill_number: string;
  shipment_id: string;
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

export interface HAWBAudit {
  id: string;
  hawb: string;
  shipment_id: string;
  audit_status: 'pending' | 'in_progress' | 'completed' | 'discrepancy_found';
  audit_date: string;
  audited_by_id: string;
  total_cartons: number;
  cartons_verified: number;
  weight_variance: number;
  remarks?: string;
  discrepancies: string[];
  balance_amount: number;
  created_at: string;
  updated_at: string;
  branch_id: string;
}

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
