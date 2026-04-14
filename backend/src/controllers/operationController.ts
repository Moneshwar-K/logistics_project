import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { operationService } from '../services/operationService';

export const operationController = {
  async updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      const statusData = req.body;
      const update = await operationService.updateStatus(
        statusData,
        req.user.id,
        req.user.branch_id
      );
      
      res.json({
        success: true,
        data: update,
        message: 'Status updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async getHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shipmentId } = req.params;
      const history = await operationService.getHistory(shipmentId);
      
      res.json({
        success: true,
        data: history,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
};

