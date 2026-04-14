import mongoose, { Schema, Document } from 'mongoose';

export interface ISequence extends Document {
    name: string;
    prefix: string;
    current_value: number;
    year: number;
    created_at: Date;
    updated_at: Date;
}

const sequenceSchema = new Schema<ISequence>({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    prefix: {
        type: String,
        required: true,
    },
    current_value: {
        type: Number,
        required: true,
        default: 0,
    },
    year: {
        type: Number,
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});

sequenceSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});

export const Sequence = mongoose.model<ISequence>('Sequence', sequenceSchema);
