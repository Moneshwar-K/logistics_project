import { Manifest, Shipment } from '../models';
import { getNextSequence } from '../utils/sequenceGenerator';
import mongoose from 'mongoose';

export const manifestService = {
    // Create manifest
    async createManifest(data: any) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // Generate ID
            const manifest_number = await getNextSequence('manifest', 'MAN');

            // Calculate totals from shipments
            const shipments = await Shipment.find({ _id: { $in: data.shipment_ids } }).session(session);
            const total_weight = shipments.reduce((sum, s) => sum + (s.total_weight || 0), 0);
            const total_pieces = shipments.reduce((sum, s) => sum + (s.total_cartons || 0), 0); // Assuming cartons = pieces

            const manifest = new Manifest({
                ...data,
                manifest_number,
                total_weight,
                total_pieces,
                total_shipments: shipments.length,
                status: 'created'
            });

            await manifest.save({ session });

            // Update shipments status to 'manifested' or similar? 
            // Typically 'dispatched' happens when manifest is dispatched. 
            // For now, let's just mark them as 'in_transit' or 'manifested' if we had that status.
            // Let's stick to updating current_status to 'manifested'
            await Shipment.updateMany(
                { _id: { $in: data.shipment_ids } },
                { $set: { status: 'manifested', current_branch_id: null } }, // Leaving branch?
                { session }
            );

            await session.commitTransaction();
            return manifest;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    },

    async getManifests(query: any = {}) {
        const { origin_id, destination_id, status, date, page = 1, limit = 20 } = query;
        const filter: any = {};
        if (origin_id) filter.origin_branch_id = origin_id;
        if (destination_id) filter.destination_branch_id = destination_id;
        if (status) filter.status = status;

        const skip = (Number(page) - 1) * Number(limit);
        const [data, total] = await Promise.all([
            Manifest.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate('origin_branch_id', 'name')
                .populate('destination_branch_id', 'name')
                .lean(),
            Manifest.countDocuments(filter)
        ]);
        return { data, total, page, limit };
    },

    async getManifestById(id: string) {
        return await Manifest.findById(id)
            .populate('origin_branch_id')
            .populate('destination_branch_id')
            .populate('shipment_ids') // Load full shipment details
            .lean();
    },

    async dispatchManifest(id: string) {
        // Mark as dispatched
        const manifest = await Manifest.findByIdAndUpdate(id, { status: 'dispatched', dispatch_date: new Date() }, { new: true });
        // Update shipments to 'in_transit'
        if (manifest) {
            await Shipment.updateMany(
                { _id: { $in: manifest.shipment_ids } },
                { $set: { status: 'in_transit' } }
            );
        }
        return manifest;
    },

    async receiveManifest(id: string) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const manifest = await Manifest.findByIdAndUpdate(id, {
                status: 'received',
                received_date: new Date()
            }, { new: true, session });

            if (!manifest) throw new Error('Manifest not found');

            // Update shipments: status -> received_at_destination, current_branch -> destination
            await Shipment.updateMany(
                { _id: { $in: manifest.shipment_ids } },
                {
                    $set: {
                        status: 'received_at_destination',
                        current_branch_id: manifest.destination_branch_id
                    }
                },
                { session }
            );

            await session.commitTransaction();
            return manifest;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
};
