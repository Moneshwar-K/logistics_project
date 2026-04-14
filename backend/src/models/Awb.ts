import mongoose, { Schema, Document } from 'mongoose';

export interface IAwb extends Document {
    awb_number: string;
    airline: string;
    origin: string;
    destination: string;
    shipment_ids: mongoose.Types.ObjectId[];
    total_weight: number;
    total_pieces: number;
    status: 'open' | 'closed' | 'cancelled';
    issue_date: Date;
    flight_number?: string;
    flight_date?: Date;
    remarks?: string;
    created_by_id: mongoose.Types.ObjectId;
    created_at: Date;
    updated_at: Date;
}

const AwbSchema = new Schema<IAwb>(
    {
        awb_number: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true,
        },
        airline: {
            type: String,
            required: true,
            trim: true,
        },
        origin: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },
        destination: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },
        shipment_ids: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Shipment',
            },
        ],
        total_weight: {
            type: Number,
            default: 0,
            min: 0,
        },
        total_pieces: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: ['open', 'closed', 'cancelled'],
            default: 'open',
        },
        issue_date: {
            type: Date,
            required: true,
        },
        flight_number: String,
        flight_date: Date,
        remarks: String,
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

// Indexes handled in schema
AwbSchema.index({ status: 1 });
AwbSchema.index({ airline: 1 });

export const Awb = mongoose.model<IAwb>('Awb', AwbSchema);
