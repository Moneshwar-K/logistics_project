import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ewayBillService } from '../services/ewayBillService';

export const ewayBillController = {
  async listEWayBills(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await ewayBillService.listEWayBills(filters, page, limit);
      
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

  async createEWayBill(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ewayBillData = req.body;
      const createdById = req.user?.id || '';
      const branchId = req.user?.branch_id || '';
      
      const ewayBill = await ewayBillService.createEWayBill(ewayBillData, createdById, branchId);
      
      res.status(201).json({
        success: true,
        data: ewayBill,
        message: 'E-way bill created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async getEWayBill(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const ewayBill = await ewayBillService.getEWayBill(id);
      
      res.json({
        success: true,
        data: ewayBill,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async updateEWayBill(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const ewayBill = await ewayBillService.updateEWayBill(id, updateData);
      
      res.json({
        success: true,
        data: ewayBill,
        message: 'E-way bill updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async cancelEWayBill(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const cancelledById = req.user?.id;
      
      const ewayBill = await ewayBillService.cancelEWayBill(id, reason, cancelledById);
      
      res.json({
        success: true,
        data: ewayBill,
        message: 'E-way bill cancelled successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async getStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const status = await ewayBillService.getStatus(id);
      
      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
};
