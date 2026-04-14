import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { shipmentService } from '../services/shipmentService';
import { createError } from '../middleware/errorHandler';

export const shipmentController = {
  async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { Shipment, TrackingEvent, Party } = (await import('../models'));
      const user = req.user!;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let query: any = {};
      if (user.role === 'customer') {
        const party = await Party.findOne({ email: user.email.toLowerCase() });
        if (party) {
          query = { $or: [{ shipper_id: party._id }, { consignee_id: party._id }] };
        } else {
          // If no party found for customer, return empty stats
          res.json({
            success: true,
            data: {
              active_shipments: 0,
              delivered_today: 0,
              pending_audits: 0,
              exceptions: 0,
              recent_activity: [],
            },
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }

      const [activeCount, deliveredTodayCount, pendingCount, exceptionCount, recentActivity] = await Promise.all([
        Shipment.countDocuments({ ...query, status: { $in: ['in_transit', 'pending', 'picked_up', 'in_port', 'customs_clearance', 'ready_for_delivery', 'out_for_delivery'] } }),
        Shipment.countDocuments({ ...query, status: 'delivered', updated_at: { $gte: today, $lt: tomorrow } }),
        Shipment.countDocuments({ ...query, status: 'pending' }),
        Shipment.countDocuments({ ...query, status: 'exception' }),
        TrackingEvent.find(user.role === 'customer' ? { shipment_id: { $in: await Shipment.find(query).distinct('_id') } } : {})
          .sort({ created_at: -1 })
          .limit(10)
          .populate({ path: 'shipment_id', select: 'hawb' })
          .lean(),
      ]);

      res.json({
        success: true,
        data: {
          active_shipments: activeCount,
          delivered_today: deliveredTodayCount,
          pending_audits: pendingCount,
          exceptions: exceptionCount,
          recent_activity: recentActivity.map((event: any) => ({
            time: event.created_at,
            action: `${event.status?.replace(/_/g, ' ')?.toUpperCase() || 'UPDATE'} - ${event.shipment_id?.hawb || 'N/A'}`,
            status: event.status === 'delivered' ? 'success' : 'info',
            remarks: event.remarks || '',
          })),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async listShipments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await shipmentService.listShipments(filters, page, limit, req.user);

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

  async getShipment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const shipment = await shipmentService.getShipmentById(id, req.user);

      res.json({
        success: true,
        data: shipment,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async getTracking(req: Request, res: Response) {
    try {
      const tracking = await shipmentService.getTracking(req.params.id);
      res.json({ success: true, data: tracking });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  },

  async updatePOD(req: Request, res: Response) {
    try {
      const { status, remarks } = req.body;
      const data = await shipmentService.updatePOD(req.params.id, status, { remarks });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getShipmentByHAWB(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hawb } = req.params;
      const shipment = await shipmentService.getShipmentByHAWB(hawb);

      res.json({
        success: true,
        data: shipment,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async createShipment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      const shipmentData = req.body;
      // Prefer branch_id from request body (sent by HAWB form), fall back to user's assigned branch
      const branchId = shipmentData.branch_id || shipmentData.origin_branch || req.user.branch_id;
      const shipment = await shipmentService.createShipment(shipmentData, req.user.id, branchId);

      res.status(201).json({
        success: true,
        data: shipment,
        message: 'Shipment created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async updateShipment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const shipment = await shipmentService.updateShipment(id, updateData);

      res.json({
        success: true,
        data: shipment,
        message: 'Shipment updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteShipment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await shipmentService.deleteShipment(id);

      res.json({
        success: true,
        message: 'Shipment deleted successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
};

