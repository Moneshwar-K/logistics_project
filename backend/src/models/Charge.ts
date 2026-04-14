import mongoose, { Schema, Document } from 'mongoose';

export interface ICharge extends Document {
  shipment_id?: mongoose.Types.ObjectId; // Optional now, as it might just be linked to invoice
  invoice_id?: mongoose.Types.ObjectId;  // Link to invoice
  description: string;                   // Description of the charge
  charge_type: string;                   // freight, fuel, handling, tax, etc.
  hsn_code?: string;
  quantity: number;
  unit_price: number;
  amount: number;
  currency: string;
  created_at: Date;
}

const ChargeSchema = new Schema<ICharge>(
  {
    shipment_id: {
      type: Schema.Types.ObjectId,
      ref: 'Shipment',
    },
    invoice_id: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    charge_type: {
      type: String,
      required: true,
    },
    hsn_code: String,
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    unit_price: {
      type: Number,
      required: true,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      maxlength: 3,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

ChargeSchema.index({ shipment_id: 1 });

export const Charge = mongoose.model<ICharge>('Charge', ChargeSchema);
