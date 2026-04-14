import mongoose, { Schema, Document } from 'mongoose';

export interface IDeliveryRunSheet extends Document {
    drs_number: string; // DRS-BRANCH-DATE-SEQ
    branch_id: Schema.Types.ObjectId;
    driver_id: Schema.Types.ObjectId;
    vehicle_number: string;

    shipment_ids: Schema.Types.ObjectId[];

    status: 'created' | 'out_for_delivery' | 'completed';
    date: Date;

    start_km?: number;
    end_km?: number;

    remarks?: string;
    created_by_id: Schema.Types.ObjectId;
}

const DeliveryRunSheetSchema: Schema = new Schema({
    drs_number: { type: String, required: true, unique: true, index: true },
    branch_id: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    driver_id: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    vehicle_number: { type: String, required: true },

    shipment_ids: [{ type: Schema.Types.ObjectId, ref: 'Shipment' }],

    status: { type: String, enum: ['created', 'out_for_delivery', 'completed'], default: 'created', index: true },
    date: { type: Date, default: Date.now },

    start_km: { type: Number },
    end_km: { type: Number },

    remarks: { type: String },
    created_by_id: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.models.DeliveryRunSheet || mongoose.model<IDeliveryRunSheet>('DeliveryRunSheet', DeliveryRunSheetSchema);
