import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceType extends Document {
    code: string;
    name: string;
    description: string;
    mode: 'air' | 'sea' | 'land' | 'rail';
    is_express: boolean;
    transit_days: number;
    status: 'active' | 'inactive';
    created_at: Date;
    updated_at: Date;
}

const ServiceTypeSchema = new Schema<IServiceType>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        mode: {
            type: String,
            enum: ['air', 'sea', 'surface', 'train', 'parcel', 'express'],
            required: true,
        },
        is_express: {
            type: Boolean,
            default: false,
        },
        transit_days: {
            type: Number,
            default: 0,
            min: 0,
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

ServiceTypeSchema.index({ mode: 1 });
ServiceTypeSchema.index({ status: 1 });

export const ServiceType = mongoose.model<IServiceType>('ServiceType', ServiceTypeSchema);
