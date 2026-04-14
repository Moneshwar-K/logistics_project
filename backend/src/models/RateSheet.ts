import mongoose, { Schema, Document } from 'mongoose';

export interface IRateRow {
    min_weight: number;
    max_weight: number;
    rate: number;
    zone: string;
}

export interface IRateSheet extends Document {
    name: string;
    type: 'general' | 'client_specific';
    client_id?: mongoose.Schema.Types.ObjectId;
    service_type: 'air' | 'surface' | 'train' | 'express';
    valid_from: Date;
    valid_to?: Date;
    rows: IRateRow[];
    status: 'active' | 'inactive';
    created_at: Date;
    updated_at: Date;
}

const RateSheetSchema: Schema = new Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['general', 'client_specific'], default: 'general' },
    client_id: { type: Schema.Types.ObjectId, ref: 'Party' },
    service_type: { type: String, enum: ['air', 'sea', 'surface', 'train', 'parcel', 'express'], required: true },
    valid_from: { type: Date, required: true, default: Date.now },
    valid_to: { type: Date },
    rows: [{
        min_weight: { type: Number, required: true },
        max_weight: { type: Number, required: true },
        rate: { type: Number, required: true },
        zone: { type: String, required: true }
    }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model<IRateSheet>('RateSheet', RateSheetSchema);
