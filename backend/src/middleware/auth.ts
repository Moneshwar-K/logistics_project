import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';
import { User } from '../models';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    branch_id: string;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  branchId: string;
}

// Verify JWT token
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Authentication required', 401);
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw createError('JWT secret not configured', 500);
    }

    // Verify token
    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Check if user still exists and is active
    const user = await User.findOne({
      _id: decoded.userId,
      status: 'active',
    });

    if (!user) {
      throw createError('User not found or inactive', 401);
    }

    // Attach user to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      branch_id: user.branch_id?.toString() || '',
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(createError('Invalid or expired token', 401));
    } else {
      next(error);
    }
  }
}

// Role-based authorization
export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(createError('Authentication required', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(createError('Insufficient permissions', 403));
      return;
    }

    next();
  };
}

// Check if user owns resource or is admin
export function authorizeResource(ownerIdField: string = 'created_by_id') {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      next(createError('Authentication required', 401));
      return;
    }

    // Admins can access any resource
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // For other roles, check ownership
    const resourceId = req.params.id;
    if (!resourceId) {
      next(createError('Resource ID required', 400));
      return;
    }

    // This is a placeholder - actual implementation depends on the resource type
    // Each route should implement its own ownership check
    next();
  };
}

