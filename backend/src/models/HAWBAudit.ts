import mongoose, { Schema, Document } from 'mongoose';

export interface IHAWBAudit extends Document {
  hawb: string;
  shipment_id: mongoose.Types.ObjectId;
  audit_status: 'pending' | 'in_progress' | 'completed' | 'discrepancy_found';
  audit_date: Date;
  audited_by_id: mongoose.Types.ObjectId;
  total_cartons: number;
  cartons_verified: number;
  weight_variance: number;
  remarks?: string;
  discrepancies: string[];
  balance_amount: number;
  branch_id: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const HAWBAuditSchema = new Schema<IHAWBAudit>(
  {
    hawb: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    shipment_id: {
      type: Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
    },
    audit_status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'discrepancy_found'],
      default: 'pending',
      index: true,
    },
    audit_date: {
      type: Date,
      required: true,
    },
    audited_by_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    total_cartons: {
      type: Number,
      required: true,
      min: 1,
    },
    cartons_verified: {
      type: Number,
      default: 0,
      min: 0,
    },
    weight_variance: {
      type: Number,
      default: 0,
    },
    remarks: String,
    discrepancies: {
      type: [String],
      default: [],
    },
    balance_amount: {
      type: Number,
      default: 0,
    },
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes handled in schema

export const HAWBAudit = mongoose.model<IHAWBAudit>('HAWBAudit', HAWBAuditSchema);

