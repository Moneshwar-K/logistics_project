import { Rate, IRate } from '../models/Rate';
import { createError } from '../middleware/errorHandler';

interface RateFilter {
    service_type_id?: string;
    origin_zone?: string;
    destination_zone?: string;
    status?: string;
}

interface RateLookupParams {
    service_type_id: string;
    origin_zone: string;
    destination_zone: string;
    weight: number;
}

export const rateService = {
    // Create rate
    async createRate(rateData: Partial<IRate>): Promise<IRate> {
        // Check for overlap
        const existing = await Rate.findOne({
            service_type_id: rateData.service_type_id,
            origin_zone: rateData.origin_zone,
            destination_zone: rateData.destination_zone,
            status: 'active',
            $or: [
                {
                    weight_from: { $lte: rateData.weight_to },
                    weight_to: { $gte: rateData.weight_from }
                }
            ]
        });

        if (existing) {
            throw createError('Rate range overlaps with existing active rate', 400);
        }

        const rate = new Rate(rateData);
        return await rate.save();
    },

    // List rates with filtering and pagination
    async listRates(
        filters: RateFilter,
        page: number = 1,
        limit: number = 10
    ) {
        const query: any = {};

        if (filters.service_type_id) query.service_type_id = filters.service_type_id;
        if (filters.origin_zone) query.origin_zone = filters.origin_zone;
        if (filters.destination_zone) query.destination_zone = filters.destination_zone;
        if (filters.status) query.status = filters.status;

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            Rate.find(query)
                .populate('service_type_id', 'name code mode')
                .sort({ origin_zone: 1, destination_zone: 1, weight_from: 1 })
                .skip(skip)
                .limit(limit)
                .lean<IRate[]>(),
            Rate.countDocuments(query)
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

    // Get single rate
    async getRateById(id: string): Promise<IRate> {
        const rate = await Rate.findById(id).populate('service_type_id', 'name code mode').lean<IRate>();
        if (!rate) throw createError('Rate not found', 404);
        return rate as unknown as IRate;
    },

    // Update rate
    async updateRate(id: string, updateData: Partial<IRate>): Promise<IRate> {
        const rate = await Rate.findByIdAndUpdate(id, updateData, { new: true })
            .populate('service_type_id', 'name code mode')
            .lean<IRate>();

        if (!rate) throw createError('Rate not found', 404);
        return rate as unknown as IRate;
    },

    // Delete rate (soft delete sets status to inactive)
    async deleteRate(id: string): Promise<void> {
        const rate = await Rate.findByIdAndUpdate(id, { status: 'inactive' }, { new: true });
        if (!rate) throw createError('Rate not found', 404);
    },

    // Lookup rate for a shipment
    async lookupRate(params: RateLookupParams): Promise<IRate | null> {
        // Find matching rate slab
        const rate = await Rate.findOne({
            service_type_id: params.service_type_id,
            origin_zone: params.origin_zone,
            destination_zone: params.destination_zone,
            status: 'active',
            weight_from: { $lte: params.weight },
            weight_to: { $gte: params.weight }
        }).populate('service_type_id', 'name code mode').lean<IRate>();

        return rate as unknown as IRate | null;
    }
};
