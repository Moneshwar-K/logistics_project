import mongoose, { Schema, Document } from 'mongoose';

export interface IIECBranch {
  branch_code: string;
  branch_name: string;
  address: string;
}

export interface IParty extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  party_type: 'client' | 'agent' | 'vendor' | 'consignee';
  gst_number?: string;
  pan_number?: string;
  aadhaar_number?: string;
  iec_code?: string;
  iec_branches: IIECBranch[];
  credit_limit: number;
  credit_used: number;
  payment_terms: 'prepaid' | 'credit' | 'cod' | 'tbb';
  contact_person?: string;
  alternate_phone?: string;
  // New Fields
  bank_details?: {
    account_name: string;
    account_number: string;
    ifsc_code: string;
    bank_name: string;
    branch_name: string;
  };
  credit_days?: number;
  opening_balance?: {
    amount: number;
    type: 'debit' | 'credit';
    date: Date;
  };
  tds_config?: {
    percentage: number;
    section: string;
  };
  sales_person_id?: any;
  documents?: {
    doc_type: string;
    doc_number: string;
    file_url?: string;
    expiry_date?: Date;
  }[];
  // ----------
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

const IECBranchSchema = new Schema<IIECBranch>(
  {
    branch_code: { type: String, required: true },
    branch_name: { type: String, required: true },
    address: { type: String, default: '' },
  },
  { _id: false }
);

const PartySchema = new Schema<IParty>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
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
    party_type: {
      type: String,
      enum: ['client', 'agent', 'vendor', 'consignee'],
      required: true,
      default: 'client',
      index: true,
    },
    gst_number: String,
    pan_number: String,
    aadhaar_number: String,
    iec_code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    iec_branches: {
      type: [IECBranchSchema],
      default: [],
    },
    credit_limit: {
      type: Number,
      default: 0,
      min: 0,
    },
    credit_used: {
      type: Number,
      default: 0,
      min: 0,
    },
    payment_terms: {
      type: String,
      enum: ['prepaid', 'credit', 'cod', 'tbb'],
      default: 'prepaid',
    },
    contact_person: String,
    alternate_phone: String,
    // --- New Legacy Fields ---
    bank_details: {
      account_name: { type: String, default: '' },
      account_number: { type: String, default: '' },
      ifsc_code: { type: String, default: '' },
      bank_name: { type: String, default: '' },
      branch_name: { type: String, default: '' },
    },
    credit_days: {
      type: Number,
      default: 0,
    },
    opening_balance: {
      amount: { type: Number, default: 0 },
      type: { type: String, enum: ['debit', 'credit'], default: 'debit' },
      date: { type: Date, default: Date.now },
    },
    tds_config: {
      percentage: { type: Number, default: 0 },
      section: { type: String, default: '' }, // e.g., 194C
    },
    sales_person_id: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    documents: [{
      doc_type: { type: String, required: true }, // GST, PAN, IEC, Other
      doc_number: { type: String, default: '' },
      file_url: { type: String, default: '' },
      expiry_date: Date,
    }],
    // -------------------------
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

PartySchema.index({ email: 1 });
PartySchema.index({ party_type: 1, status: 1 });
PartySchema.index({ iec_code: 1 });
PartySchema.index({ name: 'text' });

export const Party = mongoose.model<IParty>('Party', PartySchema);
