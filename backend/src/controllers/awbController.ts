import { Request, Response, NextFunction } from 'express';
import { awbService } from '../services/awbService';

export const awbController = {
    // Create AWB
    createAwb: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const awbData = {
                ...req.body,
                created_by_id: (req as any).user?.id,
            };
            const awb = await awbService.createAwb(awbData);
            res.status(201).json({ success: true, data: awb });
        } catch (error) {
            next(error);
        }
    },

    // List AWBs
    listAwbs: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const filters = {
                status: req.query.status as string,
                airline: req.query.airline as string,
                awb_number: req.query.awb_number as string,
            };

            const result = await awbService.listAwbs(filters, page, limit);
            res.json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    },

    // Get AWB by ID
    getAwb: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const awb = await awbService.getAwbById(req.params.id);
            res.json({ success: true, data: awb });
        } catch (error) {
            next(error);
        }
    },

    // Update AWB
    updateAwb: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const awb = await awbService.updateAwb(req.params.id, req.body);
            res.json({ success: true, data: awb });
        } catch (error) {
            next(error);
        }
    },

    // Add Shipments to AWB
    addShipments: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { shipment_ids } = req.body;
            if (!Array.isArray(shipment_ids)) {
                res.status(400).json({ success: false, message: 'shipment_ids must be an array' });
                return;
            }

            const awb = await awbService.addShipmentsToAwb(req.params.id, shipment_ids);
            res.json({ success: true, data: awb });
        } catch (error) {
            next(error);
        }
    },

    // Remove Shipment from AWB
    removeShipment: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { shipment_id } = req.body;
            if (!shipment_id) {
                res.status(400).json({ success: false, message: 'shipment_id is required' });
                return;
            }

            const awb = await awbService.removeShipmentFromAwb(req.params.id, shipment_id);
            res.json({ success: true, data: awb });
        } catch (error) {
            next(error);
        }
    }
};
