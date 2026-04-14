import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dutyBillService } from '../services/dutyBillService';

export const dutyBillController = {
  async listDutyBills(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await dutyBillService.listDutyBills(filters, page, limit);

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

  async createDutyBill(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dutyBillData = req.body;
      const dutyBill = await dutyBillService.createDutyBill(
        dutyBillData,
        req.user?.id || '',
        req.user?.branch_id || ''
      );

      res.status(201).json({
        success: true,
        data: dutyBill,
        message: 'Duty Bill created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async getDutyBill(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dutyBill = await dutyBillService.getDutyBillById(id);

      res.json({
        success: true,
        data: dutyBill,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
};
