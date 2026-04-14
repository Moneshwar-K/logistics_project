import mongoose, { Schema, Document } from 'mongoose';

export type ShipmentStatus =
  | 'pending'
  | 'picked_up'
  | 'manifested'
  | 'dispatched'
  | 'received_at_hub'
  | 'in_transit'
  | 'in_port'
  | 'received_at_destination'
  | 'customs_clearance'
  | 'ready_for_delivery'
  | 'out_for_delivery'
  | 'delivered'
  | 'on_hold'
  | 'cancelled'
  | 'exception'
  | 'out_for_pickup'
  | 'duty_billed';

export interface IShipment extends Document {
  hawb: string;
  awb?: string;
  shipper_id: mongoose.Types.ObjectId;
  consignee_id: mongoose.Types.ObjectId;
  origin_city: string;
  origin_country: string;
  destination_city: string;
  destination_country: string;
  service_type: 'air' | 'sea' | 'land' | 'parcel';
  shipment_type: 'document' | 'parcel' | 'cargo';
  total_cartons: number;
  total_weight: number;
  total_weight_cbm?: number;
  package_type?: string; // Type of packaging: CARTON, BUNDLE, PALLET, etc.
  goods_description?: string; // Description of goods being shipped
  invoice_value: number;
  invoice_currency: string;
  status: ShipmentStatus;
  current_location?: string;
  estimated_delivery_date?: Date;
  actual_delivery_date?: Date;
  last_tracking_update?: Date;
  mode: 'air' | 'sea' | 'land';
  carrier?: string;
  reference_number?: string;
  branch_id: mongoose.Types.ObjectId;
  current_branch_id?: mongoose.Types.ObjectId; // Track where it currently is
  created_by_id: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const ShipmentSchema = new Schema<IShipment>(
  {
    hawb: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    awb: String,
    shipper_id: {
      type: Schema.Types.ObjectId,
      ref: 'Party',
      required: true,
    },
    consignee_id: {
      type: Schema.Types.ObjectId,
      ref: 'Party',
      required: true,
    },
    origin_city: {
      type: String,
      required: true,
    },
    origin_country: {
      type: String,
      required: true,
    },
    destination_city: {
      type: String,
      required: true,
    },
    destination_country: {
      type: String,
      required: true,
    },
    service_type: {
      type: String,
      enum: ['air', 'sea', 'surface', 'train', 'parcel', 'express'],
      required: true,
    },
    shipment_type: {
      type: String,
      enum: ['document', 'parcel', 'cargo'],
      required: true,
    },
    total_cartons: {
      type: Number,
      required: true,
      min: 1,
    },
    total_weight: {
      type: Number,
      required: true,
      min: 0.1,
    },
    total_weight_cbm: Number,
    package_type: {
      type: String,
      default: 'CARTON',
    },
    goods_description: {
      type: String,
      default: '',
    },
    invoice_value: {
      type: Number,
      required: true,
      min: 0,
    },
    invoice_currency: {
      type: String,
      default: 'INR',
      maxlength: 3,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'picked_up',
        'manifested',
        'dispatched',
        'received_at_hub',
        'in_transit',
        'in_port',
        'received_at_destination',
        'customs_clearance',
        'ready_for_delivery',
        'out_for_delivery',
        'delivered',
        'on_hold',
        'cancelled',
        'exception',
        'out_for_pickup',
        'duty_billed',
      ],
      default: 'pending',
      index: true,
    },
    current_location: String,
    estimated_delivery_date: Date,
    actual_delivery_date: Date,
    last_tracking_update: Date,
    mode: {
      type: String,
      enum: ['air', 'sea', 'surface', 'train', 'parcel', 'express'],
      required: true,
    },
    carrier: String,
    reference_number: String,
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    current_branch_id: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
    },
    created_by_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes
// Indexes
// ShipmentSchema.index({ hawb: 1 }); // Defined in schema
// ShipmentSchema.index({ status: 1 }); // Defined in schema
ShipmentSchema.index({ branch_id: 1 });
ShipmentSchema.index({ created_at: -1 });
ShipmentSchema.index({ shipper_id: 1 });
ShipmentSchema.index({ consignee_id: 1 });

export const Shipment = mongoose.model<IShipment>('Shipment', ShipmentSchema);

