import mongoose, { Schema, Document } from 'mongoose';

export interface IPOD extends Document {
  shipment_id: mongoose.Types.ObjectId;
  receiver_name: string;
  receiver_contact: string;
  receiver_address: string;
  delivery_date: Date;
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
  created_by_id: mongoose.Types.ObjectId;
  branch_id: mongoose.Types.ObjectId;
  created_at: Date;
}

const PODSchema = new Schema<IPOD>(
  {
    shipment_id: {
      type: Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
      unique: true,
      index: true,
    },
    receiver_name: {
      type: String,
      required: true,
    },
    receiver_contact: {
      type: String,
      required: true,
    },
    receiver_address: {
      type: String,
      required: true,
    },
    delivery_date: {
      type: Date,
      required: true,
    },
    delivery_time: {
      type: String,
      required: true,
    },
    acceptance_checklist: {
      package_intact: { type: Boolean, required: true },
      seals_intact: { type: Boolean, required: true },
      no_damage: { type: Boolean, required: true },
      weight_verified: { type: Boolean, required: true },
      cartons_verified: { type: Boolean, required: true },
    },
    signature_url: {
      type: String,
      required: true,
    },
    company_stamp_url: String,
    remarks: String,
    created_by_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

// Indexes handled in schema

export const POD = mongoose.model<IPOD>('POD', PODSchema);

