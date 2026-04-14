import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password_hash?: string;
  name: string;
  role: 'admin' | 'operations' | 'customer' | 'driver' | 'finance';
  branch_id?: mongoose.Types.ObjectId;
  status: 'active' | 'inactive';
  phone?: string;
  vehicle_number?: string;
  license_number?: string;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'operations', 'customer', 'driver', 'finance'],
      required: true,
    },
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    phone: String,
    vehicle_number: String,
    license_number: String,
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexed definitions are handled in schema

export const User = mongoose.model<IUser>('User', UserSchema);

