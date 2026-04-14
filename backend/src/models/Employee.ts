import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
    employee_code: string;
    name: string;
    email: string;
    phone: string;
    designation: string;
    department: string;
    branch_id: mongoose.Types.ObjectId;
    date_of_joining: Date;
    address: string;
    city: string;
    state: string;
    pincode: string;
    aadhaar_number?: string;
    pan_number?: string;
    bank_details?: {
        bank_name: string;
        account_number: string;
        ifsc_code: string;
    };
    salary?: number;
    user_id?: mongoose.Types.ObjectId;
    status: 'active' | 'inactive';
    created_at: Date;
    updated_at: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
    {
        employee_code: {
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
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
        },
        designation: {
            type: String,
            required: true,
        },
        department: {
            type: String,
            required: true,
        },
        branch_id: {
            type: Schema.Types.ObjectId,
            ref: 'Branch',
            required: true,
        },
        date_of_joining: {
            type: Date,
            required: true,
        },
        address: {
            type: String,
            default: '',
        },
        city: {
            type: String,
            default: '',
        },
        state: {
            type: String,
            default: '',
        },
        pincode: {
            type: String,
            default: '',
        },
        aadhaar_number: String,
        pan_number: String,
        bank_details: {
            type: new Schema(
                {
                    bank_name: { type: String, default: '' },
                    account_number: { type: String, default: '' },
                    ifsc_code: { type: String, default: '' },
                },
                { _id: false }
            ),
            default: null,
        },
        salary: {
            type: Number,
            default: 0,
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
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

// Indexes handled in schema
EmployeeSchema.index({ name: 'text' });

export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);
