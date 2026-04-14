import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { driverService } from '../services/driverService';

export const driverController = {
  async listAssignments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query;
      const assignments = await driverService.listAssignments(filters as any);
      
      res.json({
        success: true,
        data: assignments,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async getDriverAssignments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { driverId } = req.params;
      const assignments = await driverService.getDriverAssignments(driverId);
      
      res.json({
        success: true,
        data: assignments,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async assignShipment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      const { shipment_id, driver_id } = req.body;
      const assignment = await driverService.assignShipment(
        shipment_id,
        driver_id,
        req.user.id
      );
      
      res.status(201).json({
        success: true,
        data: assignment,
        message: 'Shipment assigned successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, location } = req.body;
      const assignment = await driverService.updateStatus(id, status, location);
      
      res.json({
        success: true,
        data: assignment,
        message: 'Assignment status updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async completeAssignment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const completionData = req.body;
      const assignment = await driverService.completeAssignment(id, completionData);
      
      res.json({
        success: true,
        data: assignment,
        message: 'Assignment completed successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
};
