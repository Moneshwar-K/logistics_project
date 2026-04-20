import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { reportService } from '../services/reportService';

export const reportController = {
  async getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dashboard = await reportService.getDashboard(req.user);
      
      res.json({
        success: true,
        data: dashboard,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async getShipmentReports(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query;
      const reports = await reportService.getShipmentReports(filters as any, req.user);
      
      res.json({
        success: true,
        data: reports,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async getBillingReports(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query;
      const reports = await reportService.getBillingReports(filters as any, req.user);
      
      res.json({
        success: true,
        data: reports,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async getRevenueReports(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query;
      const reports = await reportService.getRevenueReports(filters as any, req.user);
      
      res.json({
        success: true,
        data: reports,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async getPerformanceReports(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query;
      const reports = await reportService.getPerformanceReports(filters as any);
      
      res.json({
        success: true,
        data: reports,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async getBranchRevenue(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query;
      const data = await reportService.getBranchRevenueReport(filters as any);

      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
};
