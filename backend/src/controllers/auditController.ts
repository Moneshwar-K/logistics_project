import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { auditService } from '../services/auditService';
import { createError } from '../middleware/errorHandler';

export const auditController = {
  async getDashboard(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dashboard = await auditService.getDashboard();

      res.json({
        success: true,
        data: dashboard,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async listHAWBAudits(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await auditService.listHAWBAudits(filters, page, limit);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async createAudit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      const { hawb } = req.params;
      const auditData = req.body;
      const audit = await auditService.createAudit(
        hawb,
        auditData,
        req.user.id,
        req.user.branch_id
      );

      res.status(201).json({
        success: true,
        data: audit,
        message: 'Audit created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async getAudit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hawb } = req.params;
      const audit = await auditService.getAudit(hawb);

      res.json({
        success: true,
        data: audit,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async updateAudit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hawb } = req.params;
      const updateData = req.body;
      const audit = await auditService.updateAudit(hawb, updateData);

      res.json({
        success: true,
        data: audit,
        message: 'Audit updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
};
