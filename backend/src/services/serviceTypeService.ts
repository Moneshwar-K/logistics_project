import { createError } from '../middleware/errorHandler';
import { ServiceType, IServiceType } from '../models';

export const serviceTypeService = {
    async listServiceTypes(filters: {
        mode?: string;
        status?: string;
        page?: number;
        limit?: number;
    } = {}): Promise<{ data: IServiceType[]; total: number; page: number; limit: number }> {
        const { mode, status = 'active', page = 1, limit = 50 } = filters;
        const query: any = {};

        if (mode) query.mode = mode;
        if (status) query.status = status;

        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            ServiceType.find(query).sort({ code: 1 }).skip(skip).limit(limit).lean<IServiceType[]>(),
            ServiceType.countDocuments(query),
        ]);

        return { data: data as unknown as IServiceType[], total, page, limit };
    },

    async getServiceType(id: string): Promise<IServiceType> {
        const serviceType = await ServiceType.findById(id).lean<IServiceType>();
        if (!serviceType) throw createError('Service type not found', 404);
        return serviceType as unknown as IServiceType;
    },

    async createServiceType(data: Partial<IServiceType>): Promise<IServiceType> {
        if (data.code) {
            const existing = await ServiceType.findOne({ code: data.code.toUpperCase() });
            if (existing) throw createError('Service type with this code already exists', 400);
        }

        const serviceType = await ServiceType.create({
            ...data,
            code: data.code?.toUpperCase(),
        });
        return serviceType.toObject() as unknown as IServiceType;
    },

    async updateServiceType(id: string, data: Partial<IServiceType>): Promise<IServiceType> {
        const st = await ServiceType.findById(id);
        if (!st) throw createError('Service type not found', 404);

        if (data.code && data.code.toUpperCase() !== st.code) {
            const existing = await ServiceType.findOne({ code: data.code.toUpperCase() });
            if (existing) throw createError('Service type with this code already exists', 400);
        }

        if (data.code) data.code = data.code.toUpperCase();

        await ServiceType.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
        return this.getServiceType(id);
    },

    async deleteServiceType(id: string): Promise<IServiceType> {
        const st = await ServiceType.findById(id);
        if (!st) throw createError('Service type not found', 404);

        await ServiceType.findByIdAndUpdate(id, { $set: { status: 'inactive' } });
        return this.getServiceType(id);
    },
};
