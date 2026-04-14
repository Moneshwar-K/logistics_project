import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
    user_id: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: 'shipment' | 'invoice' | 'pod' | 'payment' | 'system';
    reference_id?: mongoose.Types.ObjectId;
    is_read: boolean;
    created_at: Date;
}

const NotificationSchema = new Schema<INotification>({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['shipment', 'invoice', 'pod', 'payment', 'system'],
        required: true,
    },
    reference_id: { type: Schema.Types.ObjectId },
    is_read: { type: Boolean, default: false, index: true },
    created_at: { type: Date, default: Date.now },
});

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
