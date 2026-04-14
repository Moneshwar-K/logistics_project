import mongoose, { Schema, Document } from 'mongoose';

export interface IBankDetails {
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  account_holder: string;
  branch: string;
}

export interface IBranch extends Document {
  name: string;
  code: string;
  branch_type: 'origin' | 'destination' | 'hub' | 'warehouse';
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  zone: string;
  gst_number?: string;
  contact_email: string;
  contact_phone: string;
  manager_name?: string;
  manager_phone?: string;
  bank_details?: IBankDetails;
  // New Fields
  weight_config?: {
    min_weight: number;
    max_weight: number;
    dimensional_factor: number;
  };
  accounts_config?: {
    ledger_name: string;
    ledger_code: string;
    cost_center: string;
  };
  // ----------
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

const BankDetailsSchema = new Schema<IBankDetails>(
  {
    bank_name: { type: String, default: '' },
    account_number: { type: String, default: '' },
    ifsc_code: { type: String, default: '' },
    account_holder: { type: String, default: '' },
    branch: { type: String, default: '' },
  },
  { _id: false }
);

const BranchSchema = new Schema<IBranch>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    branch_type: {
      type: String,
      enum: ['origin', 'destination', 'hub', 'warehouse'],
      default: 'origin',
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      default: '',
    },
    pincode: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      required: true,
      default: 'India',
    },
    zone: {
      type: String,
      default: '',
    },
    gst_number: String,
    contact_email: {
      type: String,
      required: true,
    },
    contact_phone: {
      type: String,
      required: true,
    },
    manager_name: String,
    manager_phone: String,
    bank_details: {
      type: BankDetailsSchema,
      default: null,
    },
    // --- New Legacy Fields ---
    weight_config: {
      min_weight: { type: Number, default: 0 },
      max_weight: { type: Number, default: 0 },
      dimensional_factor: { type: Number, default: 5000 }, // Standard 5000 divisor
    },
    accounts_config: {
      ledger_name: { type: String, default: '' },
      ledger_code: { type: String, default: '' },
      cost_center: { type: String, default: '' },
    },
    // -------------------------
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);


// Indexes are defined in schema

export const Branch = mongoose.model<IBranch>('Branch', BranchSchema);
