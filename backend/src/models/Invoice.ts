import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  invoice_number: string;
  bill_number?: string; // Manual/Official bill number
  shipment_id: mongoose.Types.ObjectId;
  billed_party_id: mongoose.Types.ObjectId;
  branch_id?: mongoose.Types.ObjectId;
  invoice_date: Date;
  due_date: Date;

  // Amounts
  subtotal: number;
  tax_percentage: number;
  tax_amount: number;
  igst: number;
  cgst: number;
  sgst: number;
  total_amount: number;
  currency: string;

  // Payment
  payment_status: 'pending' | 'paid' | 'overdue' | 'partial' | 'cancelled';
  paid_amount: number;
  balance_amount: number;
  payment_date?: Date;
  payment_method?: 'bank_transfer' | 'cheque' | 'credit_card' | 'cash';
  last_payment_date?: Date;

  // Meta
  created_by_id?: mongoose.Types.ObjectId;
  notes?: string;
  pdf_url?: string;
  created_at: Date;
  updated_at: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoice_number: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    bill_number: {
      type: String,
      index: true, // For searching manual bills
    },
    shipment_id: {
      type: Schema.Types.ObjectId,
      ref: 'Shipment',
      required: false, // Changed to false for bulk support
      index: true,
    },
    shipment_ids: [{
      type: Schema.Types.ObjectId,
      ref: 'Shipment',
    }],
    billed_party_id: {
      type: Schema.Types.ObjectId,
      ref: 'Party',
      required: true,
    },
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
    },
    invoice_date: {
      type: Date,
      required: true,
    },
    due_date: {
      type: Date,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax_percentage: {
      type: Number,
      default: 18,
    },
    tax_amount: {
      type: Number,
      required: true,
      min: 0,
    },
    igst: {
      type: Number,
      default: 0,
    },
    cgst: {
      type: Number,
      default: 0,
    },
    sgst: {
      type: Number,
      default: 0,
    },
    total_amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      maxlength: 3,
    },
    payment_status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'partial', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paid_amount: {
      type: Number,
      default: 0,
    },
    balance_amount: {
      type: Number,
      default: 0,
    },
    payment_date: Date,
    last_payment_date: Date,
    payment_method: {
      type: String,
      enum: ['bank_transfer', 'cheque', 'credit_card', 'cash'],
    },
    created_by_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
    pdf_url: String,
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes
// InvoiceSchema.index({ invoice_number: 1 }); // Defined in schema
// InvoiceSchema.index({ shipment_id: 1 }); // Defined in schema
// InvoiceSchema.index({ payment_status: 1 }); // Defined in schema
InvoiceSchema.index({ created_at: -1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
