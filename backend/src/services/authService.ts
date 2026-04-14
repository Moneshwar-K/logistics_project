import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { createError } from '../middleware/errorHandler';
import { User, IUser } from '../models';
import mongoose from 'mongoose';

interface SignupData {
  email: string;
  password: string;
  name: string;
  branch_id?: string;
  role: string;
}

export const authService = {
  async login(email: string, password: string, portal?: 'staff' | 'customer') {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw createError('Invalid email or password', 401);
    }

    // Check password
    if (!user.password_hash) {
      throw createError('Invalid email or password', 401);
    }
    const isValid = await comparePassword(password, user.password_hash);

    if (!isValid) {
      throw createError('Invalid email or password', 401);
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw createError('Account is inactive', 403);
    }

    // Portal validation
    if (portal === 'staff') {
      const staffRoles = ['admin', 'operations', 'finance', 'driver', 'agent'];
      if (!staffRoles.includes(user.role)) {
        throw createError('Access denied. This portal is for staff only.', 403);
      }
    } else if (portal === 'customer') {
      if (user.role !== 'customer') {
        throw createError('Access denied. This portal is for customers only.', 403);
      }
    }

    // Generate tokens
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      branchId: user.branch_id?.toString() || '',
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      branchId: user.branch_id?.toString() || '',
    });

    // Remove password from response
    const userObj = user.toObject();
    delete userObj.password_hash;

    return {
      user: userObj,
      token,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };
  },

  async signup(data: SignupData) {
    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });

    if (existingUser) {
      throw createError('User with this email already exists', 400);
    }

    // Hash password
    const password_hash = await hashPassword(data.password);

    // Create user
    const user = await User.create({
      email: data.email.toLowerCase(),
      password_hash,
      name: data.name,
      role: data.role,
      branch_id: data.branch_id ? new mongoose.Types.ObjectId(data.branch_id) : undefined,
      status: 'active',
    });

    // Generate tokens
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      branchId: user.branch_id?.toString() || '',
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      branchId: user.branch_id?.toString() || '',
    });

    // Remove password from response
    const userObj = user.toObject();
    delete userObj.password_hash;

    return {
      user: userObj,
      token,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  },

  async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId).populate('branch_id');

    if (!user) {
      throw createError('User not found', 404);
    }

    const userObj = user.toObject();
    delete userObj.password_hash;
    return userObj as IUser;
  },

  async refreshToken(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);

      // Get user
      const user = await User.findById(payload.userId);

      if (!user || user.status !== 'active') {
        throw createError('Invalid refresh token', 401);
      }

      // Generate new tokens
      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        branchId: user.branch_id?.toString() || '',
      });

      const newRefreshToken = generateRefreshToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        branchId: user.branch_id?.toString() || '',
      });

      return {
        token,
        refresh_token: newRefreshToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    } catch (error: any) {
      throw createError('Invalid refresh token', 401);
    }
  },
};
