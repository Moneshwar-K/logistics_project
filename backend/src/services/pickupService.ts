import { PickupRequest } from '../models';
import { getNextSequence } from '../utils/sequenceGenerator';

export const pickupService = {
    // Create new request
    async createPickup(data: any) {
        const pickup_id = await getNextSequence('pickup_request', 'PKP');
        return await PickupRequest.create({
            ...data,
            pickup_id
        });
    },

    // List pickups with filters
    async getPickups(query: any = {}) {
        const { branch_id, status, driver_id, date, page = 1, limit = 20 } = query;
        const filter: any = {};

        if (branch_id) filter.branch_id = branch_id;
        if (status) filter.status = status;
        if (driver_id) filter.driver_id = driver_id;
        if (date) {
            const start = new Date(date); start.setHours(0, 0, 0, 0);
            const end = new Date(date); end.setHours(23, 59, 59, 999);
            filter.pickup_date = { $gte: start, $lte: end };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [data, total] = await Promise.all([
            PickupRequest.find(filter)
                .sort({ pickup_date: 1 }) // Earliest first
                .skip(skip)
                .limit(Number(limit))
                .populate('customer_id', 'name phone')
                .populate('driver_id', 'name phone')
                .lean(),
            PickupRequest.countDocuments(filter)
        ]);

        return { data, total, page: Number(page), limit: Number(limit) };
    },

    // Update details (including assignment)
    async updatePickup(id: string, updates: any) {
        const pickup = await PickupRequest.findByIdAndUpdate(id, updates, { new: true });

        // Auto-update status to assigned if driver added
        if (updates.driver_id && pickup?.status === 'pending') {
            pickup.status = 'assigned';
            await pickup.save();
        }

        return pickup;
    },

    // Mark as picked up (and link shipment if provided)
    async completePickup(id: string, shipmentId?: string) {
        return await PickupRequest.findByIdAndUpdate(id, {
            status: 'picked_up',
            actual_shipment_id: shipmentId
        }, { new: true });
    }
};
