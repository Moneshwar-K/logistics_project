import mongoose, { Schema, Document } from 'mongoose';

export interface IPODUpload extends Document {
  shipment_id: mongoose.Types.ObjectId;
  pod_file_url?: string;
  signature_file_url?: string;
  kyc_front_url?: string;
  kyc_back_url?: string;
  uploaded_at: Date;
  uploaded_by_id: mongoose.Types.ObjectId;
  status: 'pending' | 'verified' | 'rejected';
  created_at: Date;
}

const PODUploadSchema = new Schema<IPODUpload>(
  {
    shipment_id: {
      type: Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
    },
    pod_file_url: String,
    signature_file_url: String,
    kyc_front_url: String,
    kyc_back_url: String,
    uploaded_at: {
      type: Date,
      default: Date.now,
    },
    uploaded_by_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

PODUploadSchema.index({ shipment_id: 1 });

export const PODUpload = mongoose.model<IPODUpload>('PODUpload', PODUploadSchema);

