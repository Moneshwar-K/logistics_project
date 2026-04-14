import mongoose, { Schema, Document } from 'mongoose';
import { ShipmentStatus } from './Shipment';

export interface ITrackingEvent extends Document {
  shipment_id: mongoose.Types.ObjectId;
  status: ShipmentStatus;
  location: string;
  city: string;
  country: string;
  timestamp: Date;
  scanned_by: string;
  remarks?: string;
  condition?: 'intact' | 'damaged' | 'partial_damage';
  proof_of_delivery_url?: string;
  created_at: Date;
}

const TrackingEventSchema = new Schema<ITrackingEvent>(
  {
    shipment_id: {
      type: Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'picked_up',
        'in_transit',
        'in_port',
        'customs_clearance',
        'ready_for_delivery',
        'out_for_delivery',
        'delivered',
        'on_hold',
        'cancelled',
        'exception',
      ],
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      // index: true, // Composite index defined below
    },
    scanned_by: {
      type: String,
      required: true,
    },
    remarks: String,
    condition: {
      type: String,
      enum: ['intact', 'damaged', 'partial_damage'],
    },
    proof_of_delivery_url: String,
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

TrackingEventSchema.index({ shipment_id: 1, timestamp: -1 });

export const TrackingEvent = mongoose.model<ITrackingEvent>('TrackingEvent', TrackingEventSchema);

