import mongoose, { Schema, Document } from 'mongoose';

export interface IPickupRequest extends Document {
    pickup_id: string; // Unique
    customer_id: Schema.Types.ObjectId; // Link to Party (shipper)
    branch_id: Schema.Types.ObjectId; // Origin branch
    pickup_date: Date;
    time_slot: string; // "10:00 AM - 12:00 PM"

    // Location
    address: string;
    city: string;
    pincode: string;
    contact_person: string;
    contact_phone: string;

    // Cargo Details
    estimated_weight: number;
    estimated_pieces: number;
    description: string;

    // Assignment
    driver_id?: Schema.Types.ObjectId; // Link to Employee (Role: Driver)
    vehicle_number?: string;

    status: 'pending' | 'assigned' | 'picked_up' | 'cancelled';
    actual_shipment_id?: Schema.Types.ObjectId; // Link to created shipment once picked up

    remarks?: string;
    created_at: Date;
    updated_at: Date;
}

const PickupRequestSchema: Schema = new Schema({
    pickup_id: { type: String, required: true, unique: true, index: true },
    customer_id: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
    branch_id: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    pickup_date: { type: Date, required: true },
    time_slot: { type: String, required: true },

    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    contact_person: { type: String, required: true },
    contact_phone: { type: String, required: true },

    estimated_weight: { type: Number, required: true },
    estimated_pieces: { type: Number, required: true },
    description: { type: String },

    driver_id: { type: Schema.Types.ObjectId, ref: 'Employee' },
    vehicle_number: { type: String },

    status: { type: String, enum: ['pending', 'assigned', 'picked_up', 'cancelled'], default: 'pending', index: true },
    actual_shipment_id: { type: Schema.Types.ObjectId, ref: 'Shipment' },

    remarks: { type: String },
}, { timestamps: true });

// Check if model already exists to prevent overwrite error in hot reload
export default mongoose.models.PickupRequest || mongoose.model<IPickupRequest>('PickupRequest', PickupRequestSchema);
