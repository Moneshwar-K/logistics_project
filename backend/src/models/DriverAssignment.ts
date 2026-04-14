import mongoose, { Schema, Document } from 'mongoose';

export interface IDriverAssignment extends Document {
  driver_id: mongoose.Types.ObjectId;
  shipment_id: mongoose.Types.ObjectId;
  assigned_date: Date;
  assigned_by_id: mongoose.Types.ObjectId;
  status: 'assigned' | 'in_progress' | 'completed' | 'exception';
  current_location?: string;
  eta?: Date;
  completed_date?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const DriverAssignmentSchema = new Schema<IDriverAssignment>(
  {
    driver_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    shipment_id: {
      type: Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
      index: true,
    },
    assigned_date: {
      type: Date,
      required: true,
    },
    assigned_by_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'completed', 'exception'],
      default: 'assigned',
      index: true,
    },
    current_location: String,
    eta: Date,
    completed_date: Date,
    notes: String,
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes handled in schema

export const DriverAssignment = mongoose.model<IDriverAssignment>(
  'DriverAssignment',
  DriverAssignmentSchema
);

