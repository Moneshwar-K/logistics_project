import { createError } from '../middleware/errorHandler';
import { User, IUser, UserRole } from '../models';
import { hashPassword } from '../utils/password';
import { Shipment } from '../models';
import mongoose from 'mongoose';

export const userService = {
  async listUsers(filters: any, page: number, limit: number) {
    const query: any = {};

    // Apply filters
    if (filters.role) {
      query.role = filters.role;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.branch_id) {
      query.branch_id = new mongoose.Types.ObjectId(filters.branch_id);
    }
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Get total count
    const total = await User.countDocuments(query);

    // Apply pagination
    const offset = (page - 1) * limit;
    const data = await User.find(query)
      .populate('branch_id', '-__v')
      .select('-password_hash')
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(offset)
      .lean<IUser[]>();

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  },

  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    branch_id?: string;
    phone?: string;
    vehicle_number?: string;
    license_number?: string;
  }): Promise<IUser> {
    // Check if user already exists
    const existing = await User.findOne({ email: userData.email.toLowerCase() });
    if (existing) {
      throw createError('User with this email already exists', 400);
    }

    // Hash password
    const password_hash = await hashPassword(userData.password);

    // Create user
    const user = await User.create({
      email: userData.email.toLowerCase(),
      password_hash,
      name: userData.name,
      role: userData.role,
      branch_id: userData.branch_id ? new mongoose.Types.ObjectId(userData.branch_id) : undefined,
      status: 'active',
      phone: userData.phone || undefined,
      vehicle_number: userData.vehicle_number || undefined,
      license_number: userData.license_number || undefined,
    });

    const userObj = user.toObject();
    delete userObj.password_hash;
    return userObj as IUser;
  },

  async getUser(id: string): Promise<IUser> {
    const user = await User.findById(id)
      .populate('branch_id', '-__v')
      .select('-password_hash')
      .lean<IUser>();

    if (!user) {
      throw createError('User not found', 404);
    }

    return user as unknown as IUser;
  },

  async updateUser(id: string, updateData: any): Promise<IUser> {
    const user = await User.findById(id);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password_hash = await hashPassword(updateData.password);
      delete updateData.password;
    }

    // Convert branch_id to ObjectId if provided
    if (updateData.branch_id) {
      updateData.branch_id = new mongoose.Types.ObjectId(updateData.branch_id);
    }

    await User.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });

    return this.getUser(id);
  },

  async deleteUser(id: string): Promise<void> {
    const user = await User.findById(id);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Don't allow deletion of users with active shipments
    const activeShipments = await Shipment.findOne({
      created_by_id: id,
      status: { $nin: ['delivered', 'cancelled'] },
    });

    if (activeShipments) {
      throw createError('Cannot delete user with active shipments', 400);
    }

    // Soft delete - set status to inactive
    await User.findByIdAndUpdate(id, { $set: { status: 'inactive' } });
  },

  async getUsersByRole(role: UserRole): Promise<IUser[]> {
    const users = await User.find({ role, status: 'active' })
      .select('_id name email phone vehicle_number license_number')
      .lean();

    return users as unknown as IUser[];
  },
};
