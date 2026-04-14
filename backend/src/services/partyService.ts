import { createError } from '../middleware/errorHandler';
import { Party, IParty } from '../models';

export const partyService = {
    async listParties(filters: {
        party_type?: string;
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
    } = {}): Promise<{ data: IParty[]; total: number; page: number; limit: number }> {
        const { party_type, status = 'active', search, page = 1, limit = 50 } = filters;
        const query: any = {};

        if (party_type) query.party_type = party_type;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { iec_code: { $regex: search, $options: 'i' } },
                { gst_number: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            Party.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean<IParty[]>(),
            Party.countDocuments(query),
        ]);

        return { data: data as unknown as IParty[], total, page, limit };
    },

    async getParty(id: string): Promise<IParty> {
        const party = await Party.findById(id).lean<IParty>();
        if (!party) throw createError('Client not found', 404);
        return party as unknown as IParty;
    },

    async createParty(data: Partial<IParty>): Promise<IParty> {
        // Check for duplicate email
        if (data.email) {
            const existing = await Party.findOne({ email: data.email.toLowerCase() });
            if (existing) throw createError('Client with this email already exists', 400);
        }

        const party = await Party.create(data);
        return party.toObject() as unknown as IParty;
    },

    async updateParty(id: string, data: Partial<IParty>): Promise<IParty> {
        const party = await Party.findById(id);
        if (!party) throw createError('Client not found', 404);

        // Check email uniqueness if being changed
        if (data.email && data.email.toLowerCase() !== party.email) {
            const existing = await Party.findOne({ email: data.email.toLowerCase() });
            if (existing) throw createError('Client with this email already exists', 400);
        }

        await Party.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
        return this.getParty(id);
    },

    async deleteParty(id: string): Promise<IParty> {
        const party = await Party.findById(id);
        if (!party) throw createError('Client not found', 404);

        await Party.findByIdAndUpdate(id, { $set: { status: 'inactive' } });
        return this.getParty(id);
    },
};
