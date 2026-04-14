import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export type DocumentType =
  | 'awb'
  | 'hawb'
  | 'invoice'
  | 'packing_list'
  | 'pod'
  | 'kyc'
  | 'signature'
  | 'customs_declaration'
  | 'insurance_certificate'
  | 'bill_of_lading';

export interface IDocument extends MongooseDocument {
  shipment_id: mongoose.Types.ObjectId;
  document_type: DocumentType;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: Date;
  uploaded_by_id: mongoose.Types.ObjectId;
  created_at: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    shipment_id: {
      type: Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
      index: true,
    },
    document_type: {
      type: String,
      enum: [
        'awb',
        'hawb',
        'invoice',
        'packing_list',
        'pod',
        'kyc',
        'signature',
        'customs_declaration',
        'insurance_certificate',
        'bill_of_lading',
      ],
      required: true,
      index: true,
    },
    file_url: {
      type: String,
      required: true,
    },
    file_name: {
      type: String,
      required: true,
    },
    file_size: {
      type: Number,
      required: true,
    },
    mime_type: {
      type: String,
      required: true,
    },
    uploaded_at: {
      type: Date,
      default: Date.now,
    },
    uploaded_by_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

// Indexes handled in schema

export const Document = mongoose.model<IDocument>('Document', DocumentSchema);

