import { createError } from '../middleware/errorHandler';
import { Branch, IBranch } from '../models';

export const branchService = {
  async listBranches(filters: {
    branch_type?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: IBranch[]; total: number; page: number; limit: number }> {
    const { branch_type, status = 'active', search, page = 1, limit = 50 } = filters;
    const query: any = {};

    if (branch_type) query.branch_type = branch_type;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Branch.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean<IBranch[]>(),
      Branch.countDocuments(query),
    ]);

    return { data: data as unknown as IBranch[], total, page, limit };
  },

  async getBranch(id: string): Promise<IBranch> {
    const branch = await Branch.findById(id).lean<IBranch>();

    if (!branch) {
      throw createError('Branch not found', 404);
    }

    return branch as unknown as IBranch;
  },

  async createBranch(branchData: {
    name: string;
    code: string;
    address: string;
    city: string;
    country: string;
    contact_email: string;
    contact_phone: string;
    [key: string]: any;
  }): Promise<IBranch> {
    // Check if branch code already exists
    const existing = await Branch.findOne({ code: branchData.code.toUpperCase() });
    if (existing) {
      throw createError('Branch with this code already exists', 400);
    }

    const branch = await Branch.create({
      ...branchData,
      code: branchData.code.toUpperCase(),
      status: 'active',
    });

    return branch.toObject();
  },

  async updateBranch(id: string, updateData: any): Promise<IBranch> {
    const branch = await Branch.findById(id);
    if (!branch) {
      throw createError('Branch not found', 404);
    }

    // Check code uniqueness if code is being updated
    if (updateData.code && updateData.code !== branch.code) {
      const existing = await Branch.findOne({ code: updateData.code.toUpperCase() });
      if (existing) {
        throw createError('Branch with this code already exists', 400);
      }
      updateData.code = updateData.code.toUpperCase();
    }

    await Branch.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });

    return this.getBranch(id);
  },

  async deleteBranch(id: string): Promise<IBranch> {
    const branch = await Branch.findById(id);
    if (!branch) {
      throw createError('Branch not found', 404);
    }

    await Branch.findByIdAndUpdate(id, { $set: { status: 'inactive' } });
    return this.getBranch(id);
  },
};
