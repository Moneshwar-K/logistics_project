import mongoose, { Schema, Document } from 'mongoose';

export interface IRate extends Document {
    service_type_id: mongoose.Types.ObjectId;
    origin_zone: string;
    destination_zone: string;
    weight_from: number;
    weight_to: number;
    rate_per_kg: number;
    min_charge: number;
    fuel_surcharge_pct: number;
    ess_charge: number;
    fsc_charge: number;
    handling_charge_per_carton: number;
    effective_from: Date;
    effective_to?: Date;
    status: 'active' | 'inactive';
    created_at: Date;
    updated_at: Date;
}

const RateSchema = new Schema<IRate>(
    {
        service_type_id: {
            type: Schema.Types.ObjectId,
            ref: 'ServiceType',
            required: true,
        },
        origin_zone: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },
        destination_zone: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },
        weight_from: {
            type: Number,
            required: true,
            min: 0,
        },
        weight_to: {
            type: Number,
            required: true,
            min: 0,
        },
        rate_per_kg: {
            type: Number,
            required: true,
            min: 0,
        },
        min_charge: {
            type: Number,
            default: 0,
        },
        fuel_surcharge_pct: {
            type: Number,
            default: 0,
        },
        ess_charge: {
            type: Number,
            default: 0,
        },
        fsc_charge: {
            type: Number,
            default: 0,
        },
        handling_charge_per_carton: {
            type: Number,
            default: 50,
        },
        effective_from: {
            type: Date,
            required: true,
        },
        effective_to: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

RateSchema.index({ service_type_id: 1, origin_zone: 1, destination_zone: 1 });
RateSchema.index({ status: 1 });

export const Rate = mongoose.model<IRate>('Rate', RateSchema);
