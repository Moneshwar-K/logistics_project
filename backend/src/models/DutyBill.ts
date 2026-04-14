import mongoose, { Schema, Document } from 'mongoose';

export interface IDutyBill extends Document {
  bill_number: string;
  shipment_ids: mongoose.Types.ObjectId[];
  branch_id?: mongoose.Types.ObjectId;
  invoice_date: Date;
  bill_of_entry_no?: string;

  // Charge Description
  basic_customs_duty: number;
  social_welfare_surcharge: number;
  igst_amount: number;
  other_charge: number;

  // Clearance Charges
  duty_charge: number;
  high_value_charge: number;
  rcmc_igst_charge: number;
  eou_100_charge: number;
  sez_charge: number;
  mepz_charge: number;

  subtotal: number;
  total_amount: number;

  created_by_id?: mongoose.Types.ObjectId;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const DutyBillSchema = new Schema<IDutyBill>(
  {
    bill_number: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    shipment_ids: [{
      type: Schema.Types.ObjectId,
      ref: 'Shipment',
    }],
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
    },
    invoice_date: {
      type: Date,
      required: true,
    },
    bill_of_entry_no: String,

    // Charges
    basic_customs_duty: { type: Number, default: 0 },
    social_welfare_surcharge: { type: Number, default: 0 },
    igst_amount: { type: Number, default: 0 },
    other_charge: { type: Number, default: 0 },

    // Clearance
    duty_charge: { type: Number, default: 0 },
    high_value_charge: { type: Number, default: 0 },
    rcmc_igst_charge: { type: Number, default: 0 },
    eou_100_charge: { type: Number, default: 0 },
    sez_charge: { type: Number, default: 0 },
    mepz_charge: { type: Number, default: 0 },

    subtotal: { type: Number, required: true },
    total_amount: { type: Number, required: true },

    created_by_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

DutyBillSchema.index({ created_at: -1 });

export const DutyBill = mongoose.model<IDutyBill>('DutyBill', DutyBillSchema);
