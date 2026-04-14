import mongoose, { Schema, Document } from 'mongoose';
import { ShipmentStatus } from './Shipment';

export interface IOperationStatusUpdate extends Document {
  shipment_id: mongoose.Types.ObjectId;
  previous_status: ShipmentStatus;
  new_status: ShipmentStatus;
  update_date: Date;
  remarks?: string;
  updated_by_id: mongoose.Types.ObjectId;
  branch_id: mongoose.Types.ObjectId;
  created_at: Date;
}

const OperationStatusUpdateSchema = new Schema<IOperationStatusUpdate>(
  {
    shipment_id: {
      type: Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
    },
    previous_status: {
      type: String,
      required: true,
    },
    new_status: {
      type: String,
      required: true,
    },
    update_date: {
      type: Date,
      required: true,
    },
    remarks: String,
    updated_by_id: {
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

OperationStatusUpdateSchema.index({ shipment_id: 1 });

export const OperationStatusUpdate = mongoose.model<IOperationStatusUpdate>(
  'OperationStatusUpdate',
  OperationStatusUpdateSchema
);

