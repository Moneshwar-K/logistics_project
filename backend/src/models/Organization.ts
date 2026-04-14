import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
    name: string;
    tagline: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    gstin: string;
    pan: string;
    cin: string;
    email: string;
    phone: string;
    website: string;
    logo_url: string;
    proprietor_name: string;
    bank_details?: {
        bank_name: string;
        account_number: string;
        ifsc_code: string;
        branch: string;
    };
    terms_and_conditions: string;
    created_at: Date;
    updated_at: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        tagline: {
            type: String,
            default: '',
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
        country: {
            type: String,
            default: 'India',
        },
        gstin: {
            type: String,
            default: '',
        },
        pan: {
            type: String,
            default: '',
        },
        cin: {
            type: String,
            default: '',
        },
        email: {
            type: String,
            default: '',
        },
        phone: {
            type: String,
            default: '',
        },
        website: {
            type: String,
            default: '',
        },
        logo_url: {
            type: String,
            default: '',
        },
        proprietor_name: {
            type: String,
            default: '',
        },
        bank_details: {
            type: new Schema(
                {
                    bank_name: { type: String, default: '' },
                    account_number: { type: String, default: '' },
                    ifsc_code: { type: String, default: '' },
                    branch: { type: String, default: '' },
                },
                { _id: false }
            ),
            default: null,
        },
        terms_and_conditions: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
