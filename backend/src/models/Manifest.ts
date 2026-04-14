import mongoose, { Schema, Document } from 'mongoose';

export interface IManifest extends Document {
    manifest_number: string; // MAN-ORG-DEST-DATE-SEQ
    origin_branch_id: Schema.Types.ObjectId;
    destination_branch_id: Schema.Types.ObjectId; // Could be another branch or a warehouse/hub
    destination_type: 'branch' | 'warehouse' | 'hub';

    shipment_ids: Schema.Types.ObjectId[]; // List of shipments included

    driver_name: string;
    vehicle_number: string;
    contact_number: string;

    total_weight: number;
    total_pieces: number;
    total_shipments: number;

    status: 'created' | 'dispatched' | 'received';
    dispatch_date: Date;
    received_date?: Date;

    remarks?: string;
    created_by_id: Schema.Types.ObjectId;
}

const ManifestSchema: Schema = new Schema({
    manifest_number: { type: String, required: true, unique: true }, // Index handled by unique
    origin_branch_id: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    destination_branch_id: { type: Schema.Types.ObjectId, ref: 'Branch', required: true }, // Or Warehouse model
    destination_type: { type: String, enum: ['branch', 'warehouse', 'hub'], default: 'branch' },

    shipment_ids: [{ type: Schema.Types.ObjectId, ref: 'Shipment' }],

    driver_name: { type: String, required: true },
    vehicle_number: { type: String, required: true },
    contact_number: { type: String },

    total_weight: { type: Number, default: 0 },
    total_pieces: { type: Number, default: 0 },
    total_shipments: { type: Number, default: 0 },

    status: { type: String, enum: ['created', 'dispatched', 'received'], default: 'created' }, // Index if needed
    dispatch_date: { type: Date, default: Date.now },
    received_date: { type: Date },

    remarks: { type: String },
    created_by_id: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.models.Manifest || mongoose.model<IManifest>('Manifest', ManifestSchema);
