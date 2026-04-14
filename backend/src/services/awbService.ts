import { Awb, IAwb } from '../models/Awb';
import { Shipment } from '../models/Shipment';
import { createError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

interface AwbFilter {
    status?: string;
    airline?: string;
    awb_number?: string;
}

export const awbService = {
    // Create AWB
    async createAwb(awbData: Partial<IAwb>): Promise<IAwb> {
        // Check if duplicate
        const existing = await Awb.findOne({ awb_number: awbData.awb_number });
        if (existing) {
            throw createError('AWB number already exists', 400);
        }

        const awb = new Awb(awbData);
        return await awb.save();
    },

    // List AWBs
    async listAwbs(
        filters: AwbFilter,
        page: number = 1,
        limit: number = 10
    ) {
        const query: any = {};

        if (filters.status) query.status = filters.status;
        if (filters.airline) query.airline = { $regex: filters.airline, $options: 'i' };
        if (filters.awb_number) query.awb_number = { $regex: filters.awb_number, $options: 'i' };

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            Awb.find(query)
                .populate('shipment_ids', 'hawb total_weight total_cartons destination_city')
                .populate('created_by_id', 'name email')
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean<IAwb[]>(),
            Awb.countDocuments(query)
        ]);

        return {
            data: data as any,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    },

    // Get AWB by ID
    async getAwbById(id: string): Promise<IAwb> {
        const awb = await Awb.findById(id)
            .populate('shipment_ids')
            .populate('created_by_id', 'name email')
            .lean<IAwb>();

        if (!awb) throw createError('AWB not found', 404);
        return awb as unknown as IAwb;
    },

    // Get AWB by Number
    async getAwbByNumber(awbNumber: string): Promise<IAwb> {
        const awb = await Awb.findOne({ awb_number: awbNumber })
            .populate('shipment_ids')
            .populate('created_by_id', 'name email')
            .lean<IAwb>();

        if (!awb) throw createError('AWB not found', 404);
        return awb as unknown as IAwb;
    },

    // Update AWB
    async updateAwb(id: string, updateData: Partial<IAwb>): Promise<IAwb> {
        const awb = await Awb.findByIdAndUpdate(id, updateData, { new: true })
            .populate('shipment_ids')
            .lean<IAwb>();

        if (!awb) throw createError('AWB not found', 404);
        return awb as unknown as IAwb;
    },

    // Add Shipments to AWB
    async addShipmentsToAwb(awbId: string, shipmentIds: string[]): Promise<IAwb> {
        const awb = await Awb.findById(awbId);
        if (!awb) throw createError('AWB not found', 404);

        // Validate shipments exist and are not already assigned to another open AWB?
        // For now just check existence
        const shipments = await Shipment.find({ _id: { $in: shipmentIds } });
        if (shipments.length !== shipmentIds.length) {
            throw createError('One or more shipments not found', 400);
        }

        // Add unique shipment IDs
        const currentIds = awb.shipment_ids.map(id => id.toString());
        const newIds = shipmentIds.filter(id => !currentIds.includes(id));

        if (newIds.length === 0) {
            return awb as IAwb; // Nothing to add
        }

        // Update AWB
        awb.shipment_ids.push(...newIds.map(id => new mongoose.Types.ObjectId(id)));

        // Recalculate totals
        let totalWeight = awb.total_weight;
        let totalPieces = awb.total_pieces;

        for (const shipment of shipments) {
            if (newIds.includes(shipment._id.toString())) {
                totalWeight += shipment.total_weight || 0;
                totalPieces += shipment.total_cartons || 0;

                // Update shipment with AWB reference
                await Shipment.findByIdAndUpdate(shipment._id, { awb: awb.awb_number });
            }
        }

        awb.total_weight = totalWeight;
        awb.total_pieces = totalPieces;

        await awb.save();

        return await this.getAwbById(awbId); // Return populated
    },

    // Remove Shipment from AWB
    async removeShipmentFromAwb(awbId: string, shipmentId: string): Promise<IAwb> {
        const awb = await Awb.findById(awbId);
        if (!awb) throw createError('AWB not found', 404);

        // Check if shipment is in AWB
        const index = awb.shipment_ids.findIndex(id => id.toString() === shipmentId);
        if (index === -1) throw createError('Shipment not linked to this AWB', 400);

        // Remove from array
        awb.shipment_ids.splice(index, 1);

        // Update totals
        const shipment = await Shipment.findById(shipmentId);
        if (shipment) {
            awb.total_weight = Math.max(0, awb.total_weight - (shipment.total_weight || 0));
            awb.total_pieces = Math.max(0, awb.total_pieces - (shipment.total_cartons || 0));

            // Clear AWB ref from shipment
            await Shipment.findByIdAndUpdate(shipmentId, { $unset: { awb: 1 } });
        }

        await awb.save();
        return await this.getAwbById(awbId);
    }
};
