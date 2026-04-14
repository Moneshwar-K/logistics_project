import { Response, NextFunction } from 'express';
import { AuthRequest, authenticate } from './auth';
import { createError } from './errorHandler';

/**
 * Middleware to ensure the authenticated user is a customer
 */
export async function authenticateCustomer(
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

    // Role check: Only allow customers
    if (req.user.role !== 'customer') {
      return next(createError('Access denied. Customer portal only.', 403));
    }

    next();
  });
}
