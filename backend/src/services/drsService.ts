import DeliveryRunSheet from '../models/DeliveryRunSheet';
import { Shipment } from '../models';
import { getNextSequence } from '../utils/sequenceGenerator';
import mongoose from 'mongoose';

export const drsService = {
    // Create DRS
    async createDRS(data: any) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const drs_number = await getNextSequence('drs', 'DRS');

            const drs = new DeliveryRunSheet({
                ...data,
                drs_number,
                status: 'created'
            });

            await drs.save({ session });

            // Update shipments status? Maybe just assign them to DRS for now.
            // Usually status changes to 'out_for_delivery' when DRS is marked as such.

            await session.commitTransaction();
            return drs;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    },

    async getDRS(query: any = {}) {
        const { branch_id, status, date, driver_id, page = 1, limit = 20 } = query;
        const filter: any = {};
        if (branch_id) filter.branch_id = branch_id;
        if (status) filter.status = status;
        if (driver_id) filter.driver_id = driver_id;

        const skip = (Number(page) - 1) * Number(limit);
        const [data, total] = await Promise.all([
            DeliveryRunSheet.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate('driver_id', 'name phone')
                .lean(),
            DeliveryRunSheet.countDocuments(filter)
        ]);
        return { data, total, page: Number(page), limit: Number(limit) };
    },

    async getDRSById(id: string) {
        return await DeliveryRunSheet.findById(id)
            .populate('driver_id')
            .populate('shipment_ids')
            .lean();
    },

    async markOutForDelivery(id: string) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const drs = await DeliveryRunSheet.findByIdAndUpdate(id, { status: 'out_for_delivery' }, { new: true, session });
            if (!drs) throw new Error('DRS not found');

            // Update all shipments
            await Shipment.updateMany(
                { _id: { $in: drs.shipment_ids } },
                { $set: { status: 'out_for_delivery' } },
                { session }
            );

            await session.commitTransaction();
            return drs;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
};
