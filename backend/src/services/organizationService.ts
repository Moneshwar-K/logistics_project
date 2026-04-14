import { Organization, IOrganization } from '../models';

export const organizationService = {
    async getOrganization(): Promise<IOrganization | null> {
        // Singleton — only one org document
        const org = await Organization.findOne().lean();
        return org as IOrganization | null;
    },

    async updateOrganization(data: Partial<IOrganization>): Promise<IOrganization> {
        // Upsert — create if not exists, update if exists
        const org = await Organization.findOneAndUpdate(
            {},
            { $set: data },
            { new: true, upsert: true, runValidators: true }
        );
        return org.toObject();
    },
};
