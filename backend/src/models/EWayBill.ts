import mongoose, { Schema, Document } from 'mongoose';

export type EWayBillStatus = 'generated' | 'in_transit' | 'delivered' | 'expired' | 'cancelled';

export interface IEWayBill extends Document {
  eway_bill_number: string;
  shipment_id: mongoose.Types.ObjectId;
  consignor_gstin: string;
  consignee_gstin: string;
  total_invoice_value: number;
  vehicle_number: string;
  transporter_id?: string;
  status: EWayBillStatus;
  generated_date: Date;
  valid_from: Date;
  valid_till: Date;
  cancelled_date?: Date;
  cancelled_reason?: string;
  remarks?: string;
  created_at: Date;
  updated_at: Date;
}

const EWayBillSchema = new Schema<IEWayBill>(
  {
    eway_bill_number: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    shipment_id: {
      type: Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
      index: true,
    },
    consignor_gstin: {
      type: String,
      required: true,
      maxlength: 15,
      minlength: 15,
    },
    consignee_gstin: {
      type: String,
      required: true,
      maxlength: 15,
      minlength: 15,
    },
    total_invoice_value: {
      type: Number,
      required: true,
      min: 0,
    },
    vehicle_number: {
      type: String,
      required: true,
    },
    transporter_id: String,
    status: {
      type: String,
      enum: ['generated', 'in_transit', 'delivered', 'expired', 'cancelled'],
      default: 'generated',
      index: true,
    },
    generated_date: {
      type: Date,
      required: true,
    },
    valid_from: {
      type: Date,
      required: true,
    },
    valid_till: {
      type: Date,
      required: true,
    },
    cancelled_date: Date,
    cancelled_reason: String,
    remarks: String,
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes handled in schema

export const EWayBill = mongoose.model<IEWayBill>('EWayBill', EWayBillSchema);

