import { Response, NextFunction } from 'express';
import { AuthRequest, JWTPayload, authenticate } from './auth';
import { createError } from './errorHandler';

/**
 * Middleware to ensure the authenticated user is a staff member (not a customer)
 */
export async function authenticateStaff(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // First run general authentication
  await authenticate(req, res, async (err) => {
    if (err) {
      return next(err);
    }

    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    // Role check: Reject customers from staff routes
    const staffRoles = ['admin', 'operations', 'finance', 'driver', 'agent'];
    if (!staffRoles.includes(req.user.role)) {
      return next(createError('Access denied. Staff only.', 403));
    }

    next();
  });
}

/**
 * Higher-order middleware for role-based authorization within staff roles
 */
export function authorizeStaff(...allowedRoles: string[]) {
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
