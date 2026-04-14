import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { authService } from '../services/authService';
import { createError } from '../middleware/errorHandler';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, portal } = req.body;

      if (!email || !password) {
        throw createError('Email and password are required', 400);
      }

      const result = await authService.login(email, password, portal);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name, branch_id, role } = req.body;

      if (!email || !password || !name) {
        throw createError('Email, password, and name are required', 400);
      }

      if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        throw createError('Password must be at least 8 characters long and contain at least one uppercase letter and one number', 400);
      }

      const result = await authService.signup({
        email,
        password,
        name,
        branch_id,
        role: role || 'operations',
      });

      res.status(201).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw createError('User not found', 401);
      }

      const user = await authService.getUserById(req.user.id);

      res.json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // In a stateless JWT system, logout is handled client-side
      // You could implement token blacklisting here if needed
      res.json({
        success: true,
        message: 'Logged out successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        throw createError('Refresh token is required', 400);
      }

      const result = await authService.refreshToken(refresh_token);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
};

