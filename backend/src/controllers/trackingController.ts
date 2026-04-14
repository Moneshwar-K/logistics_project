import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { trackingService } from '../services/trackingService';

export const trackingController = {
  async quickTracking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hawb, awb, reference_number } = req.query;
      const tracking = await trackingService.quickTracking({ hawb, awb, reference_number } as any);
      
      res.json({
        success: true,
        data: tracking,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async getTrackingDetails(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shipmentId } = req.params;
      const tracking = await trackingService.getTrackingDetails(shipmentId);
      
      res.json({
        success: true,
        data: tracking,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async createTrackingEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('Authentication required');
      }

      const { shipmentId } = req.params;
      const eventData = req.body;
      const event = await trackingService.createTrackingEvent(shipmentId, eventData, req.user.id);
      
      res.status(201).json({
        success: true,
        data: event,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async getTrackingHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shipmentId } = req.params;
      const history = await trackingService.getTrackingHistory(shipmentId);
      
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

